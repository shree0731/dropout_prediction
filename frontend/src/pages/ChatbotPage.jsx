import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { MessageSquare, Send, Sparkles, User, Calendar, AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';

export default function ChatbotPage() {
  const location = useLocation();

  // Active student context (passed from PredictPage or defaults to high-risk demo student)
  const [studentContext, setStudentContext] = useState(
    location.state?.student || {
      student_id: 'STU_EEC_CSE_Y2_0001',
      student_name: 'Akshaya Palanisamy',
      department: 'CSE',
      year_of_study: 2,
      attendance_pct: 64.5,
      backlogs_count: 3,
      overall_gpa: 5.4,
      prediction: 'High',
      mentor_name: 'Dr. Kavitha Swaminathan'
    }
  );

  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${studentContext.student_name}! I'm Astra, your AI Academic Advisor. I noticed your attendance is currently at ${studentContext.attendance_pct}% and you have ${studentContext.backlogs_count} backlogs. How are you holding up this semester? Feel free to ask about your attendance cutoff, marks, or scheduling time with ${studentContext.mentor_name || 'your mentor'}.`
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedMeeting, setLoggedMeeting] = useState(null);
  const messagesEndRef = useRef(null);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ED4D8B', marginBottom: '0.25rem' }}>
          <MessageSquare size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Intervention &amp; Retention Dialogue Agent
          </span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFFFFF' }}>
          Astra Context-Aware Academic Advisor
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Equipped with factual academic grounding, proactive check-ins, safety guardrails, and automated mentor meeting logging.
        </p>
      </div>

      {/* Active Student Context Banner */}
      <div className="glass-card" style={{ background: '#0E1526', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(237, 77, 139, 0.2)', color: '#ED4D8B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#FFFFFF' }}>
                Active Student: {studentContext.student_name} ({studentContext.student_id})
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Dept of {studentContext.department} &bull; Year {studentContext.year_of_study} &bull; Advisor: {studentContext.mentor_name || 'Dr. Kavitha Swaminathan'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Att: <strong style={{ color: studentContext.attendance_pct < 75 ? '#F87171' : '#34D399' }}>{studentContext.attendance_pct}%</strong>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Backlogs: <strong style={{ color: studentContext.backlogs_count > 0 ? '#F87171' : '#34D399' }}>{studentContext.backlogs_count}</strong>
            </span>
            <span className={`badge ${studentContext.prediction === 'High' ? 'badge-high' : studentContext.prediction === 'Medium' ? 'badge-medium' : 'badge-low'}`} style={{ fontSize: '0.7rem' }}>
              {studentContext.prediction || 'High'} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Logged Meeting Request Banner */}
      {loggedMeeting && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={18} color="#10B981" />
            <div style={{ fontSize: '0.85rem', color: '#E2E8F0' }}>
              <strong>Meeting Request Logged in MongoDB!</strong> Target: {loggedMeeting.details.requested_with.toUpperCase()} &bull; Reason: {loggedMeeting.details.reason}
            </div>
          </div>
          <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>Status: Pending</span>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="glass-card" style={{ height: '420px', display: 'flex', flexDirection: 'column', padding: '1rem', background: '#0B0F19' }}>
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
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ED4D8B', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                    <Sparkles size={14} />
                  </div>
                )}
                <div style={{
                  maxWidth: '75%',
                  padding: '0.75rem 1rem',
                  borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  background: isBot ? '#131B2E' : '#ED4D8B',
                  border: isBot ? '1px solid #1E293B' : 'none',
                  color: '#FFFFFF',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '0.8rem', marginLeft: '34px' }}>
              <RefreshCw size={14} className="animate-spin" color="#ED4D8B" />
              <span>Astra is analyzing verified academic records...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0', borderTop: '1px solid #1E293B', marginTop: '0.5rem' }}>
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(p)}
              style={{
                background: '#131B2E',
                border: '1px solid #24304F',
                borderRadius: '9999px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                color: '#94A3B8',
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
            style={{ padding: '0 1.25rem' }}
          >
            <Send size={16} />
          </button>
        </form>

        {/* Safety Disclaimer Banner */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.72rem',
          color: '#64748B',
          paddingTop: '0.45rem',
          letterSpacing: '0.01em'
        }}>
          🛡️ AI academic assistant. Not a substitute for professional counseling or official academic advice.
        </div>
      </div>
    </div>
  );
}
