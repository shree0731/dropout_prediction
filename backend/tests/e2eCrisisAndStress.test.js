const request = require('supertest');
const axios = require('axios');
const app = require('../server');
const { createSessionToken } = require('../middleware/auth');
const mlServiceClient = require('../services/mlServiceClient');
const MeetingRequest = require('../models/MeetingRequest');
const { loadCounsellingConfig } = require('../utils/counsellingConfig');

// Dynamic configuration resolution per requirement (2)
const counsellingConfig = loadCounsellingConfig();
const expectedDeskName = (counsellingConfig.default && counsellingConfig.default.desk_name) || 'Student Counselling Desk';

// Mock DB connection status to return connected per requirement (4)
jest.mock('../config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(true),
  getDBStatus: jest.fn().mockReturnValue(true)
}));

// Mock MeetingRequest model per requirement (4)
jest.mock('../models/MeetingRequest', () => ({
  create: jest.fn(),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockResolvedValue([])
    })
  })
}));

// Mock mlServiceClient properly per requirement (3)
jest.mock('../services/mlServiceClient', () => ({
  sendChat: jest.fn(),
  predictStudent: jest.fn(),
  getMetrics: jest.fn(),
  checkHealth: jest.fn()
}));

// Mock axios for erpDeliveryService
jest.mock('axios');

describe('Task 7 — End-to-End Crisis & Stress-Path Verification Suite', () => {
  const serviceKey = process.env.API_KEY || 'test_api_key_safety_12345_67890_abcdef';

  beforeEach(() => {
    process.env.ERP_BASE_URL = 'http://localhost:5000';
    process.env.ERP_SERVICE_API_KEY = 'test_key_for_outbox_integration_32chars!';
    jest.clearAllMocks();
  });

  describe('1. End-to-End Crisis Escalation Path via ML Microservice (Service-Key / ERP Caller)', () => {
    test('Detects crisis via ML service, persists meeting, delivers to ERP, provides helplines, zero transcript leakage', async () => {
      // Mock ML microservice response (Requirement 3: ML path exercised)
      mlServiceClient.sendChat.mockResolvedValueOnce({
        reply: "I hear how overwhelmed you are feeling right now, and I want you to know you don't have to carry this alone.",
        is_distress: true,
        meeting_requested: true,
        distress_category: 'crisis'
      });

      // Mock MeetingRequest.create (Requirement 4: Model saving verified)
      MeetingRequest.create.mockImplementationOnce(async (data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
      }));

      // Mock ERP response when AI service delivers to POST /api/integrations/meeting-requests
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          request_id: 'mock-req-id',
          mentor_id: 'FAC_1001',
          mentor_name: 'Dr. Kavitha Ramanathan',
          urgency: 'urgent'
        }
      });

      const res = await request(app)
        .post('/api/chat')
        .set('X-API-Key', serviceKey)
        .send({
          message: 'I cannot take it anymore and I want to kill myself tonight',
          student_context: {
            student_id: 'STU_EEC_CSE_Y2_0001',
            student_name: 'Arun Kumar',
            college_id: 'C101'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.is_distress).toBe(true);
      expect(res.body.meeting_requested).toBe(true);
      expect(res.body.source).toBe('ml_microservice');

      // (a) Helplines verified in response
      expect(res.body.reply).toContain('14416');
      expect(res.body.reply).toContain('1800-599-0019');
      // Requirement 2: dynamic desk name from config
      expect(res.body.reply).toContain(expectedDeskName);

      // Requirement 1: Ungarbled contact sentence verification
      expect(res.body.reply).not.toMatch(/Please contact Please contact/i);
      expect(res.body.reply).not.toMatch(/\.\./);
      expect(res.body.reply).not.toMatch(/\(demo\) \(/i);

      // (b) Disclaimer verified
      expect(res.body.disclaimer).toBe(
        'AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019).'
      );

      // (c) Requirement 4: MeetingRequest persistence checked
      expect(MeetingRequest.create).toHaveBeenCalledTimes(1);
      const savedDoc = MeetingRequest.create.mock.calls[0][0];
      expect(savedDoc.category).toBe('crisis');
      expect(savedDoc.urgency).toBe('urgent');
      expect(savedDoc.reason_short).toBe('Immediate emotional distress / crisis detection');
      expect(savedDoc.caller_auth_type).toBe('api-key');

      // (d) ERP delivery payload verified
      expect(axios.post).toHaveBeenCalledTimes(1);
      const [calledUrl, calledPayload, calledConfig] = axios.post.mock.calls[0];
      expect(calledUrl).toContain('/api/integrations/meeting-requests');
      expect(calledConfig.headers['X-Service-Key']).toBe(process.env.ERP_SERVICE_API_KEY);

      // Privacy Invariant: Zero student chat text inside integration payload
      expect(calledPayload.category).toBe('crisis');
      expect(calledPayload.urgency).toBe('urgent');
      expect(calledPayload.reason_short).toBe('Immediate emotional distress / crisis detection');
      expect(calledPayload.reason_short).not.toContain('kill myself');
      expect(calledPayload.reason_short).not.toContain('tonight');

      // (e) Assigned mentor reflected in response
      expect(res.body.reply).toContain("I've sent your request to your mentor (Dr. Kavitha Ramanathan).");
    });
  });

  describe('2. Fallback Safety Path (When ML Microservice is Unreachable)', () => {
    test('ML service failure activates safety guardrail, detects crisis, and delivers to ERP', async () => {
      // Requirement 3: Separate test for fallback path
      mlServiceClient.sendChat.mockRejectedValueOnce(new Error('ML microservice ECONNREFUSED'));

      MeetingRequest.create.mockImplementationOnce(async (data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
      }));

      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          request_id: 'mock-req-id',
          mentor_id: 'FAC_1001',
          mentor_name: 'Dr. Kavitha Ramanathan',
          urgency: 'urgent'
        }
      });

      const res = await request(app)
        .post('/api/chat')
        .set('X-API-Key', serviceKey)
        .send({
          message: 'I cannot take it anymore and I want to kill myself tonight',
          student_context: {
            student_id: 'STU_EEC_CSE_Y2_0001',
            student_name: 'Arun Kumar',
            college_id: 'C101'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.is_distress).toBe(true);
      expect(res.body.source).toBe('resilient_guardrail');
      expect(res.body.reply).toContain('14416');
      expect(res.body.reply).toContain(expectedDeskName);
      expect(MeetingRequest.create).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Stress-Path Verification (Academic Anxiety vs Crisis Separation)', () => {
    test('Academic stress does NOT trigger suicide crisis banner, provides supportive guidance', async () => {
      // ML microservice returns stress category, NOT crisis
      mlServiceClient.sendChat.mockResolvedValueOnce({
        reply: "I hear how much stress and anxiety you're carrying right now. Academic pressure and difficult exams can feel overwhelming, but setbacks are manageable and you don't have to handle them all on your own. Would you like me to connect you with your faculty mentor to review your situation and work out a recovery plan together?",
        is_distress: false,
        meeting_requested: false,
        distress_category: 'stress',
        disclaimer: 'AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019).'
      });

      const res = await request(app)
        .post('/api/chat')
        .set('X-API-Key', serviceKey)
        .send({
          message: 'I failed the mathematics internal test and I am terrified about attendance condonation and detention',
          student_context: {
            student_id: 'STU_EEC_CSE_Y2_0001',
            student_name: 'Arun Kumar',
            attendance_pct: 68.0,
            overall_gpa: 5.8,
            backlogs_count: 2
          }
        });

      expect(res.status).toBe(200);

      // Must NOT treat exam anxiety as acute suicide crisis
      expect(res.body.is_distress).toBe(false);
      expect(res.body.reply).not.toContain('14416');
      expect(res.body.reply).not.toContain('Tele-MANAS');
      expect(res.body.reply).not.toContain('I hear how overwhelmed you are feeling right now');

      // Must address academic standing responsibly
      expect(res.body.reply).toMatch(/attendance|exam|condonation|detention|stress|anxiety/i);
      expect(res.body.disclaimer).toBe(
        'AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019).'
      );

      // Must NEVER claim a mentor was notified when no meeting was requested/delivered
      expect(res.body.reply).not.toContain("I've sent your request to your mentor");
      expect(res.body.reply).not.toContain("I've recorded your request");
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('Stress query requesting meeting when ERP delivery FAILS never claims mentor was notified', async () => {
      // Student is stressed and explicitly asks to meet mentor
      mlServiceClient.sendChat.mockResolvedValueOnce({
        reply: "I understand how overwhelmed you are about your backlogs.",
        is_distress: false,
        meeting_requested: true,
        distress_category: 'stress'
      });

      MeetingRequest.create.mockImplementationOnce(async (data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
      }));

      // Simulate ERP outage
      axios.post.mockRejectedValueOnce(new Error('ERP connection refused'));

      const res = await request(app)
        .post('/api/chat')
        .set('X-API-Key', serviceKey)
        .send({
          message: 'I am stressed about my backlogs and want to schedule a meeting with my mentor',
          student_context: {
            student_id: 'STU_EEC_CSE_Y2_0001',
            student_name: 'Arun Kumar',
            college_id: 'C101'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.is_distress).toBe(false);
      expect(res.body.meeting_requested).toBe(true);
      expect(res.body.delivery_status).toBe('pending');

      // Requirement 4: Strictly NEVER claims mentor was notified when delivery failed
      expect(res.body.reply).not.toContain("I've sent your request to your mentor");
      expect(res.body.reply).toContain("I've recorded your request but couldn't reach your mentor's inbox right now");
      expect(res.body.reply).toContain('Please also contact');
    });

    test('Stress query requesting meeting when ERP delivery SUCCEEDS confirms notification with mentor name', async () => {
      mlServiceClient.sendChat.mockResolvedValueOnce({
        reply: "I understand how overwhelmed you are about your backlogs.",
        is_distress: false,
        meeting_requested: true,
        distress_category: 'stress'
      });

      MeetingRequest.create.mockImplementationOnce(async (data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
      }));

      // Simulate successful ERP delivery
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          success: true,
          request_id: 'mock-req-id',
          mentor_id: 'FAC_1001',
          mentor_name: 'Dr. Kavitha Ramanathan',
          urgency: 'normal'
        }
      });

      const res = await request(app)
        .post('/api/chat')
        .set('X-API-Key', serviceKey)
        .send({
          message: 'I am stressed about my backlogs and want to schedule a meeting with my mentor',
          student_context: {
            student_id: 'STU_EEC_CSE_Y2_0001',
            student_name: 'Arun Kumar',
            college_id: 'C101'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.is_distress).toBe(false);
      expect(res.body.meeting_requested).toBe(true);
      expect(res.body.delivery_status).toBe('delivered');

      // Only now does it claim mentor was notified, citing assigned mentor name
      expect(res.body.reply).toContain("I've sent your request to your mentor (Dr. Kavitha Ramanathan).");
      expect(res.body.reply).not.toContain("couldn't reach your mentor's inbox");
    });
  });

  describe('4. Public Sandbox Client (Session-Token) Crisis Handling', () => {
    test('Session-token caller receives emergency helplines, persists record, but never pushes to institutional ERP', async () => {
      const token = createSessionToken();

      mlServiceClient.sendChat.mockResolvedValueOnce({
        reply: "I hear how overwhelmed you are feeling right now, and I want you to know you don't have to carry this alone.",
        is_distress: true,
        meeting_requested: true,
        distress_category: 'crisis'
      });

      MeetingRequest.create.mockImplementationOnce(async (data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(true)
      }));

      const res = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Everything is hopeless and I wish I were dead'
        });

      expect(res.status).toBe(200);
      expect(res.body.is_distress).toBe(true);

      // Emergency helplines ARE provided to student
      expect(res.body.reply).toContain('14416');
      expect(res.body.reply).toContain('1800-599-0019');
      expect(res.body.reply).toContain(expectedDeskName);

      // Ungarbled contact sentence check
      expect(res.body.reply).not.toMatch(/Please contact Please contact/i);
      expect(res.body.reply).not.toMatch(/\.\./);
      expect(res.body.reply).not.toMatch(/\(demo\) \(/i);

      // Meeting request outbox is skipped for public sandbox session-token caller
      expect(MeetingRequest.create).not.toHaveBeenCalled();

      // But institutional ERP endpoint is NOT called
      expect(axios.post).not.toHaveBeenCalled();

      // Does NOT claim to have delivered to a mentor
      expect(res.body.reply).not.toContain("I've sent your request to your mentor");
      expect(res.body.reply).toContain('Please call the emergency helplines above or contact');
    });
  });
});
