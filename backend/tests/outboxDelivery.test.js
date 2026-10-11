const axios = require('axios');
const crypto = require('crypto');
const { buildDeliveryReplyWording } = require('../utils/replyWording');
const {
  processInitialDelivery,
  runRetrySweep,
  generateReasonShort
} = require('../services/erpDeliveryService');
const MeetingRequest = require('../models/MeetingRequest');

jest.mock('axios');

describe('Task 2 — AI Outbox Delivery, Wording Fidelity & Retry Sweep', () => {

  describe('1. Reply Wording Fidelity (Single pure function tests)', () => {
    test('Delivered wording with mentor name', () => {
      const wording = buildDeliveryReplyWording({
        deliveryStatus: 'delivered',
        mentorName: 'Dr. Kavitha Ramanathan'
      });
      expect(wording).toBe("I've sent your request to your mentor (Dr. Kavitha Ramanathan).");
    });

    test('Delivered wording without mentor name', () => {
      const wording = buildDeliveryReplyWording({
        deliveryStatus: 'delivered',
        mentorName: null
      });
      expect(wording).toBe("I've sent your request to your mentor.");
    });

    test('Saved but not delivered wording uses "recorded... couldn\'t reach inbox right now"', () => {
      const wording = buildDeliveryReplyWording({
        deliveryStatus: 'pending',
        counsellingInfo: {
          hasContact: true,
          displayText: 'Please contact the Student Support Desk (Email: help@college.edu).'
        }
      });
      expect(wording).toContain("I've recorded your request but couldn't reach your mentor's inbox right now.");
      expect(wording).toContain('Please contact the Student Support Desk (Email: help@college.edu).');
      expect(wording).not.toContain("I've sent your request");
    });

    test('Not saved wording: never claims anything was recorded', () => {
      const wording = buildDeliveryReplyWording({
        deliveryStatus: 'not_saved',
        isCrisis: true,
        counsellingInfo: { displayText: 'Please contact your mentor directly.' }
      });
      expect(wording).not.toContain('recorded');
      expect(wording).not.toContain('logged');
      expect(wording).not.toContain("I've sent");
      expect(wording).toMatch(/call the emergency helplines above/i);
    });
  });

  describe('2. Reason Short Generation (Safety & Privacy)', () => {
    test('Reason short is generated strictly from category, never from message text', () => {
      expect(generateReasonShort('crisis')).toBe('Immediate emotional distress / crisis detection');
      expect(generateReasonShort('academic')).toBe('Academic performance review & CIA marks advisory');
      expect(generateReasonShort('meeting')).toBe('Student requested 1-on-1 faculty mentor consultation');
    });
  });

  describe('3. ERP Delivery Scope & Outbox Retry', () => {
    let mockMeetingRecord;

    beforeEach(() => {
      process.env.ERP_BASE_URL = 'http://localhost:5000';
      process.env.ERP_SERVICE_API_KEY = 'test_key_for_outbox_integration_32chars!';

      mockMeetingRecord = {
        request_id: crypto.randomUUID(),
        student_id: 'STU_EEC_CSE_Y1_0001',
        college_id: 'C101',
        category: 'crisis',
        urgency: 'urgent',
        reason_short: 'Immediate emotional distress / crisis detection',
        delivery_status: 'pending',
        attempts: 0,
        next_retry_at: new Date(),
        save: jest.fn().mockResolvedValue(true)
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Never delivers to ERP for session-token calls (only for service-key)', async () => {
      const res = await processInitialDelivery(mockMeetingRecord, 'session-token');
      expect(res.delivered).toBe(false);
      expect(res.reason).toBe('session_token_scope');
      expect(axios.post).not.toHaveBeenCalled();
    });

    test('ERP Down: keeps pending status, sets retry backoff, returns delivered: false', async () => {
      axios.post.mockRejectedValueOnce(new Error('Connection refused (ERP offline)'));

      const res = await processInitialDelivery(mockMeetingRecord, 'api-key');
      expect(res.delivered).toBe(false);
      expect(mockMeetingRecord.delivery_status).toBe('pending');
      expect(mockMeetingRecord.attempts).toBe(1);
      expect(mockMeetingRecord.next_retry_at.getTime()).toBeGreaterThan(Date.now() + 50000);
      expect(mockMeetingRecord.save).toHaveBeenCalled();
    });

    test('ERP Up: delivers successfully, updates mentor name, status flips to delivered', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          success: true,
          request_id: mockMeetingRecord.request_id,
          mentor_name: 'Dr. Kavitha Ramanathan',
          status: 'new'
        }
      });

      const res = await processInitialDelivery(mockMeetingRecord, 'api-key');
      expect(res.delivered).toBe(true);
      expect(res.mentorName).toBe('Dr. Kavitha Ramanathan');
      expect(mockMeetingRecord.delivery_status).toBe('delivered');
      expect(mockMeetingRecord.mentor_name).toBe('Dr. Kavitha Ramanathan');
      expect(mockMeetingRecord.delivered_at).toBeInstanceOf(Date);
      expect(mockMeetingRecord.save).toHaveBeenCalled();
    });
  });
});
