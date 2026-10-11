import React, { useState, useRef, useEffect } from 'react';

/**
 * DemoVideo Component
 * Editorial demo video section:
 * - Plays inline with IntersectionObserver (autoplays when 50% visible, pauses when out).
 * - Fallback: hides entire section gracefully if video files are missing or encounter error.
 * - Adheres strictly to editorial design tokens.
 */
export default function DemoVideo() {
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            video.play().catch(() => {
              // Browser autoplay policy might require manual interaction
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
  }, [hasError]);

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
          data-speed="0.15"
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
          data-speed="0.08"
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

      <div style={{ 
        position: 'relative', 
        borderRadius: 'var(--radius)', 
        overflow: 'hidden', 
        border: '1px solid var(--ink)',
        maxWidth: '960px',
        margin: '0 auto',
        background: 'var(--bg-accent)'
      }}>
        <video
          ref={videoRef}
          poster="/demo/poster.jpg"
          controls
          playsInline
          preload="none"
          muted
          onError={() => setHasError(true)}
          style={{ width: '100%', display: 'block', borderRadius: 'inherit' }}
        >
          <source src="/demo/demo.webm" type="video/webm" onError={() => setHasError(true)} />
          <source src="/demo/demo.mp4" type="video/mp4" onError={() => setHasError(true)} />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
