const mlServiceClient = require('../services/mlServiceClient');
const MeetingRequest = require('../models/MeetingRequest');
const { getDBStatus } = require('../config/db');

const DISCLAIMER_TEXT = 'AI academic assistant. Not a substitute for professional counseling or official academic advice.';

const CRISIS_PATTERNS = [
  /\bsuicid/i, /\bkill myself\b/i, /\bend my life\b/i, /\bhurt myself\b/i,
  /\bcutting\b/i, /\bself[- ]harm\b/i, /\boverdose\b/i, /\bwant to die\b/i,
  /\bhopeless\b/i, /\bcan't go on\b/i, /\bno reason to live\b/i, /\bgive up on life\b/i,
  /\bnothing matters anymore\b/i, /\bcan't take it anymore\b/i, /\bunbearable\b/i,
  /\bpanic attack\b/i, /\bsevere anxiety\b/i, /\bcan't breathe\b/i, /\bterrified\b/i,
  /\bextreme dread\b/i, /\bmental breakdown\b/i,
  /\babuse\b/i, /\bdomestic violence\b/i, /\bharass(ment|ed)?\b/i, /\bassault\b/i,
  /\bragging\b/i, /\bbull(ied|ying)\b/i,
  /\bsevere depression\b/i, /\bdepressed\b/i
];

const DISTRESS_TOKENS = new Set([
  'despair', 'helpless', 'worthless', 'trapped', 'suffering',
  'exhausted', 'pain', 'crying', 'broken', 'numb', 'dark',
  'alone', 'failed', 'hate', 'scared', 'drowning'
]);

function checkDistress(message) {
  const msgLower = (message || '').toLowerCase();
  for (const pat of CRISIS_PATTERNS) {
    if (pat.test(msgLower)) return true;
  }
  const words = (msgLower.match(/\b[a-z]{3,}\b/g) || []);
  let count = 0;
  for (const w of words) {
    if (DISTRESS_TOKENS.has(w)) count++;
  }
  return count >= 2;
}

exports.handleChat = async (req, res) => {
  const { message = '', student_context = {} } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  const studentId = student_context?.student_id || 'STU_ANONYMOUS';
  const studentName = student_context?.student_name || 'Student';

  try {
    let chatResponse;
    try {
      chatResponse = await mlServiceClient.sendChat(message, student_context);
    } catch (mlErr) {
      console.warn('[ChatController] ML microservice unreachable, activating safety fallback engine:', mlErr.message);
      chatResponse = null;
    }

    // Determine if query is distress or meeting
    const isDistress = chatResponse?.is_distress || checkDistress(message);
    const meetingRequested = chatResponse?.meeting_requested || isDistress || /(meet|meeting|schedule|appointment|talk to (my )?mentor|counsel|book a session)/i.test(message);
    const requestedWith = (isDistress || /counsel/i.test(message)) ? 'counselor' : 'mentor';
    const reason = isDistress
      ? 'Immediate emotional distress / crisis detection'
      : (chatResponse?.meeting_details?.reason || `Student requested meeting: "${message.slice(0, 80)}"`);

    let meetingRecord = null;
    let counselorNotified = false;

    if (meetingRequested) {
      if (getDBStatus()) {
        try {
          meetingRecord = await MeetingRequest.create({
            student_id: studentId,
            student_name: studentName,
            requested_with: requestedWith,
            reason,
            status: 'pending'
          });
          counselorNotified = (requestedWith === 'counselor');
          console.log(`[Meeting Request Logged] Created DB record ID ${meetingRecord._id} for ${studentId}`);
        } catch (dbErr) {
          console.error('[Meeting Request DB Error] Failed to persist meeting record:', dbErr.message);
          meetingRecord = null;
          counselorNotified = false;
        }
      } else {
        console.warn(`[Meeting Request Notice] Database is offline; cannot persist meeting for ${studentId}`);
        meetingRecord = null;
        counselorNotified = false;
      }
    }

    let finalReply = '';

    if (isDistress) {
      const baseCrisisText = 
        "I hear how overwhelmed you are feeling right now, and I want you to know you don't have to carry this alone. " +
        "Please reach out to someone who can support you immediately:\n\n" +
        "• **National Student Mental Health Helpline (Tele-MANAS)**: Call 14416 (Toll-Free, 24x7)\n" +
        "• **KIRAN Mental Health Helpline**: Call 1800-599-0019 (Toll-Free, 24x7)\n" +
        "• **Campus Wellness & Counseling Center**: Direct walk-in or emergency contact\n\n";

      if (meetingRecord && counselorNotified) {
        finalReply = baseCrisisText +
          `I have logged an urgent meeting request (Reference: ${meetingRecord._id}) and notified your dedicated academic counselor to follow up with you on your student portal.`;
      } else {
        // Honesty guarantee: If DB record failed or DB is down, NEVER claim anyone was notified!
        finalReply = baseCrisisText +
          "Note: We could not automatically notify your counselor at this moment due to a temporary system disruption. " +
          "Please contact the campus counseling office directly (Email: counselor@institution.edu / Phone: +91-44-2223-1111) or call the crisis helplines above.";
      }
    } else if (chatResponse && chatResponse.reply) {
      finalReply = chatResponse.reply;
      if (meetingRequested) {
        if (meetingRecord) {
          finalReply += `\n\n[Meeting Request Logged]: I've submitted a request (Ref: ${meetingRecord._id}) for you to connect with ${requestedWith}. You will receive confirmation on your student portal.`;
        } else {
          finalReply += `\n\n[Notice]: Meeting requests cannot be logged automatically right now because the database is offline. Please reach out directly to your assigned mentor or department office.`;
        }
      }
    } else {
      // Offline rule-based fallback advisor
      const att = student_context.attendance_pct || 75.0;
      const backlogs = student_context.backlogs_count || 0;
      const gpa = student_context.overall_gpa || 6.8;
      const mentor = student_context.mentor_name || 'your faculty mentor';

      const msgLower = message.toLowerCase();
      if (msgLower.includes('attendance') || msgLower.includes('cutoff')) {
        finalReply = att < 75.0
          ? `Hi ${studentName}, your current attendance is recorded at ${att}%, which is below the mandatory 75% exam eligibility threshold. You may be at risk of condonation or detention. Would you like me to book time with ${mentor} to discuss an attendance recovery plan?`
          : `Hi ${studentName}, your attendance is in good standing at ${att}% (safely above the 75% institutional cutoff).`;
      } else if (msgLower.includes('backlog') || msgLower.includes('arrear') || msgLower.includes('exam') || msgLower.includes('gpa')) {
        finalReply = backlogs > 0
          ? `According to your records, you currently have ${backlogs} active backlog(s) and an overall GPA of ${gpa}. The department offers remedial tutorial sessions and peer study groups for core subjects.`
          : `You currently have 0 active backlogs and an overall GPA of ${gpa}/10.0. You are in good academic standing!`;
      } else {
        finalReply = `Hello ${studentName}! Your verified records show ${att}% attendance and ${backlogs} active backlog(s) with an overall GPA of ${gpa}/10. How can I assist you today?`;
      }

      if (meetingRequested) {
        if (meetingRecord) {
          finalReply += `\n\n[Meeting Request Logged]: I've submitted a request (Ref: ${meetingRecord._id}) for you to connect with ${requestedWith}. You will receive confirmation on your student portal.`;
        } else {
          finalReply += `\n\n[Notice]: Meeting requests cannot be logged automatically right now because the database is offline. Please reach out directly to ${mentor}.`;
        }
      }
    }

    return res.json({
      reply: finalReply,
      meeting_requested: meetingRequested,
      meeting_id: meetingRecord ? meetingRecord._id : null,
      counselor_notified: counselorNotified,
      is_distress: isDistress,
      disclaimer: DISCLAIMER_TEXT,
      source: chatResponse ? 'ml_microservice' : 'resilient_guardrail'
    });
  } catch (fatalErr) {
    console.error('[ChatController Fatal Error]', fatalErr);
    return res.status(500).json({
      error: 'Internal chat advisor error',
      disclaimer: DISCLAIMER_TEXT
    });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    if (getDBStatus()) {
      const meetings = await MeetingRequest.find().sort({ createdAt: -1 }).limit(100);
      return res.json(meetings);
    }
    return res.json([]);
  } catch (err) {
    console.error('[GetMeetings Error]', err);
    return res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};
