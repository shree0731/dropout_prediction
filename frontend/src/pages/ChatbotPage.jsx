import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { MessageSquare, Send, Sparkles, User, Calendar, AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';

export default function ChatbotPage() {
  const location = useLocation();

  // Active student context (passed from PredictPage or defaults to high-risk demo student from dataset)
  const [studentContext, setStudentContext] = useState(
    location.state?.student || {
      student_id: 'STU_MIST_IT_Y3_5559',
      student_name: 'Bhoomika Gowda',
      department: 'IT',
      year_of_study: 3,
      attendance_pct: 70.8,
      backlogs_count: 27,
      overall_gpa: 1.39,
      prediction: 'High',
      mentor_name: 'Dr. Sudha Rajagopalan'
    }
  );

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${studentContext.student_name}! I'm Baymate, your AI academic advisor. I noticed your attendance is currently at ${studentContext.attendance_pct}% and you have ${studentContext.backlogs_count} backlogs. How are you holding up this semester? Feel free to ask about your attendance cutoff, marks, or scheduling time with ${studentContext.mentor_name || 'your mentor'}.`
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedMeeting, setLoggedMeeting] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch demo student dynamically from dataset if not passed in navigation state
  useEffect(() => {
    if (!location.state?.student) {
      api.getDemoStudents()
        .then(res => {
          const list = res.data || [];
          const found = list.find(s => s.student_id === 'STU_MIST_IT_Y3_5559') || list[0];
          if (found) {
            const mapped = {
              student_id: found.student_id,
              student_name: found.student_name,
              department: found.department,
              year_of_study: found.year_of_study,
              attendance_pct: found.attendance_pct,
              backlogs_count: found.backlogs_count,
              overall_gpa: found.overall_gpa,
              prediction: found.dropout_risk_label,
              college_id: found.college_id,
              college_name: found.college_name,
              mentor_name: found.mentor_name || 'Dr. Sudha Rajagopalan'
            };
            setStudentContext(mapped);
            setMessages([
              {
                sender: 'bot',
                text: `Hello ${mapped.student_name}! I'm Baymate, your AI academic advisor. I noticed your attendance is currently at ${mapped.attendance_pct}% and you have ${mapped.backlogs_count} backlogs. How are you holding up this semester? Feel free to ask about your attendance cutoff, marks, or scheduling time with ${mapped.mentor_name || 'your mentor'}.`
              }
            ]);
          }
        })
        .catch(err => {
          console.warn('[ChatbotPage] Failed to fetch demo student:', err.message);
        });
    }
  }, [location.state?.student]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.sendChat(text, studentContext);
      setMessages(prev => [...prev, { sender: 'bot', text: res.reply }]);

      if (res.meeting_requested) {
        setLoggedMeeting({
          details: res.meeting_details,
          id: res.meeting_id || 'MTRQ-' + Math.floor(1000 + Math.random() * 9000)
        });
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: `I encountered an issue connecting to the advisory server: ${err.message}. Please try again.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "Why was I flagged for academic risk?",
    "Am I below the attendance cutoff for semester exams?",
    "Can you schedule a meeting with my faculty mentor?",
    "I'm feeling very overwhelmed with exams and need counseling support."
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>
          <MessageSquare size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink)' }}>
            Intervention &amp; Retention Dialogue Agent
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Baymate Context-Aware Academic Advisor
        </h1>
        <p style={{ color: 'var(--ink)', opacity: 0.85, fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Equipped with factual academic grounding, proactive check-ins, safety guardrails, and automated mentor meeting logging.
        </p>
      </div>

      {/* Active Student Context Banner */}
      <div className="glass-card" style={{ background: 'var(--bg-accent)', border: '1px solid var(--ink)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface)', color: 'var(--ink-on-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--ink)' }}>
                Active Student: {studentContext.student_name} ({studentContext.student_id})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink)', opacity: 0.75 }}>
                Dept of {studentContext.department} &bull; Year {studentContext.year_of_study} &bull; Advisor: {studentContext.mentor_name || 'Dr. Kavitha Swaminathan'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink)' }}>
              Att: <strong style={{ color: studentContext.attendance_pct < 75 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{studentContext.attendance_pct}%</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink)' }}>
              Backlogs: <strong style={{ color: studentContext.backlogs_count > 0 ? 'var(--risk-high)' : 'var(--risk-low)' }}>{studentContext.backlogs_count}</strong>
            </span>
            <span className={`badge ${studentContext.prediction === 'High' ? 'badge-high' : studentContext.prediction === 'Medium' ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.7rem' }}>
              {studentContext.prediction || 'High'} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Logged Meeting Request Banner */}
      {loggedMeeting && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-accent)', border: '1px solid var(--ink)', borderRadius: 'var(--radius-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={18} color="#10B981" />
            <div style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
              <strong>Meeting Request Logged in MongoDB!</strong> Target: {loggedMeeting.details.requested_with.toUpperCase()} &bull; Reason: {loggedMeeting.details.reason}
            </div>
          </div>
          <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>Status: Pending</span>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="glass-card" style={{ height: '440px', display: 'flex', flexDirection: 'column', padding: '1.25rem', background: 'var(--bg)', border: '1px solid var(--ink)', borderRadius: 'var(--radius)' }}>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem' }}>
          {messages.map((m, idx) => {
            const isBot = m.sender === 'bot';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isBot ? 'flex-start' : 'flex-end',
                  gap: '0.5rem'
                }}
              >
                {isBot && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <img src="/baymate-avatar.png" alt="Baymate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '0.75rem 1rem',
                  borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  background: isBot ? 'var(--surface)' : 'transparent',
                  border: isBot ? '1px solid var(--surface)' : '1px solid var(--ink)',
                  color: isBot ? 'var(--ink-on-dark)' : 'var(--ink)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-line'
                }}>
                  {m.text}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)', opacity: 0.8, fontSize: '0.8rem', marginLeft: '36px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/baymate-avatar.png" alt="Baymate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <RefreshCw size={14} className="animate-spin" color="#ED4D8B" />
              <span>Baymate is analyzing verified academic records...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.6rem 0', borderTop: '1px solid rgba(23, 83, 31, 0.2)', marginTop: '0.5rem' }}>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(p)}
              style={{
                background: 'transparent',
                border: '1px solid var(--ink)',
                borderRadius: '9999px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ED4D8B'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#24304F'; e.currentTarget.style.color = '#94A3B8'; }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}
        >
          <input
            type="text"
            className="form-input"
            placeholder="Ask about your marks, exam cutoffs, or request mentor counseling..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !inputText.trim()}
            style={{ padding: '0 1.25rem', background: 'var(--surface)', color: 'var(--ink-on-dark)', borderRadius: 'var(--radius-input)' }}
          >
            <Send size={16} />
          </button>
        </form>

        {/* Safety Disclaimer Banner */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: 'var(--ink)',
          paddingTop: '0.55rem',
          letterSpacing: '0.01em',
          lineHeight: '1.4'
        }}>
          🛡️ AI academic assistant. Not a substitute for professional counseling or official academic advice. Immediate crisis support: Tele-MANAS (14416) | KIRAN (1800-599-0019).
        </div>
      </div>
    </div>
  );
}
