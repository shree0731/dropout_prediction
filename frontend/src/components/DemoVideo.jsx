import React, { useState, useRef, useEffect } from 'react';

/**
 * DemoVideo Component
 * "See it working" editorial demo video section:
 * - Browser-frame container with window control dots and title bar.
 * - <video muted loop playsinline preload="metadata" poster="/demo/poster.jpg">
 * - Plays only while visible (IntersectionObserver at 50% threshold) and pauses off screen.
 * - Under prefers-reduced-motion: does not autoplay, shows native controls.
 * - Graceful fallback: onError handler cleanly hides the whole section if files are missing.
 * - Accessible caption: "Recorded demo · simulated data" with descriptive aria-label.
 */
export default function DemoVideo() {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch(() => {
              // Browser autoplay policy might require manual user interaction
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0, 0.5] }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [hasError, prefersReducedMotion]);

  if (hasError) {
    return null;
  }

  return (
    <section 
      data-allowlist="demo-video-section"
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--ink)',
        borderRadius: 'var(--radius)',
        padding: '2.5rem 2rem'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
          SEE IT WORKING
        </div>
        <h2 
          style={{ 
            fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', 
            fontWeight: '700', 
            color: 'var(--ink)',
            lineHeight: '1.1'
          }}
        >
          Two minutes through the complete workflow
        </h2>
      </div>

      {/* Browser Frame Container */}
      <div style={{ 
        position: 'relative', 
        borderRadius: 'var(--radius)', 
        overflow: 'hidden', 
        border: '1px solid var(--ink)',
        maxWidth: '960px',
        margin: '0 auto',
        background: 'var(--bg-accent)'
      }}>
        {/* Browser Top Window Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--ink)'
        }}>
          {/* Window control buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid var(--ink)', background: 'transparent', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid var(--ink)', background: 'transparent', display: 'inline-block' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid var(--ink)', background: 'transparent', display: 'inline-block' }} />
          </div>
          {/* Subtle mock URL address pill */}
          <div style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: '3px 18px',
            borderRadius: '9999px',
            border: '1px solid var(--ink)',
            fontSize: '0.72rem',
            fontWeight: '600',
            color: 'var(--ink)',
            letterSpacing: '0.02em',
            opacity: 0.8
          }}>
            ai-dropout-intervention.edu / workflow-demo
          </div>
        </div>

        <video
          ref={videoRef}
          poster="/demo/poster.jpg"
          controls={prefersReducedMotion}
          playsInline
          loop={!prefersReducedMotion}
          preload="metadata"
          muted
          onError={() => setHasError(true)}
          aria-label="Recorded demonstration of AI student dropout prediction simulator and academic counseling intervention workflow"
          style={{ width: '100%', display: 'block' }}
        >
          <source src="/demo/demo.webm" type="video/webm" onError={() => setHasError(true)} />
          <source src="/demo/demo.mp4" type="video/mp4" onError={() => setHasError(true)} />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Caption */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '1rem', 
        fontSize: '0.8rem', 
        color: 'var(--ink)', 
        opacity: 0.75,
        fontWeight: '600'
      }}>
        Recorded demo · simulated data
      </div>
    </section>
  );
}
