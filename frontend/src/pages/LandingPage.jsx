import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { 
  BrainCircuit, 
  BarChart3, 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  Award, 
  Layers, 
  Info,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      
      {/* 1. Hero Section */}
      <GlassCard style={{ padding: '3.5rem 2.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.4rem 0.9rem', 
              borderRadius: '9999px', 
              background: 'rgba(237, 77, 139, 0.15)', 
              border: '1px solid rgba(237, 77, 139, 0.3)', 
              color: '#ED4D8B', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              marginBottom: '1.25rem' 
            }}>
              <Sparkles size={14} /> Machine Learning &amp; Explainable AI in Engineering Higher Ed
            </div>

            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: '1.2', color: '#FFFFFF', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
              AI-Powered Student Dropout Prediction &amp; Proactive Academic Intervention System
            </h1>

            <p style={{ fontSize: '1.02rem', color: '#CBD5E1', lineHeight: '1.65', marginBottom: '2rem' }}>
              Traditional institutional retention relies on post-facto semester results when it is often too late to salvage credits. 
              This standalone engine synthesizes multi-semester continuous assessments, attendance decay trajectories, and socio-academic factors 
              across <strong>13 engineering disciplines</strong> to identify students at risk with <strong>99.35% minority-class recall</strong>, 
              explaining every prediction via SHAP feature attributions and executing automated intervention counseling.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/predict" className="btn-primary" style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem' }}>
                <span>Try Interactive Prediction</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/metrics" className="btn-secondary" style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem' }}>
                <BarChart3 size={18} />
                <span>Explore Model Benchmarks</span>
              </Link>
            </div>
          </div>

          {/* Generic Campus Life Photography Banner */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.4)'
            }}>
              <img 
                src="/images/campus_students_group.png" 
                alt="Engineering undergraduates on campus"
                style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                padding: '1rem 1.25rem',
                background: 'rgba(25, 20, 20, 0.85)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FFFFFF' }}>
                    Tamil Nadu Collegiate Cohort Retention
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>
                    Multi-Semester Monitoring Across 13 Engineering Branches
                  </div>
                </div>
                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                  4 Colleges Seeded
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 2. Research & Motivation Section (Grounding in Tamil Nadu Dropout Data) */}
      <section style={{
        background: 'var(--glass-tint)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ED4D8B', marginBottom: '0.5rem' }}>
          <TrendingUp size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Empirical Grounding &amp; State Education Research
          </span>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.75rem' }}>
          Why This Project: The Reality of Academic Distress in Tamil Nadu
        </h2>

        {/* 2-3 sentence "Why This Project" narrative */}
        <div style={{ 
          background: 'rgba(237, 77, 139, 0.12)', 
          borderLeft: '4px solid #ED4D8B', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          lineHeight: '1.65',
          color: '#E2E8F0',
          fontSize: '0.95rem'
        }}>
          In 2026, an Anna University academic audit revealed that across 24 affiliated engineering colleges in Tamil Nadu, 
          not a single student out of 2,425 enrolled passed any semester examinations across four full years. 
          Academic failure in higher education is rarely an abrupt, unpredictable event—it is a slow-motion accumulation 
          of uncleared course arrears, attendance decay, and unaddressed learning difficulties that compounds semester after semester. 
          This system was specifically designed to catch this gradual disengagement at the subject level before it reaches this point, 
          converting passive administrative logs into timely, compassionate mentor interventions.
        </div>

        {/* Grid of 4 Verified Statistics Cards with GlassCard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          {/* Stat Card 1 */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#F87171', marginBottom: '0.5rem' }}>
                7.7% → 8.5%
              </div>
              <p style={{ color: '#F1F5F9', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                "Tamil Nadu's secondary school dropout rate rose from 7.7% to 8.5% in a single year (2023-24 → 2024-25)."
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
              fontSize: '0.75rem', 
              color: '#CBD5E1',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: '#FBBF24' }}>UDISE+ 2024-25, Ministry of Education</span>
            </div>
          </GlassCard>

          {/* Stat Card 2 */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FB923C', marginBottom: '0.5rem' }}>
                10.7% / 23.3%
              </div>
              <p style={{ color: '#F1F5F9', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                "SC students in Tamil Nadu face a 10.7% dropout rate; ST students face 23.3% — far above the state average of 8.5%."
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
              fontSize: '0.75rem', 
              color: '#CBD5E1',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: '#FBBF24' }}>UDISE+ 2024-25, via Rajya Sabha Unstarred Q. 3723 (March 2026)</span>
            </div>
          </GlassCard>

          {/* Stat Card 3 */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#60A5FA', marginBottom: '0.5rem' }}>
                13% Churn
              </div>
              <p style={{ color: '#F1F5F9', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                "Only 87% of Tamil Nadu students transition from secondary to higher secondary education — 13% never make that jump at all."
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
              fontSize: '0.75rem', 
              color: '#CBD5E1',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: '#FBBF24' }}>UDISE+ 2024-25, Table 6.14</span>
            </div>
          </GlassCard>

          {/* Stat Card 4 */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ED4D8B', marginBottom: '0.5rem' }}>
                24 Colleges / 0%
              </div>
              <p style={{ color: '#F1F5F9', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                "A 2026 Anna University exam audit found 24 engineering colleges in Tamil Nadu where not a single student, out of 2,425 enrolled, passed any semester exam across 4 full years."
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
              fontSize: '0.75rem', 
              color: '#CBD5E1',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: '#ED4D8B' }}>Anna University exam audit, reported by DT Next (2026)</span>
            </div>
          </GlassCard>

        </div>

        {/* Clarification Callout on Seat Vacancy vs. Student Dropout */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          fontSize: '0.825rem',
          color: '#CBD5E1',
          lineHeight: '1.5'
        }}>
          <Info size={18} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#FFFFFF' }}>Important Methodological Distinction:</strong> Tamil Nadu's widely reported engineering seat 
            <em> vacancy</em> (where approved seats go unfilled during single-window TNEA counseling at admission) is an admissions phenomenon. 
            In contrast, <strong>student dropout</strong> refers to enrolled scholars who experience academic, emotional, or financial friction 
            and discontinue their engineering degrees. This platform addresses post-enrollment retention and semester persistence.
          </div>
        </div>
      </section>

      {/* 3. Feature Pillar Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <GlassCard>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(237, 77, 139, 0.15)', color: '#ED4D8B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BrainCircuit size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Trained XGBoost Classifier
          </h3>
          <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Tuned with 5-fold cross-validation and cost-sensitive class-weighting to handle extreme minority class proportions (81.65% Low / 9.92% Medium / 8.42% High).
          </p>
          <div style={{ fontSize: '0.8rem', color: '#ED4D8B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>96.58% Overall Accuracy • 0.9370 Macro F1 • 99.35% High Recall</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BarChart3 size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            SHAP Explainability Engine
          </h3>
          <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Eliminates black-box scores. TreeExplainer translates mathematical feature attributions into natural language drivers such as "3 active uncleared backlogs".
          </p>
          <div style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Per-student SHAP attributions &amp; tailored action plan</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <MessageSquare size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Contextual Intervention Chatbot
          </h3>
          <p style={{ color: '#CBD5E1', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem' }}>
            Grounded directly in verified student records, offering proactive check-ins, answering 75% attendance cutoff rules, and logging faculty mentor meetings.
          </p>
          <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Auto-logs MeetingRequest records into MongoDB Atlas</span>
          </div>
        </GlassCard>
      </section>

      {/* 4. Photographic Campus Life & Retention Goal Banner */}
      <GlassCard style={{ padding: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <img 
              src="/images/graduates_celebration.png" 
              alt="Engineering graduates celebrating graduation"
              style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div>
            <div style={{ color: '#10B981', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Retention Target
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '0.75rem' }}>
              From Early Warning to Timely Degree Completion
            </h3>
            <p style={{ color: '#CBD5E1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              By intercepting attendance declines and arrear accumulation early in Year 1 and Year 2, academic counselors 
              can schedule timely tutoring, peer groups, and condonation recovery sessions—ensuring every admitted scholar 
              has a clear, supported path to graduation and placement eligibility.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-low" style={{ fontSize: '0.75rem' }}>
                <CheckCircle2 size={12} /> 99.35% High Risk Recall
              </span>
              <span className="badge badge-medium" style={{ fontSize: '0.75rem' }}>
                <Users size={12} /> Faculty Mentor Scheduling
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* 5. System Architecture Flow */}
      <section style={{
        background: 'var(--glass-tint)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#ED4D8B', marginBottom: '0.5rem' }}>
          <Layers size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dual-Layer Enterprise Architecture
          </span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '1rem' }}>
          How the Standalone AI Service Integrates with Institutional Systems
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <GlassCard style={{ padding: '1.25rem', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div style={{ color: '#ED4D8B', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              1. Public Express Gateway (Port 5001)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.5' }}>
              Serves public CORS-enabled endpoints (`/api/predict`, `/api/metrics`, `/api/chat`), validates requests via `X-API-Key`, and stores demo students &amp; meeting logs in MongoDB Atlas.
            </p>
          </GlassCard>

          <GlassCard style={{ padding: '1.25rem', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div style={{ color: '#F59E0B', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              2. Internal FastAPI Microservice (Port 8001)
            </div>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.5' }}>
              Protected internal Python service loading the serialized XGBoost pipeline, TreeExplainer SHAP attribution engine, and LLM intervention layer.
            </p>
          </GlassCard>

          <GlassCard style={{ padding: '1.25rem', background: 'rgba(30, 24, 24, 0.65)' }}>
            <div style={{ color: '#10B981', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              3. College ERP Live Integration
            </div>
            <p style={{ fontSize: '0.8rem', color: '#CBD5E1', lineHeight: '1.5' }}>
              The existing institutional ERP calls this standalone API to render real-time risk badges in mentor dashboards and embed the intervention dialogue agent.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
