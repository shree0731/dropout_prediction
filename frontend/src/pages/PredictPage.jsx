import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Sparkles, BrainCircuit, AlertTriangle, CheckCircle2, User, MessageSquare, ArrowRight, RefreshCw, Sliders } from 'lucide-react';

export default function PredictPage() {
  const navigate = useNavigate();
  const [demoStudents, setDemoStudents] = useState([]);
  const [selectedDemoId, setSelectedDemoId] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  const [formData, setFormData] = useState({
    student_id: 'STU_CUSTOM_001',
    student_name: 'Custom Student Evaluation',
    department: 'CSE',
    year_of_study: 2,
    attendance_pct: 64.5,
    attendance_decay: 17.5,
    overall_gpa: 5.4,
    backlogs_count: 3,
    cutoff_mark_200: 165.0,
    mentor_meetings_attended: 1,
    family_income_annual: 210000,
    first_gen_learner: 1,
    distance_from_home_km: 32.0,
    failed_subjects_count: 3,
    core_theory_average: 48.0,
    internal_exam_avg: 26.0,
    assignment_avg: 5.0,
    grade_trend: -0.4
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDemos() {
      try {
        const res = await api.getDemoStudents();
        setDemoStudents(res.data || []);
      } catch (e) {
        console.warn('Failed to load demo students:', e.message);
      }
    }
    loadDemos();
  }, []);

  const handleSelectDemo = (student) => {
    setSelectedDemoId(student.student_id);
    const trend = student.monthly_attendance_trend || [];
    const decay = trend.length >= 2 ? Math.max(0, trend[0] - trend[trend.length - 1]) : 0;

    setFormData({
      student_id: student.student_id,
      student_name: student.student_name,
      department: student.department,
      year_of_study: student.year_of_study,
      attendance_pct: student.attendance_pct,
      attendance_decay: Number(decay.toFixed(1)),
      overall_gpa: student.overall_gpa,
      backlogs_count: student.backlogs_count,
      cutoff_mark_200: student.cutoff_mark_200,
      mentor_meetings_attended: student.mentor_meetings_attended,
      family_income_annual: student.family_income_annual,
      first_gen_learner: student.first_gen_learner,
      distance_from_home_km: student.distance_from_home_km,
      // Real marks-derived aggregates computed server-side from marks.csv (no invented values)
      failed_subjects_count: student.marks_features?.failed_subjects_count ?? student.subject_marks_summary?.failed_subjects_count ?? 0,
      core_theory_average: student.marks_features?.core_theory_average ?? student.subject_marks_summary?.core_theory_average ?? 0,
      internal_exam_avg: student.marks_features?.internal_exam_avg ?? 0,
      assignment_avg: student.marks_features?.assignment_avg ?? 0,
      grade_trend: student.marks_features?.grade_trend ?? 0
    });
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      student_id: formData.student_id,
      department: formData.department,
      year_of_study: Number(formData.year_of_study),
      attendance_pct: Number(formData.attendance_pct),
      attendance_decay: Number(formData.attendance_decay),
      overall_gpa: Number(formData.overall_gpa),
      backlogs_count: Number(formData.backlogs_count),
      cutoff_mark_200: Number(formData.cutoff_mark_200),
      mentor_meetings_attended: Number(formData.mentor_meetings_attended),
      family_income_annual: Number(formData.family_income_annual),
      first_gen_learner: Number(formData.first_gen_learner),
      distance_from_home_km: Number(formData.distance_from_home_km),
      failed_subjects_count: Number(formData.failed_subjects_count),
      core_theory_average: Number(formData.core_theory_average),
      internal_exam_avg: Number(formData.internal_exam_avg),
      assignment_avg: Number(formData.assignment_avg),
      grade_trend: Number(formData.grade_trend)
    };

    try {
      const res = await api.predictRisk(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredDemos = demoStudents.filter(s => {
    if (filterRisk === 'ALL') return true;
    return s.dropout_risk_label === filterRisk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>
          <Sparkles size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink)' }}>
            Interactive Inference Sandbox
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '700', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Evaluate Dropout Risk &amp; Generate Plain-Language Drivers
        </h1>
        <p style={{ color: 'var(--ink)', opacity: 0.85, fontSize: '0.9rem', marginTop: '0.25rem' }}>
          Pick a real student profile from the 9,200 dataset or customize academic signals manually.
        </p>
      </div>

      {/* Demo Student Quick Selector */}
      <div className="glass-card" style={{ background: 'var(--bg-accent)', border: '1px solid var(--ink)', borderRadius: 'var(--radius)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User size={18} color="#ED4D8B" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--ink)' }}>
              Load Real Student Profile (One-Click Autofill)
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['ALL', 'High', 'Medium', 'Low'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRisk(r)}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  border: '1px solid var(--ink)',
                  background: filterRisk === r ? 'var(--surface)' : 'transparent',
                  color: filterRisk === r ? 'var(--ink-on-dark)' : 'var(--ink)',
                  transition: 'all 0.15s ease'
                }}
              >
                {r === 'ALL' ? 'All' : `${r} Risk`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredDemos.map(s => {
            const isSelected = selectedDemoId === s.student_id;
            const badgeClass = s.dropout_risk_label === 'High' ? 'badge-high' : s.dropout_risk_label === 'Medium' ? 'badge-medium' : 'badge-low';
            return (
              <div
                key={s.student_id}
                onClick={() => handleSelectDemo(s)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-input)',
                  background: isSelected ? 'var(--bg)' : 'transparent',
                  border: isSelected ? '2px solid var(--ink)' : '1px solid rgba(23, 83, 31, 0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--ink)' }}>{s.student_name}</span>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>{s.dropout_risk_label}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink)', opacity: 0.75 }}>
                  {s.student_id} &bull; {s.department} Y{s.year_of_study}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink)', marginTop: '0.2rem' }}>
                  Att: <strong>{s.attendance_pct}%</strong> &bull; Backlogs: <strong>{s.backlogs_count}</strong> &bull; GPA: <strong>{s.overall_gpa}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form + Results */}
      <div className="grid-2">
        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg)', border: '1px solid var(--ink)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sliders size={18} color="#ED4D8B" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' }}>Academic &amp; Context Features</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Engineering Branch</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
              >
                {['CSE', 'IT', 'AIDS', 'AIML', 'Cyber Security', 'CSD', 'CSBS', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Robotics', 'Automobile'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Year of Study (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                className="form-input"
                value={formData.year_of_study}
                onChange={e => setFormData({ ...formData, year_of_study: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Overall Attendance (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                className="form-input"
                value={formData.attendance_pct}
                onChange={e => setFormData({ ...formData, attendance_pct: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Attendance Drop, first→latest month (pts)</label>
              <input
                type="number"
                step="0.1"
                min="-100"
                max="100"
                className="form-input"
                value={formData.attendance_decay}
                onChange={e => setFormData({ ...formData, attendance_decay: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Cumulative GPA (0-10)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="form-input"
                value={formData.overall_gpa}
                onChange={e => setFormData({ ...formData, overall_gpa: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Active Backlogs Count</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.backlogs_count}
                onChange={e => setFormData({ ...formData, backlogs_count: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Core Theory Average</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                className="form-input"
                value={formData.core_theory_average}
                onChange={e => setFormData({ ...formData, core_theory_average: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Mentor Sessions Attended</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                value={formData.mentor_meetings_attended}
                onChange={e => setFormData({ ...formData, mentor_meetings_attended: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Failed Subjects (Arrear results)</label>
              <input type="number" step="1" min="0" max="100" className="form-input"
                value={formData.failed_subjects_count}
                onChange={e => setFormData({ ...formData, failed_subjects_count: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Internal Exam Average</label>
              <input type="number" step="0.1" min="0" max="100" className="form-input"
                value={formData.internal_exam_avg}
                onChange={e => setFormData({ ...formData, internal_exam_avg: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Assignment Average</label>
              <input type="number" step="0.1" min="0" max="100" className="form-input"
                value={formData.assignment_avg}
                onChange={e => setFormData({ ...formData, assignment_avg: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'block', marginBottom: '0.35rem' }}>Grade Trend (last sem − first sem)</label>
              <input type="number" step="0.1" min="-10" max="10" className="form-input"
                value={formData.grade_trend}
                onChange={e => setFormData({ ...formData, grade_trend: e.target.value })} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem', background: 'var(--surface)', color: 'var(--ink-on-dark)', borderRadius: '9999px' }}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
            <span>{loading ? 'Evaluating Model Inference...' : 'Run Real-Time Prediction'}</span>
          </button>
        </form>

        {/* Prediction Results Display */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--ink)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)' }}>Diagnostic Inference Output</h3>
              {result && (
                <span className={`badge ${result.prediction === 'High' ? 'badge-high' : result.prediction === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                  {result.prediction} Risk Level
                </span>
              )}
            </div>

            {error && (
              <div style={{ padding: '1rem', background: 'var(--alert-bg)', border: '1px solid var(--alert-ink)', borderRadius: 'var(--radius-input)', color: 'var(--alert-ink)', fontSize: '0.85rem' }}>
                Error: {error}
              </div>
            )}

            {!result && !error && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink)', opacity: 0.65 }}>
                <BrainCircuit size={48} style={{ opacity: 0.35, marginBottom: '1rem', color: 'var(--ink)' }} />
                <p>Click "Run Real-Time Prediction" or choose a demo student to view probabilities and risk drivers.</p>
              </div>
            )}

            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Probabilities Breakdown */}
                <div style={{ padding: '1rem', background: 'var(--bg-accent)', borderRadius: 'var(--radius-input)', border: '1px solid var(--ink)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Calibrated Risk Probabilities
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--risk-low)', fontWeight: '700' }}>
                        <span>Low</span> <span>{(result.probabilities.Low * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(23, 83, 31, 0.15)', borderRadius: '4px', marginTop: '4px' }}>
                        <div style={{ width: `${result.probabilities.Low * 100}%`, height: '100%', background: 'var(--risk-low)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--risk-med)', fontWeight: '700' }}>
                        <span>Medium</span> <span>{(result.probabilities.Medium * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(23, 83, 31, 0.15)', borderRadius: '4px', marginTop: '4px' }}>
                        <div style={{ width: `${result.probabilities.Medium * 100}%`, height: '100%', background: 'var(--risk-med)', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--risk-high)', fontWeight: '700' }}>
                        <span>High</span> <span>{(result.probabilities.High * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(23, 83, 31, 0.15)', borderRadius: '4px', marginTop: '4px' }}>
                        <div style={{ width: `${result.probabilities.High * 100}%`, height: '100%', background: 'var(--risk-high)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plain Language Drivers */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Top Identified Risk Drivers (SHAP)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.top_risk_drivers.map((d, i) => (
                      <div key={i} style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-accent)', borderRadius: 'var(--radius-input)', border: '1px solid var(--ink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{d.message}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: d.contribution.startsWith('+') ? 'var(--risk-high)' : 'var(--risk-low)', marginLeft: '0.5rem' }}>
                          {d.contribution}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Interventions */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    Recommended Academic Interventions
                  </div>
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {result.recommended_interventions.map((rec, i) => (
                      <li key={i} style={{ fontSize: '0.825rem', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={14} color="#10B981" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(23, 83, 31, 0.2)' }}>
              <button
                type="button"
                onClick={() => navigate('/chat', { state: { student: { ...formData, prediction: result.prediction } } })}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  <img src="/baymate-avatar.png" alt="Baymate" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <span>Open in Baymate Academic Advisor Bot</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
