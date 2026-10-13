import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import GlassCard from '../components/GlassCard';
import HeroParallax from '../components/HeroParallax';
import ScrollParallax from '../components/ScrollParallax';
import DemoVideo from '../components/DemoVideo';
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
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      <HeroParallax />
      <ScrollParallax />

      {/* 1. Hero Section */}
      <GlassCard data-parallax-hero="true" style={{ padding: '4.5rem 2.5rem', position: 'relative', background: 'linear-gradient(180deg, var(--bg-accent) 0%, var(--bg) 50%, var(--bg-accent) 100%)', border: '1px solid var(--ink)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Left Photo Column */}
        <div className="hero-col-left" data-allowlist="hero-photo-ring">
          <img src="/images/campus_students_group.png" alt="" width="220" height="150" data-hero-photo="true" data-depth="0.65" className="hero-photo hero-photo-l1" />
          <img src="/images/campus_walk_students.png" alt="" width="190" height="135" data-hero-photo="true" data-depth="0.85" className="hero-photo hero-photo-l2" />
        </div>

        {/* Center Text Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', zIndex: 2, minHeight: '460px', padding: '1rem 0', maxWidth: '640px', margin: '0 auto' }}>
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.45rem 1rem', 
              borderRadius: '9999px', 
              background: 'transparent', 
              border: '1px solid var(--ink)', 
              color: 'var(--ink)', 
              fontSize: '0.8rem', 
              fontWeight: '700', 
              marginBottom: '1.5rem' 
            }}>
              <Sparkles size={14} /> Machine Learning &amp; Explainable AI in Engineering Higher Ed
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 4.4vw, 3.75rem)', fontWeight: '700', lineHeight: '1.08', color: 'var(--ink)', marginBottom: '2rem', letterSpacing: '-0.03em', textAlign: 'center', textWrap: 'balance' }}>
              AI-Powered Student Dropout Prediction &amp; Proactive Academic Intervention System
            </h1>

            <p style={{ display: 'none' }}>
              Traditional institutional retention relies on post-facto semester results when it is often too late to salvage credits. 
              This standalone engine synthesizes multi-semester continuous assessments, attendance decay trajectories, and socio-academic factors 
              across <strong>13 engineering disciplines</strong> to identify students at risk with <strong>99.35% minority-class recall</strong>, 
              explaining every prediction via SHAP feature attributions and executing automated intervention counseling.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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

          {/* Generic Campus Life Photography Banner (hidden from centered hero) */}
          <div style={{ display: 'none' }}>
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 16px 32px rgba(23, 83, 31, 0.15)',
              border: '1px solid var(--ink)',
              background: 'var(--bg-accent)'
            }}>
              <img 
                src="/images/campus_students_group.png" 
                alt="Engineering undergraduates on campus"
                width="480"
                height="280"
                loading="eager"
                style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                padding: '1rem 1.25rem',
                background: 'var(--bg)',
                borderTop: '1px solid var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--ink)' }}>
                    Tamil Nadu Collegiate Cohort Retention
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--ink)', opacity: 0.8 }}>
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

        {/* Right Photo Column */}
        <div className="hero-col-right" data-allowlist="hero-photo-ring">
          <img src="/images/college_students_corridor.png" alt="" width="200" height="145" data-hero-photo="true" data-depth="0.75" className="hero-photo hero-photo-r1" />
          <img src="/images/engineering_students_tn.png" alt="" width="230" height="155" data-hero-photo="true" data-depth="0.55" className="hero-photo hero-photo-r2" />
        </div>

        {/* Mobile Photo Row (<700px): row of photos below buttons */}
        <div className="hero-mobile-photos" data-allowlist="hero-photo-ring">
          <img src="/images/campus_walk_students.png" alt="" width="110" height="80" className="hero-mobile-photo" />
          <img src="/images/college_students_corridor.png" alt="" width="110" height="80" className="hero-mobile-photo" />
        </div>
      </GlassCard>

      {/* Decorative Continuous Ticker */}
      <div className="ticker-band" data-allowlist="ticker">
        <div className="ticker-track">
          <span>Tamil Nadu secondary school dropout rose 7.7% → 8.5% (UDISE+ 2024-25)</span>
          <span className="ticker-star">★</span>
          <span>SC 10.7% / ST 23.3% dropout rates vs 8.5% state average (Rajya Sabha Q. 3723)</span>
          <span className="ticker-star">★</span>
          <span>Only 87% transition to higher secondary — 13% churn (UDISE+ Table 6.14)</span>
          <span className="ticker-star">★</span>
          <span>24 engineering colleges with 0% pass across 4 years (DT Next analysis of Anna University exam results)</span>
          <span className="ticker-star">★</span>
          <span aria-hidden="true">Tamil Nadu secondary school dropout rose 7.7% → 8.5% (UDISE+ 2024-25)</span>
          <span className="ticker-star" aria-hidden="true">★</span>
          <span aria-hidden="true">SC 10.7% / ST 23.3% dropout rates vs 8.5% state average (Rajya Sabha Q. 3723)</span>
          <span className="ticker-star" aria-hidden="true">★</span>
          <span aria-hidden="true">Only 87% transition to higher secondary — 13% churn (UDISE+ Table 6.14)</span>
          <span className="ticker-star" aria-hidden="true">★</span>
          <span aria-hidden="true">24 engineering colleges with 0% pass across 4 years (DT Next analysis of Anna University exam results)</span>
        </div>
      </div>

      {/* About / How It Works Section */}
      <section 
        data-allowlist="about-section"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--ink)',
          borderRadius: 'var(--radius)',
          padding: '2.5rem 2rem'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div 
            style={{ 
              color: 'var(--ink)', 
              fontWeight: '700', 
              fontSize: '0.8rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              marginBottom: '0.5rem' 
            }}
          >
            ABOUT OUR MODEL &amp; SYSTEM
          </div>
          <h2 
            style={{ 
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', 
              fontWeight: '700', 
              color: 'var(--ink)', 
              marginBottom: '1rem',
              lineHeight: '1.1'
            }}
          >
            Early warning before a student falls behind
          </h2>
          <p style={{ maxWidth: '820px', margin: '0 auto 1.25rem auto', fontSize: '0.975rem', color: 'var(--ink)', opacity: 0.95, lineHeight: '1.65' }}>
            Traditional institutional retention relies on post-facto semester results when it is often too late to salvage credits. 
            This standalone engine synthesizes multi-semester continuous assessments, attendance decay trajectories, and socio-academic factors 
            across <strong>13 engineering disciplines</strong> to identify students at risk with <strong>99.35% minority-class recall</strong>, 
            explaining every prediction via SHAP feature attributions and executing automated intervention counseling.
          </p>
        </div>

        {/* 3 Step Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card-sand">
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--ink)', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              STEP 01
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.75rem' }}>
              Signals in, risk scored
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: '1.6', opacity: 0.9 }}>
              Academic performance, attendance trends, fee payment history and engagement indicators are analysed in real time by our trained ensemble model.
            </p>
          </div>

          <div className="card-green">
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--ink-on-dark)', opacity: 0.75, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              STEP 02
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--ink-on-dark)', marginBottom: '0.75rem' }}>
              Explainable factor breakdowns
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-on-dark)', lineHeight: '1.6', opacity: 0.9 }}>
              Every prediction includes SHAP feature attributions, showing advisors exactly why a student was flagged — not just a raw score.
            </p>
          </div>

          <div className="card-sand">
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--ink)', opacity: 0.6, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              STEP 03
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.75rem' }}>
              Actionable human intervention
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: '1.6', opacity: 0.9 }}>
              Advisors dispatch proactive mentoring, financial guidance or academic support workflows before dropouts occur.
            </p>
          </div>
        </div>

        {/* 3 Route Link Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <Link to="/metrics" className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textDecoration: 'none' }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--ink)' }}>
                <BarChart3 size={20} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Explore Model Metrics
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink)', opacity: 0.85, lineHeight: '1.5' }}>
                Inspect 5-fold cross-validation, confusion matrices, ROC curves, and class-balanced performance benchmarks.
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--ink)', marginTop: '1.25rem' }}>
              <span>View Benchmarks</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/predict" className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textDecoration: 'none' }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--ink)' }}>
                <BrainCircuit size={20} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Run a Student Prediction
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink)', opacity: 0.85, lineHeight: '1.5' }}>
                Simulate continuous assessment marks, attendance trajectory, and arrear status for instant risk classification.
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--ink)', marginTop: '1.25rem' }}>
              <span>Launch Simulator</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/chat" className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textDecoration: 'none' }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'var(--ink)' }}>
                <MessageSquare size={20} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Talk to Academic Support
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--ink)', opacity: 0.85, lineHeight: '1.5' }}>
                Interactive counseling assistant with real-time academic rules guidance and faculty mentor appointment booking.
              </p>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700', fontSize: '0.85rem', color: 'var(--ink)', marginTop: '1.25rem' }}>
              <span>Start Dialogue</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>

        {/* Small simulated-data note */}
        <p style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--ink)', opacity: 0.7, lineHeight: '1.5', margin: '0 auto', maxWidth: '640px' }}>
          Trained and evaluated on validated educational datasets. Demonstrations use synthetic and anonymised student profiles.
        </p>
      </section>

      {/* Demo Video Section */}
      <DemoVideo />

      {/* 2. Research & Motivation Section (Grounding in Tamil Nadu Dropout Data) */}
      <section style={{
        background: 'var(--bg)',
        border: '1px solid var(--ink)',
        borderRadius: 'var(--radius)',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 24px rgba(23, 83, 31, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
          <TrendingUp size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Empirical Grounding &amp; State Education Research
          </span>
        </div>

        <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: '700', color: 'var(--ink)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
          Why This Project: The Reality of Academic Distress in Tamil Nadu
        </h2>

        {/* 2-3 sentence "Why This Project" narrative */}
        <div style={{ 
          background: 'var(--bg-accent)', 
          borderLeft: '4px solid var(--ink)', 
          padding: '1.25rem 1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          lineHeight: '1.65',
          color: 'var(--ink)',
          fontSize: '0.95rem'
        }}>
          In 2026, a DT Next analysis of Anna University exam results revealed that across 24 affiliated engineering colleges in Tamil Nadu, 
          not a single student out of 2,425 who sat for semester examinations passed any semester examinations across four full years (the source reports the university had not yet received the data from the Directorate of Technical Education). 
          Academic failure in higher education is rarely an abrupt, unpredictable event—it is a slow-motion accumulation 
          of uncleared course arrears, attendance decay, and unaddressed learning difficulties that compounds semester after semester. 
          This system was specifically designed to catch this gradual disengagement from attendance, marks and backlog signals before it reaches this point, 
          converting passive administrative logs into timely, compassionate mentor interventions.
        </div>

        {/* Grid of 4 Verified Statistics Cards with 2-Column Checkerboard Alternation */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          
          {/* Stat Card 1: Sand tile */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-accent)', border: '1px solid var(--ink)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--risk-high)', marginBottom: '0.5rem' }}>
                7.7% → 8.5%
              </div>
              <p style={{ color: 'var(--ink)', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                Tamil Nadu's secondary school dropout rate rose from 7.7% to 8.5% in a single year (2023-24 → 2024-25).
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(23, 83, 31, 0.2)', 
              fontSize: '0.75rem', 
              color: 'var(--ink)',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: 'var(--risk-med)', fontWeight: '700' }}>UDISE+ 2024-25, Ministry of Education</span>
            </div>
          </GlassCard>

          {/* Stat Card 2: Solid green card */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--surface)', border: '1px solid var(--surface)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ink-on-dark)', marginBottom: '0.5rem' }}>
                10.7% / 23.3%
              </div>
              <p style={{ color: 'var(--ink-on-dark)', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                SC students in Tamil Nadu face a 10.7% dropout rate; ST students face 23.3% — far above the state average of 8.5%.
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(252, 250, 238, 0.2)', 
              fontSize: '0.75rem', 
              color: 'var(--ink-on-dark)',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: 'var(--star)', fontWeight: '700' }}>UDISE+ 2024-25, via Rajya Sabha Unstarred Q. 3723 (March 2026)</span>
            </div>
          </GlassCard>

          {/* Stat Card 3: Solid green card */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--surface)', border: '1px solid var(--surface)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--ink-on-dark)', marginBottom: '0.5rem' }}>
                13% Churn
              </div>
              <p style={{ color: 'var(--ink-on-dark)', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                Only 87% of Tamil Nadu students transition from secondary to higher secondary education — 13% never make that jump at all.
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(252, 250, 238, 0.2)', 
              fontSize: '0.75rem', 
              color: 'var(--ink-on-dark)',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: 'var(--star)', fontWeight: '700' }}>UDISE+ 2024-25, Table 6.14</span>
            </div>
          </GlassCard>

          {/* Stat Card 4: Sand tile */}
          <GlassCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--bg-accent)', border: '1px solid var(--ink)' }}>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--risk-high)', marginBottom: '0.5rem' }}>
                24 Colleges / 0%
              </div>
              <p style={{ color: 'var(--ink)', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500', marginBottom: '1.25rem' }}>
                A 2026 DT Next analysis of Anna University exam results found 24 engineering colleges in Tamil Nadu where not a single student, out of 2,425 who sat for semester examinations, passed any semester exam across 4 full years (the source reports the university had not yet received the data from the Directorate of Technical Education).
              </p>
            </div>
            <div style={{ 
              paddingTop: '0.75rem', 
              borderTop: '1px solid rgba(23, 83, 31, 0.2)', 
              fontSize: '0.75rem', 
              color: 'var(--ink)',
              fontWeight: '600'
            }}>
              Source: <span style={{ color: 'var(--risk-high)', fontWeight: '700' }}>DT Next analysis of Anna University exam results (2026)</span>
            </div>
          </GlassCard>

        </div>

        {/* Clarification Callout on Seat Vacancy vs. Student Dropout */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-accent)',
          border: '1px solid var(--ink)',
          borderRadius: '10px',
          fontSize: '0.825rem',
          color: 'var(--ink)',
          lineHeight: '1.5'
        }}>
          <Info size={18} color="#60A5FA" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--ink)' }}>Important Methodological Distinction:</strong> Tamil Nadu's widely reported engineering seat 
            <em> vacancy</em> (where approved seats go unfilled during single-window TNEA counseling at admission) is an admissions phenomenon. 
            In contrast, <strong>student dropout</strong> refers to enrolled students who experience academic, emotional, or financial friction 
            and discontinue their engineering degrees. This platform addresses post-enrollment retention and semester persistence.
          </div>
        </div>
      </section>

      {/* 3. Feature Pillar Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <GlassCard>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--ink)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BrainCircuit size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.5rem' }}>
            Trained XGBoost Classifier
          </h3>
          <p style={{ color: 'var(--ink)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem', opacity: 0.9 }}>
            Tuned with 5-fold cross-validation and cost-sensitive class-weighting to handle minority classes (81.65% Low / 9.92% Medium / 8.42% High).
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>
              {metrics 
                ? `${(metrics.accuracy * 100).toFixed(2)}% Overall Accuracy • ${metrics.macro_f1.toFixed(4)} Macro F1 • ${(metrics.classes?.High?.recall * 100).toFixed(2)}% High Recall` 
                : 'Trained XGBoost offline benchmark'}
            </span>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--ink)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BarChart3 size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.5rem' }}>
            SHAP Explainability Engine
          </h3>
          <p style={{ color: 'var(--ink)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem', opacity: 0.9 }}>
            Explains each score with SHAP. TreeExplainer translates mathematical feature attributions into natural language drivers such as "3 active uncleared backlogs".
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Per-student SHAP attributions &amp; tailored action plan</span>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--ink)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <MessageSquare size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--ink)', marginBottom: '0.5rem' }}>
            Contextual Intervention Chatbot
          </h3>
          <p style={{ color: 'var(--ink)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1rem', opacity: 0.9 }}>
            Grounded in the student's record in the (simulated) dataset, offering proactive check-ins, answering 75% attendance cutoff rules, and logging faculty mentor meetings.
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Auto-logs MeetingRequest records into MongoDB Atlas</span>
          </div>
        </GlassCard>
      </section>

      {/* 4. Photographic Campus Life & Retention Goal Banner */}
      <GlassCard style={{ padding: '2rem', background: 'var(--bg-accent)', border: '1px solid var(--ink)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--ink)' }}>
            <img 
              src="/images/graduates_celebration.png" 
              alt="Engineering graduates celebrating graduation"
              width="480"
              height="260"
              loading="lazy"
              style={{ width: '100%', height: '260px', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div>
            <div style={{ color: 'var(--ink)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Retention Target
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--ink)', marginBottom: '0.75rem' }}>
              From Early Warning to Timely Degree Completion
            </h3>
            <p style={{ color: 'var(--ink)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              By intercepting attendance declines and arrear accumulation early in Year 1 and Year 2, academic counselors 
              can schedule timely tutoring, peer groups, and condonation recovery sessions.
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
        background: 'var(--bg)',
        border: '1px solid var(--ink)',
        borderRadius: 'var(--radius)',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 24px rgba(23, 83, 31, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
          <Layers size={20} />
          <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Dual-Layer Enterprise Architecture
          </span>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--ink)', marginBottom: '1rem' }}>
          How the Standalone AI Service Integrates with Institutional Systems
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <GlassCard style={{ padding: '1.25rem', background: 'var(--bg-accent)', border: '1px solid var(--ink)' }}>
            <div style={{ color: 'var(--ink)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              1. Public Express Gateway (Port 5001)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink)', lineHeight: '1.5' }}>
              Serves API endpoints protected by an API key and an origin allowlist (`/api/predict`, `/api/metrics`, `/api/chat`), validates requests via `X-API-Key` or session token, and stores demo students &amp; meeting logs in MongoDB Atlas.
            </p>
          </GlassCard>

          <GlassCard style={{ padding: '1.25rem', background: 'var(--surface)', border: '1px solid var(--surface)', color: 'var(--ink-on-dark)' }}>
            <div style={{ color: 'var(--ink-on-dark)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              2. Internal FastAPI Microservice (Port 8001)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-on-dark)', lineHeight: '1.5', opacity: 0.9 }}>
              Protected internal Python service loading the serialized XGBoost pipeline, TreeExplainer SHAP attribution engine, and LLM intervention layer.
            </p>
          </GlassCard>

          <GlassCard style={{ padding: '1.25rem', background: 'var(--bg-accent)', border: '1px solid var(--ink)' }}>
            <div style={{ color: 'var(--ink)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.4rem' }}>
              3. College ERP Live Integration
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink)', lineHeight: '1.5' }}>
              The prototype ERP shows the live assessment on the student detail page and its chat widget uses this service to render real-time risk badges in mentor dashboards and embed the intervention dialogue agent.
            </p>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
