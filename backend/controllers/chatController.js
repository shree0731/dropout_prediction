const crypto = require('crypto');
const mlServiceClient = require('../services/mlServiceClient');
const MeetingRequest = require('../models/MeetingRequest');
const { getDBStatus } = require('../config/db');
const { formatHelplinesText } = require('../constants/helplines');
const { resolveCounsellingContact } = require('../utils/counsellingConfig');
const { buildDeliveryReplyWording } = require('../utils/replyWording');
const { processInitialDelivery, generateReasonShort } = require('../services/erpDeliveryService');
const { findDemoStudentById } = require('./demoController');

const DISCLAIMER_TEXT = 'AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019).';

const CRISIS_PATTERNS = [
  /\bsuicid/i, /\bkill myself\b/i, /\bend my life\b/i, /\bhurt myself\b/i,
  /\bcutting\b/i, /\bself[- ]harm\b/i, /\boverdose\b/i, /\bwant to die\b/i,
  /\bhopeless\b/i, /\bcan't go on\b/i, /\bno reason to live\b/i, /\bgive up on life\b/i,
  /\bnothing matters anymore\b/i, /\bcan't take it anymore\b/i, /\bunbearable\b/i,
  /\babuse\b/i, /\bdomestic violence\b/i, /\bharass(ment|ed)?\b/i, /\bassault\b/i,
  /\bragging\b/i, /\bmy final goodbye\b/i, /\bgoodbye everyone\b/i, /\bthis is goodbye\b/i
];

function isCrisisMessage(message) {
  const msgLower = (message || '').toLowerCase();
  for (const pat of CRISIS_PATTERNS) {
    if (pat.test(msgLower)) return true;
  }
  return false;
}

exports.handleChat = async (req, res) => {
  const { message = '', student_context: rawContext = {} } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // Subtask 5.3: Server-side data lookup for session-token calls; ignore client-supplied context
  let student_context = {};
  if (req.authType === 'session-token') {
    const requestedStudentId = rawContext.student_id;
    const verifiedDemoStudent = await findDemoStudentById(requestedStudentId);

    if (verifiedDemoStudent) {
      student_context = {
        student_id: verifiedDemoStudent.student_id,
        student_name: verifiedDemoStudent.student_name,
        college_id: verifiedDemoStudent.college_id,
        attendance_pct: verifiedDemoStudent.attendance_pct,
        overall_gpa: verifiedDemoStudent.overall_gpa,
        backlogs_count: verifiedDemoStudent.backlogs_count,
        mentor_name: 'Dr. Faculty Mentor (Assigned)'
      };
    } else {
      student_context = {
        student_id: 'STU_DEMO',
        student_name: 'Student',
        college_id: 'C101',
        attendance_pct: 75.0,
        overall_gpa: 7.0,
        backlogs_count: 0,
        mentor_name: 'Campus Faculty Mentor'
      };
    }
  } else {
    // API-Key calls (from ERP backend): use verified context supplied by ERP
    student_context = { ...rawContext };
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
    const isDistress = chatResponse?.is_distress || isCrisisMessage(message);
    const meetingRequested = chatResponse?.meeting_requested || isDistress || /(meet|meeting|schedule|appointment|talk to (my )?mentor|counsel|book a session)/i.test(message);
    
    // Categorize meeting request: crisis | academic | meeting
    const category = isDistress
      ? 'crisis'
      : (/(grade|mark|exam|backlog|arrear|fail|study|tutoring)/i.test(message) ? 'academic' : 'meeting');
    const urgency = (category === 'crisis') ? 'urgent' : 'normal';
    const reasonShort = generateReasonShort(category);
    const requestId = crypto.randomUUID();
    const collegeId = student_context?.college_id || 'C101';

    let meetingRecord = null;
    let deliveryResult = { delivered: false, mentorName: null };

    if (meetingRequested) {
      if (req.authType === 'api-key') {
        if (getDBStatus()) {
          try {
            meetingRecord = await MeetingRequest.create({
              request_id: requestId,
              student_id: studentId,
              student_name: studentName,
              college_id: collegeId,
              category,
              urgency,
              reason_short: reasonShort,
              delivery_status: 'pending',
              caller_auth_type: req.authType || 'anonymous'
            });

            // Deliver to the ERP only for service-key calls (handled in processInitialDelivery)
            deliveryResult = await processInitialDelivery(meetingRecord, req.authType);
            console.log(`[Meeting Request Logged] ID: ${meetingRecord.request_id}, Delivery: ${meetingRecord.delivery_status}`);
          } catch (dbErr) {
            console.error('[Meeting Request DB Error] Failed to persist meeting record:', dbErr.message);
            meetingRecord = null;
          }
        } else {
          console.warn(`[Meeting Request Notice] Database is offline; cannot persist meeting for ${studentId}`);
          meetingRecord = null;
        }
      } else {
        console.log(`[Meeting Request Notice] Sandbox caller (authType: ${req.authType}) - skipping institutional outbox persistence`);
        meetingRecord = null;
      }
    }

    const resolvedMentor = deliveryResult.mentorName || student_context?.mentor_name;
    const deliveryStatus = meetingRecord
      ? (deliveryResult.delivered ? 'delivered' : 'pending')
      : 'not_saved';
    const counsellingInfo = resolveCounsellingContact(collegeId);

    let finalReply = '';

    if (isDistress) {
      const deskLine = counsellingInfo?.contactDetails
        ? `• **${counsellingInfo.deskName}**: ${counsellingInfo.contactDetails}\n\n`
        : `• **${counsellingInfo.deskName || 'Campus Student Counselling Desk'}**: Direct walk-in or consult your faculty mentor\n\n`;

      const baseCrisisText = 
        "I hear how overwhelmed you are feeling right now, and I want you to know you don't have to carry this alone. " +
        "Please reach out to someone who can support you immediately:\n\n" +
        formatHelplinesText() + "\n" +
        deskLine;

      const notificationNote = buildDeliveryReplyWording({
        deliveryStatus,
        mentorName: resolvedMentor,
        counsellingInfo,
        isCrisis: true
      });

      finalReply = baseCrisisText + notificationNote;
    } else if (chatResponse && chatResponse.reply) {
      finalReply = chatResponse.reply;
      if (meetingRequested) {
        finalReply += `\n\n` + buildDeliveryReplyWording({
          deliveryStatus,
          mentorName: resolvedMentor,
          counsellingInfo,
          isCrisis: false
        });
      }
    } else {
      // Offline rule-based fallback advisor
      const att = student_context.attendance_pct || 75.0;
      const backlogs = student_context.backlogs_count || 0;
      const gpa = student_context.overall_gpa || 6.8;
      const mentor = resolvedMentor || 'your faculty mentor';

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
        finalReply += `\n\n` + buildDeliveryReplyWording({
          deliveryStatus,
          mentorName: resolvedMentor,
          counsellingInfo,
          isCrisis: false
        });
      }
    }

    return res.json({
      reply: finalReply,
      meeting_requested: meetingRequested,
      meeting_id: meetingRecord ? meetingRecord.request_id : null,
      delivery_status: deliveryStatus,
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
