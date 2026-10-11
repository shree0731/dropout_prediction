const request = require('supertest');
const crypto = require('crypto');
const app = require('../server');
const { createSessionToken } = require('../middleware/auth');

describe('Session Token & Chat Context Hardening (Task 5)', () => {
  const allowedOrigin = 'http://localhost:5174';
  const disallowedOrigin = 'http://unauthorized-attacker.xyz';

  test('GET /api/session-token rejects request with missing Origin header', async () => {
    const res = await request(app).get('/api/session-token');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  test('GET /api/session-token rejects request with unauthorized Origin', async () => {
    const res = await request(app)
      .get('/api/session-token')
      .set('Origin', disallowedOrigin);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  test('GET /api/session-token issues token for authorized Origin with valid scope and 15m TTL', async () => {
    const res = await request(app)
      .get('/api/session-token')
      .set('Origin', allowedOrigin);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.expires_in).toBe(900);
    expect(res.body.scope).toEqual(['predict', 'chat']);

    const [payloadB64] = res.body.token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    expect(payload.sub).toBe('frontend-demo-client');
    expect(payload.scope).toContain('predict');
    expect(payload.scope).toContain('chat');
    expect(payload.exp).toBeGreaterThan(Date.now());
    expect(payload.exp - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000 + 5000);
  });

  test('Authorization: Bearer <session-token> allows access to /api/chat', async () => {
    const token = createSessionToken();

    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'What is the attendance policy?'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('disclaimer');
  });

  test('Session token is barred from administrative routes (GET /api/meetings requires X-API-Key)', async () => {
    const token = createSessionToken();

    const res = await request(app)
      .get('/api/meetings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized/);
  });

  test('Session-token caller cannot spoof student marks/attendance context', async () => {
    const token = createSessionToken();

    // Attacker tries to inject fake context: attendance 10%, 15 backlogs, GPA 1.2
    const res = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'Hello advisor, how am I doing?',
        student_context: {
          student_id: 'UNKNOWN_OR_SPOOFED',
          attendance_pct: 10.0,
          backlogs_count: 15,
          overall_gpa: 1.2,
          student_name: 'Hacker'
        }
      });

    expect(res.status).toBe(200);
    // The server ignores client-spoofed 10% attendance and 15 backlogs, using server ground truth
    expect(res.body.reply).not.toContain('10%');
    expect(res.body.reply).not.toContain('15 active backlog');
  });

  test('Tampered or expired session token is rejected with 401', async () => {
    // 1. Tampered signature
    const validToken = createSessionToken();
    const tamperedToken = validToken.substring(0, validToken.length - 5) + 'xxxxx';

    const resTampered = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .send({ message: 'Hello' });
    expect(resTampered.status).toBe(401);

    // 2. Expired token
    const sessionSecret = process.env.SESSION_SECRET;
    const expiredPayload = {
      sub: 'frontend-demo-client',
      scope: ['predict', 'chat'],
      iat: Date.now() - 3600000,
      exp: Date.now() - 1000 // Expired 1 second ago
    };
    const b64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
    const sig = crypto.createHmac('sha256', sessionSecret).update(b64).digest('base64url');
    const expiredToken = `${b64}.${sig}`;

    const resExpired = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ message: 'Hello' });
    expect(resExpired.status).toBe(401);
  });

  test('createSessionToken refuses execution if SESSION_SECRET equals API_KEY', () => {
    const originalSecret = process.env.SESSION_SECRET;
    try {
      process.env.SESSION_SECRET = process.env.API_KEY;
      expect(() => createSessionToken()).toThrow(/SESSION_SECRET cannot equal API_KEY/);
    } finally {
      process.env.SESSION_SECRET = originalSecret;
    }
  });
});
