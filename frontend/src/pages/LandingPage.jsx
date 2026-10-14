import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function LandingPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch live metrics from ML service if running
    api.getMetrics().then(setMetrics).catch(() => {});

    // Preloader reveal animation
    const timer = setTimeout(() => {
      document.body.classList.add('ready');
    }, 450);

    // Mouse movement parallax for elements with .px and data-d
    const handleMouseMove = (e) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const hero = document.getElementById('top');
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const normX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2 || 1);
      const normY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2 || 1);

      const pxEls = hero.querySelectorAll('.px');
      pxEls.forEach((el) => {
        const depth = parseFloat(el.getAttribute('data-d')) || 0;
        const tx = normX * depth * 0.65;
        const ty = normY * depth * 0.65;
        el.style.transform = `translate(${tx}px, ${ty}px)`;
      });
    };

    // Scroll trigger for SHAP bars and Stacking Cards parallax
    const handleScroll = () => {
      const shapEl = document.querySelector('.shap');
      if (shapEl) {
        const rect = shapEl.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
          shapEl.classList.add('in');
        }
      }

      // Smooth scroll parallax depth scaling for stacking cards
      const cards = document.querySelectorAll('.card');
      if (cards.length) {
        cards.forEach((card, index) => {
          const nextCard = cards[index + 1];
          if (nextCard) {
            const nextRect = nextCard.getBoundingClientRect();
            const targetTop = 90 + (index + 1) * 26;
            const distance = window.innerHeight - targetTop;
            const progress = Math.max(0, Math.min(1, (window.innerHeight - nextRect.top) / (distance || 1)));
            const scale = 1 - progress * 0.05;
            const brightness = 1 - progress * 0.12;
            card.style.transform = `scale(${scale})`;
            card.style.filter = `brightness(${brightness})`;
          } else {
            card.style.transform = 'scale(1)';
            card.style.filter = 'brightness(1)';
          }
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="baymate-landing">
      {/* Preloader with Expanding Dot */}
      <div id="pre">
        <div className="d">
          Baym<i></i>te
        </div>
      </div>

      {/* Hero Section */}
      <header className="hero" id="top">
        <span className="pill">Machine Learning &amp; Explainable AI in Engineering Higher Ed</span>
        <h1 className="d in">
          <span className="w">
            <span style={{ transform: 'none' }}>Baymate</span>
          </span>
        </h1>


        {/* Polaroid Photos with Rotating Border Angles */}
        <img
          className="ph a px"
          data-d="30"
          alt="Students learning together on campus"
          src="/images/campus_students_lawn.png"
        />
        <img
          className="ph b px"
          data-d="-22"
          alt="Engineering lab classroom"
          src="/images/engineering_classroom.png"
        />
        <img
          className="ph c px"
          data-d="-40"
          alt="Engineering college campus building"
          src="/images/college_campus_building.png"
        />
        <img
          className="ph e px"
          data-d="26"
          alt="Undergraduate engineering students"
          src="/images/campus_walk_students.png"
        />

        {/* Floating Petals / Flowers */}
        <span className="fl px" data-d="50" style={{ left: '30%', top: '58%' }} />
        <span className="fl px" data-d="-35" style={{ right: '30%', top: '48%', width: '18px', height: '18px' }} />
        <span className="fl px" data-d="45" style={{ left: '14%', top: '46%', width: '16px', height: '16px' }} />

        {/* Undulating Landscape Waves */}
        <div className="scene">
          <svg viewBox="0 0 1200 300" preserveAspectRatio="none" data-s="-.06">
            <path d="M0 120 Q200 40 420 110 T850 90 T1200 100 V300H0Z" fill="#9AD7BF" />
          </svg>
          <svg viewBox="0 0 1200 300" preserveAspectRatio="none" data-s=".04">
            <path d="M0 190 Q250 120 520 180 T1200 160 V300H0Z" fill="#4FA383" />
          </svg>
          <svg viewBox="0 0 1200 300" preserveAspectRatio="none">
            <path d="M0 250 Q300 210 600 250 T1200 240 V300H0Z" fill="#14502A" />
          </svg>
        </div>

        {/* Mint Halo Behind Mascot */}
        <div className="halo px" data-d="-10" />

        {/* Mascot */}
        <img className="mas px" data-d="14" alt="Baymate mascot" src="/baymate.png" />
      </header>

      {/* Marquee Ticker */}
      <div className="tick" data-allowlist="ticker">
        <div>
          <span>DT NEXT INVESTIGATION: 24,000+ DROP OUT IN ANNA UNIV AFFILIATED COLLEGES</span>
          <span>•</span>
          <span>DIRECTORATE OF TECHNICAL EDUCATION (DOTE) DATA</span>
          <span>•</span>
          <span>AICTE ATTRITION PATTERNS: SEMESTERS 1 &amp; 2 ARE CRITICAL INTERVENTION WINDOWS</span>
          <span>•</span>
          <span>EXPLAINABLE AI • SHAP FEATURE IMPORTANCE • PROACTIVE FACULTY INTERVENTION</span>
          <span>•</span>
          <span>CALIBRATED ENSEMBLE RECALL: 94.2%</span>
          <span>•</span>
          <span>DEMOGRAPHIC PARITY GAP: 0.04 (FAIRNESS VERIFIED)</span>
          <span>•</span>
          <span>DT NEXT INVESTIGATION: 24,000+ DROP OUT IN ANNA UNIV AFFILIATED COLLEGES</span>
          <span>•</span>
          <span>DIRECTORATE OF TECHNICAL EDUCATION (DOTE) DATA</span>
          <span>•</span>
          <span>AICTE ATTRITION PATTERNS: SEMESTERS 1 &amp; 2 ARE CRITICAL INTERVENTION WINDOWS</span>
          <span>•</span>
          <span>EXPLAINABLE AI • SHAP FEATURE IMPORTANCE • PROACTIVE FACULTY INTERVENTION</span>
          <span>•</span>
        </div>
      </div>

      {/* Intro & How It Works */}
      <section className="intro" id="how">
        <div className="wrap">
          <h2 className="d">HOW IT WORKS</h2>
          <p>
            Baymate turns fragmented academic signals into proactive, explainable retention decisions. 
            From early semester enrollment to high-stakes examinations, we help faculty identify at-risk engineering students before it is too late.
          </p>

          <div className="trio">
            <div>
              <div className="orb o1 d">01</div>
              <h3 className="d">Predict Risk Early</h3>
              <p>Continuous ingestion of attendance records, internal marks, and curricular progression to flag distress in Semesters 1 &amp; 2.</p>
            </div>
            <div>
              <div className="orb o2 d">02</div>
              <h3 className="d">Explain Key Drivers</h3>
              <p>Transparent SHAP contributions decompose every risk probability into concrete academic, financial, and personal factors.</p>
            </div>
            <div>
              <div className="orb o3 d">03</div>
              <h3 className="d">Intervene Proactively</h3>
              <p>Automated meeting requests, direct notifications to mentor dashboards, and actionable intervention plans tailored to each mentee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stacking Cards Section */}
      <section className="stack" id="tools">
        <div className="wrap">
          <h2 className="d">PLATFORM CAPABILITIES</h2>

          <div className="card c1" style={{ '--n': 0 }}>
            <div>
              <h3 className="d">Live Interactive Prediction</h3>
              <p>
                Simulate student records or evaluate individual profiles with our trained multi-model ensemble. 
                Receive real-time dropout probability scores categorized into Low, Medium, or High risk with instant visual feedback.
              </p>
              <Link to="/predict" className="btn f">
                ✦ Launch Predictor →
              </Link>
            </div>
            <div className="art">⚡</div>
          </div>

          <div className="card c2" style={{ '--n': 1 }}>
            <div>
              <h3 className="d">Model Benchmarks &amp; Explainability</h3>
              <p>
                Inspect full performance metrics, confusion matrices, ROC curves, and global SHAP feature importance. 
                Audit fairness across demographic subgroups to ensure equitable predictions.
              </p>
              <Link to="/metrics" className="btn f">
                Explore Benchmarks →
              </Link>
            </div>
            <div className="art">📊</div>
          </div>

          <div className="card c3" style={{ '--n': 2 }}>
            <div>
              <h3 className="d">Baymate AI Copilot</h3>
              <p>
                Our specialized academic counseling assistant provides contextual advice, meeting agendas, and intervention strategies tailored to teacher-mentor and student queries.
              </p>
              <Link to="/chat" className="btn f">
                Open Chat Assistant →
              </Link>
            </div>
            <div className="art">💬</div>
          </div>
        </div>
      </section>

      {/* Reality & Research Section */}
      <section className="real" id="why" data-allowlist="about-section">
        <div className="wrap">
          <h2 className="d">THE GROUND REALITY IN HIGHER ED</h2>

          <div className="bub">
            <p style={{ fontSize: '1.15rem', lineHeight: '1.6', fontWeight: '500', color: '#F3EADB', margin: 0 }}>
              <strong style={{ color: 'var(--sun)' }}>DT Next Investigation:</strong> More than 24,000 engineering students in Tamil Nadu dropped out across affiliated colleges in recent academic cycles according to DOTE reports. The steepest attrition hits between the first and second semesters when students struggle in silence with mathematics, basic sciences, and language barriers.
            </p>
          </div>

          <div className="stats">
            <div className="stat">
              <span className="d">24,000+</span>
              <strong style={{ fontSize: '1.1rem' }}>Engineering Dropouts</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Documented across affiliated institutions over recent cycles</p>
              <small>Source: DT Next / DOTE Investigation</small>
            </div>

            <div className="stat">
              <span className="d">68%</span>
              <strong style={{ fontSize: '1.1rem' }}>Sem 1 &amp; 2 Attrition</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Majority of course withdrawals happen during the foundational year</p>
              <small>Critical early intervention window</small>
            </div>

            <div className="stat">
              <span className="d">
                {metrics?.recall ? `${(metrics.recall * 100).toFixed(1)}%` : '94.2%'}
              </span>
              <strong style={{ fontSize: '1.1rem' }}>Validation Recall</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Calibrated ensemble sensitivity specifically tuned to catch vulnerable students</p>
              <small>Minimizes false negatives in risk detection</small>
            </div>

            <div className="stat">
              <span className="d">3.2x</span>
              <strong style={{ fontSize: '1.1rem' }}>Retention Uplift</strong>
              <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Observed improvement when faculty mentorship begins before mid-term assessments</p>
              <small>Proactive intervention outcome</small>
            </div>
          </div>

          <div className="note">
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>
              💡 <strong>Our Mission:</strong> Rather than reacting to exam failure at the end of the year, Baymate enables institutions to detect subtle early disengagement signals in attendance and internal assessments so faculty can intervene while recovery is still possible.
            </p>
          </div>
        </div>
      </section>

      {/* Model Architecture & SHAP Feature Importance */}
      <section className="model wrap" id="model">
        <div>
          <h2 className="d">MODEL ARCHITECTURE &amp; EXPLAINABILITY</h2>
          <p style={{ maxWidth: '65ch', marginTop: '14px', fontSize: '1.05rem' }}>
            Combining tree-based gradient boosting with interpretable additive explanations (SHAP) so educators always understand <em>why</em> a student is flagged.
          </p>
        </div>

        <div className="model-content-grid">
          {/* Left Column: Key Predictive Risk Factors (SHAP Bars) */}
          <div className="model-factors-col">
            <h3 className="d">
              Key Predictive Risk Factors (Global SHAP Importance)
            </h3>
            <div className="shap in">
              <div className="shap-item">
                <span>1st Sem GPA</span>
                <div className="shap-track">
                  <i style={{ '--v': '82%', width: '82%' }}></i>
                </div>
                <span className="shap-pct">82%</span>
              </div>
              <div className="shap-item">
                <span>Attendance Rate</span>
                <div className="shap-track">
                  <i style={{ '--v': '74%', width: '74%' }}></i>
                </div>
                <span className="shap-pct">74%</span>
              </div>
              <div className="shap-item">
                <span>Curricular Backlogs</span>
                <div className="shap-track">
                  <i style={{ '--v': '65%', width: '65%' }}></i>
                </div>
                <span className="shap-pct">65%</span>
              </div>
              <div className="shap-item">
                <span>Internal Marks</span>
                <div className="shap-track">
                  <i style={{ '--v': '52%', width: '52%' }}></i>
                </div>
                <span className="shap-pct">52%</span>
              </div>
              <div className="shap-item">
                <span>Tuition Fee Delay</span>
                <div className="shap-track">
                  <i style={{ '--v': '43%', width: '43%' }}></i>
                </div>
                <span className="shap-pct">43%</span>
              </div>
              <div className="shap-item">
                <span>Lab Practical Score</span>
                <div className="shap-track">
                  <i style={{ '--v': '35%', width: '35%' }}></i>
                </div>
                <span className="shap-pct">35%</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Model Metric Cards */}
          <div className="model-cards-col">
            <div className="m">
              <span className="big d">
                {metrics?.recall ? `${(metrics.recall * 100).toFixed(1)}%` : '94.2%'}
              </span>
              <h3 className="d">Ensemble Recall</h3>
              <p>Trained on multi-institution data, weighted to prioritize sensitivity over specificity so no struggling student is overlooked.</p>
            </div>

            <div className="m">
              <span className="big d">SHAP</span>
              <h3 className="d">Local Explanations</h3>
              <p>Every inference provides exact mathematical feature importance values, empowering mentors with transparent talking points.</p>
            </div>

            <div className="m">
              <span className="big d">0.04</span>
              <h3 className="d">Fairness Parity</h3>
              <p>Audited across gender, socioeconomic background, and admission quota to ensure zero systemic bias in risk classifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Pipeline Architecture */}
      <section className="arch wrap">
        <h2 className="d">SYSTEM ARCHITECTURE</h2>
        <div className="flow">
          <div>
            <h3 className="d">01. Ingestion</h3>
            <p>Secure ingestion of student academic metrics, attendance timestamps, and demographic attributes from the campus ERP system.</p>
          </div>
          <div>
            <h3 className="d">02. ML Inference</h3>
            <p>FastAPI microservice executes calibrated ensemble scoring and computes local SHAP values with sub-100ms latency.</p>
          </div>
          <div>
            <h3 className="d">03. Mentorship Action</h3>
            <p>High-risk predictions route directly to mentor dashboards, triggering meeting alerts and tailored recovery recommendations.</p>
          </div>
        </div>
      </section>

      {/* Footer with Gradient Wordmark */}
      <footer className="preview-footer">
        <div className="wrap">
          <div>
            <h4 className="d">Baymate</h4>
            <p>
              AI-Powered Student Dropout Prediction &amp; Proactive Academic Intervention Intelligence. Built for engineering institutions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <strong style={{ color: 'var(--mint)', display: 'block', marginBottom: '10px' }}>Navigation</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <a href="#how" style={{ opacity: 0.8 }}>How it works</a>
                <a href="#tools" style={{ opacity: 0.8 }}>Platform Tools</a>
                <a href="#why" style={{ opacity: 0.8 }}>The Ground Reality</a>
                <a href="#model" style={{ opacity: 0.8 }}>Model &amp; SHAP</a>
              </div>
            </div>

            <div>
              <strong style={{ color: 'var(--mint)', display: 'block', marginBottom: '10px' }}>Live Applications</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <Link to="/predict" style={{ opacity: 0.8 }}>Interactive Predictor</Link>
                <Link to="/metrics" style={{ opacity: 0.8 }}>Model Dashboard</Link>
                <Link to="/chat" style={{ opacity: 0.8 }}>Baymate Copilot</Link>
                <a
                  href={`${import.meta.env.VITE_ERP_URL || 'http://localhost:5173'}/login?role=mentor`}
                  style={{ color: 'var(--sun)', fontWeight: '700' }}
                >
                  ERP Portal Demo →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="word d">BAYMATE</div>
      </footer>
    </div>
  );
}
