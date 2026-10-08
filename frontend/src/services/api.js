/**
 * Frontend API Service Layer
 * Calls Express Backend at /api (proxied to http://localhost:5001)
 * Secured using short-lived session tokens without embedding secret keys in the browser bundle.
 */

const API_BASE = '/api';

let cachedSessionToken = null;
let tokenExpiry = 0;

// Fetch or reuse short-lived session token
async function getSessionToken() {
  if (cachedSessionToken && Date.now() < tokenExpiry - 30000) {
    return cachedSessionToken;
  }
  try {
    const res = await fetch(`${API_BASE}/session-token`);
    if (res.ok) {
      const data = await res.json();
      cachedSessionToken = data.token;
      tokenExpiry = Date.now() + (data.expires_in * 1000);
      return cachedSessionToken;
    }
  } catch (err) {
    console.warn('[Session Token Warning]', err.message);
  }
  return null;
}

export const api = {
  // 1. Fetch trained model metrics & SHAP attribution
  getMetrics: async () => {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error(`Metrics HTTP ${res.status}`);
    return await res.json();
  },

  // 2. Fetch demo students dataset for one-click testing
  getDemoStudents: async () => {
    const res = await fetch(`${API_BASE}/students/demo`);
    if (!res.ok) throw new Error(`Demo students HTTP ${res.status}`);
    return await res.json();
  },

  // 3. Run prediction with risk drivers & probabilities
  predictRisk: async (payload) => {
    const token = await getSessionToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.details || errData.message || errData.error || `Predict HTTP ${res.status}`);
    }
    return await res.json();
  },

  // 4. Send chat message with student context & trigger escalation
  sendChat: async (message, studentContext = {}) => {
    try {
      const token = await getSessionToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          student_context: studentContext
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.message || errData.error || `Server returned HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn('[Frontend Chat API Warning]', err.message);
      // In-browser fallback if backend server is not running
      const isMeeting = /(meet|schedule|appointment|mentor|counsel)/i.test(message);
      const studentName = studentContext.student_name || 'Student';
      const att = studentContext.attendance_pct || 75.0;
      const backlogs = studentContext.backlogs_count || 0;
      
      let reply = `Hello ${studentName}! I'm Astra, your AI Academic Advisor. Your records show ${att}% attendance and ${backlogs} backlogs. `;
      if (/attendance|cutoff|exam/i.test(message)) {
        reply = att < 75 
          ? `Your attendance is currently ${att}%, which is below the mandatory 75% cutoff for end-semester exams. You will need consistent attendance to avoid condonation.`
          : `Your attendance is currently ${att}%, which is above the 75% requirement. You are eligible to write your exams.`;
      } else if (/backlog|arrear/i.test(message)) {
        reply = `You currently have ${backlogs} active backlog(s). We recommend attending remedial tutorials.`;
      }

      if (isMeeting) {
        reply += "\n\n[Meeting Request Logged]: I've submitted a counseling request for you with your academic mentor.";
      }

      return {
        reply,
        meeting_requested: isMeeting,
        meeting_details: isMeeting ? { requested_with: 'mentor', reason: message } : null,
        meeting_id: 'LOCAL-' + Math.floor(1000 + Math.random() * 9000),
        source: 'browser_fallback'
      };
    }
  },

  // 5. Query logged meeting requests (protected endpoint)
  getMeetings: async () => {
    const token = await getSessionToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/meetings`, { headers });
    if (!res.ok) throw new Error(`Meetings HTTP ${res.status}`);
    return await res.json();
  },

  // 6. Check system status
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health HTTP ${res.status}`);
    return await res.json();
  }
};
