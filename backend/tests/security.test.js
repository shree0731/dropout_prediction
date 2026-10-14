const request = require('supertest');
const mongoose = require('mongoose');

// Ensure test environment variables
process.env.API_KEY = 'test_secret_api_key_secure_12345';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:5174';

jest.mock('../services/mlServiceClient', () => ({
  predictStudent: jest.fn(async (payload) => ({
    student_id: payload.student_id || 'STU_TEST',
    prediction: 'Low',
    probabilities: { Low: 0.9, Medium: 0.05, High: 0.05 },
    top_risk_drivers: [],
    recommended_interventions: []
  })),
  sendChat: jest.fn(),
  getMetrics: jest.fn(),
  checkHealth: jest.fn(async () => ({ status: 'healthy' }))
}));
const mlServiceClient = require('../services/mlServiceClient');

const FULL_PAYLOAD = {
  student_id: 'STU_TEST_FULL',
  department: 'Mechanical',
  year_of_study: 3,
  attendance_pct: 75,
  attendance_decay: 1.5,
  overall_gpa: 7.5,
  backlogs_count: 0,
  cutoff_mark_200: 170,
  mentor_meetings_attended: 2,
  family_income_annual: 400000,
  first_gen_learner: 0,
  distance_from_home_km: 25,
  failed_subjects_count: 0,
  core_theory_average: 70,
  internal_exam_avg: 35,
  assignment_avg: 7,
  grade_trend: 0.2
};

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
      .send(FULL_PAYLOAD);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('prediction');
  });

  test('(c2) Trained department names (e.g. Mechanical, Cyber Security) are accepted and forwarded as-is', async () => {
    for (const department of ['Mechanical', 'Civil', 'Cyber Security', 'CSD', 'Robotics', 'Automobile']) {
      const res = await request(app).post('/api/predict').set('X-API-Key', process.env.API_KEY)
        .send({ ...FULL_PAYLOAD, department });
      expect(res.status).toBe(200);
    }
    const last = mlServiceClient.predictStudent.mock.calls.pop()[0];
    expect(last.department).toBe('Automobile');
  });

  test('(c3) Legacy code MECH is normalised to Mechanical', async () => {
    const res = await request(app).post('/api/predict').set('X-API-Key', process.env.API_KEY)
      .send({ ...FULL_PAYLOAD, department: 'MECH' });
    expect(res.status).toBe(200);
    expect(mlServiceClient.predictStudent.mock.calls.pop()[0].department).toBe('Mechanical');
  });

  test('(c4) Real-data extremes are accepted (backlogs up to 59)', async () => {
    const res = await request(app).post('/api/predict').set('X-API-Key', process.env.API_KEY)
      .send({ ...FULL_PAYLOAD, backlogs_count: 59, failed_subjects_count: 59 });
    expect(res.status).toBe(200);
  });

  test('(c5) NO silent defaults: omitting a model feature is a 422, not a guessed value', async () => {
    for (const field of ['internal_exam_avg', 'assignment_avg', 'grade_trend', 'core_theory_average',
                         'failed_subjects_count', 'cutoff_mark_200', 'family_income_annual',
                         'mentor_meetings_attended', 'distance_from_home_km', 'first_gen_learner', 'year_of_study']) {
      const body = { ...FULL_PAYLOAD };
      delete body[field];
      const res = await request(app).post('/api/predict').set('X-API-Key', process.env.API_KEY).send(body);
      expect([field, res.status]).toEqual([field, 422]);
    }
  });

  test('(c6) ML service down returns 503, never fabricated probabilities', async () => {
    mlServiceClient.predictStudent.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await request(app).post('/api/predict').set('X-API-Key', process.env.API_KEY).send(FULL_PAYLOAD);
    expect(res.status).toBe(503);
    expect(res.body).not.toHaveProperty('probabilities');
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
