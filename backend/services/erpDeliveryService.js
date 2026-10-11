const axios = require('axios');
const crypto = require('crypto');
const MeetingRequest = require('../models/MeetingRequest');
const { getDBStatus } = require('../config/db');

// Exponential backoff intervals in milliseconds: 1m, 5m, 30m, 1h, 2h (max 5 attempts)
const BACKOFF_DELAYS = [
  60 * 1000,        // 1m
  5 * 60 * 1000,    // 5m
  30 * 60 * 1000,   // 30m
  60 * 60 * 1000,   // 60m
  2 * 60 * 60 * 1000 // 120m
];

const MAX_ATTEMPTS = 5;

/**
 * Generate reason_short strictly from the category, NEVER from user message text.
 * Privacy & Safety Guarantee: Zero student transcript or message text is transmitted.
 */
function generateReasonShort(category) {
  switch (category) {
    case 'crisis':
      return 'Immediate emotional distress / crisis detection';
    case 'academic':
      return 'Academic performance review & CIA marks advisory';
    case 'meeting':
    default:
      return 'Student requested 1-on-1 faculty mentor consultation';
  }
}

/**
 * Send meeting request payload to the ERP integration endpoint.
 */
async function sendToErpEndpoint(requestData) {
  const erpBaseUrl = process.env.ERP_BASE_URL || 'http://localhost:5000';
  const serviceKey = process.env.ERP_SERVICE_API_KEY;

  if (!serviceKey) {
    throw new Error('ERP_SERVICE_API_KEY is not configured on AI service');
  }

  const endpoint = `${erpBaseUrl.replace(/\/+$/, '')}/api/integrations/meeting-requests`;

  const payload = {
    request_id: requestData.request_id,
    student_id: requestData.student_id,
    college_id: requestData.college_id || 'C101',
    category: requestData.category,
    urgency: requestData.urgency,
    reason_short: requestData.reason_short
  };

  const response = await axios.post(endpoint, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': serviceKey
    },
    timeout: 5000
  });

  return response.data;
}

/**
 * Handle initial delivery attempt after creating a meeting request.
 * Rules:
 * - Deliver to the ERP ONLY for service-key calls (authType === 'api-key').
 * - NEVER deliver to the ERP for session-token calls (browser demo sandbox).
 */
async function processInitialDelivery(meetingRecord, authType) {
  if (!meetingRecord) {
    return { delivered: false, mentorName: null, reason: 'no_record' };
  }

  // Refinement (3): Deliver to the ERP ONLY for service-key calls
  if (authType !== 'api-key') {
    console.log(`[ERP Delivery] Skipped delivery for request ${meetingRecord.request_id} (caller authType '${authType}' is not service-key)`);
    return {
      delivered: false,
      mentorName: null,
      reason: 'session_token_scope'
    };
  }

  try {
    const erpResult = await sendToErpEndpoint(meetingRecord);
    const mentorName = erpResult?.mentor_name || null;

    meetingRecord.delivery_status = 'delivered';
    meetingRecord.delivered_at = new Date();
    meetingRecord.attempts = (meetingRecord.attempts || 0) + 1;
    meetingRecord.mentor_name = mentorName;
    meetingRecord.last_error = null;
    await meetingRecord.save();

    console.log(`[ERP Delivery Success] Delivered request ${meetingRecord.request_id} to ERP. Assigned mentor: ${mentorName || 'Unknown'}`);

    return {
      delivered: true,
      mentorName,
      status: 'delivered'
    };
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message;
    console.warn(`[ERP Delivery Initial Failure] Could not reach ERP for request ${meetingRecord.request_id}: ${errorMsg}`);

    const nextDelay = BACKOFF_DELAYS[0] || 60000;
    meetingRecord.delivery_status = 'pending';
    meetingRecord.attempts = (meetingRecord.attempts || 0) + 1;
    meetingRecord.next_retry_at = new Date(Date.now() + nextDelay);
    meetingRecord.last_error = errorMsg;
    await meetingRecord.save();

    return {
      delivered: false,
      mentorName: null,
      error: errorMsg
    };
  }
}

/**
 * Persistent background retry sweep.
 * Queries pending requests that are due for retry (only for service-key caller origins).
 */
async function runRetrySweep() {
  if (!getDBStatus()) return;

  try {
    const now = new Date();
    const pendingRequests = await MeetingRequest.find({
      delivery_status: 'pending',
      caller_auth_type: 'api-key',
      next_retry_at: { $lte: now },
      attempts: { $lt: MAX_ATTEMPTS }
    }).limit(20);

    for (const req of pendingRequests) {
      try {
        console.log(`[ERP Retry Sweep] Retrying delivery for request ${req.request_id} (Attempt ${req.attempts + 1}/${MAX_ATTEMPTS})`);
        const erpResult = await sendToErpEndpoint(req);
        req.delivery_status = 'delivered';
        req.delivered_at = new Date();
        req.attempts += 1;
        req.mentor_name = erpResult?.mentor_name || req.mentor_name;
        req.last_error = null;
        await req.save();
        console.log(`[ERP Retry Sweep Success] Delivered request ${req.request_id} on retry.`);
      } catch (err) {
        const attempts = req.attempts + 1;
        const errorMsg = err.response?.data?.error || err.message;
        req.attempts = attempts;
        req.last_error = errorMsg;

        if (attempts >= MAX_ATTEMPTS) {
          req.delivery_status = 'failed';
          console.error(`[ERP Retry Sweep Exceeded] Request ${req.request_id} failed after ${MAX_ATTEMPTS} attempts. Marked as failed.`);
        } else {
          const delay = BACKOFF_DELAYS[attempts] || BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
          req.next_retry_at = new Date(Date.now() + delay);
          console.warn(`[ERP Retry Sweep Warning] Retry attempt ${attempts} failed for ${req.request_id}. Next retry in ${Math.round(delay / 1000)}s.`);
        }
        await req.save();
      }
    }
  } catch (sweepErr) {
    console.error('[ERP Retry Sweep Error]', sweepErr.message);
  }
}

let sweepIntervalId = null;

function startRetrySweep() {
  if (sweepIntervalId) return;

  // Run initial sweep on startup
  setTimeout(() => {
    runRetrySweep().catch(e => console.error('[ERP Startup Sweep]', e.message));
  }, 2000);

  // Run persistent sweep every 60 seconds (1 minute)
  sweepIntervalId = setInterval(() => {
    runRetrySweep().catch(e => console.error('[ERP Periodic Sweep]', e.message));
  }, 60 * 1000);

  console.log('[ERP Delivery Service] Persistent retry sweep initialized (every 60s)');
}

function stopRetrySweep() {
  if (sweepIntervalId) {
    clearInterval(sweepIntervalId);
    sweepIntervalId = null;
  }
}

module.exports = {
  generateReasonShort,
  processInitialDelivery,
  runRetrySweep,
  startRetrySweep,
  stopRetrySweep,
  sendToErpEndpoint,
  BACKOFF_DELAYS,
  MAX_ATTEMPTS
};
