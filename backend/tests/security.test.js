const request = require('supertest');
const mongoose = require('mongoose');

// Ensure test environment variables
process.env.API_KEY = 'test_secret_api_key_secure_12345';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:5174';

const app = require('../server');
const { assertConfig } = require('../server');

describe('Task 1 - Security Verification Tests', () => {
  afterAll(async () => {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('(a) Request to protected route (/api/predict) with NO key returns 401', async () => {
    const res = await request(app)
      .post('/api/predict')
      .send({
        attendance_pct: 75,
        overall_gpa: 7.5,
        backlogs_count: 0,
        department: 'CSE'
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  test('(b) Request with WRONG key returns 401', async () => {
    const res = await request(app)
      .post('/api/predict')
      .set('X-API-Key', 'invalid_random_wrong_key')
      .send({
        attendance_pct: 75,
        overall_gpa: 7.5,
        backlogs_count: 0,
        department: 'CSE'
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid X-API-Key/i);
  });

  test('(c) Request with RIGHT key and valid payload returns 200', async () => {
    const res = await request(app)
      .post('/api/predict')
      .set('X-API-Key', process.env.API_KEY)
      .send({
        attendance_pct: 75,
        overall_gpa: 7.5,
        backlogs_count: 0,
        department: 'CSE'
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prediction');
  });

  test('(d) Disallowed origin is rejected with CORS 403', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://malicious-attacker-domain.com');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  test('(e) GET /api/meetings WITHOUT key returns 401', async () => {
    const res = await request(app).get('/api/meetings');
    expect(res.status).toBe(401);
  });

  test('(f) Invalid payload to /api/predict returns 422 with validation errors', async () => {
    const res = await request(app)
      .post('/api/predict')
      .set('X-API-Key', process.env.API_KEY)
      .send({
        attendance_pct: 150, // invalid: > 100
        overall_gpa: -2,      // invalid: < 0
        backlogs_count: -1,   // invalid: < 0
        department: 'INVALID_DEPT_XYZ'
      });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('Unprocessable Entity');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('(g) Server refuses to boot with API_KEY unset', () => {
    const originalKey = process.env.API_KEY;
    try {
      delete process.env.API_KEY;
      expect(() => assertConfig()).toThrow(/API_KEY/);
    } finally {
      process.env.API_KEY = originalKey;
    }
  });
});
