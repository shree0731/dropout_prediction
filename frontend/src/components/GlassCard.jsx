import React, { useRef, useEffect } from 'react';

/**
 * GlassCard Component
 * Reusable glassmorphic wrapper component featuring:
 * 1. Per-card internal light sheen tracking the cursor position via CSS custom properties (--cx, --cy)
 * 2. Subtle 3D perspective tilt on hover (max ~10deg rotation, scale 1.03)
 * 3. Graceful reset on mouse leave
 * 4. Automatic respect for prefers-reduced-motion accessibility
 */
export default function GlassCard({ children, className = '', style = {}, ...props }) {
  const cardRef = useRef(null);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    isReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleMouseMove = (e) => {
    if (isReducedMotion.current) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set local relative coordinates for internal sheen
    card.style.setProperty('--cx', `${x}px`);
    card.style.setProperty('--cy', `${y}px`);

    // Calculate 3D tilt
    const relX = x - rect.width / 2;
    const relY = y - rect.height / 2;
    const rotateX = (-relY / rect.height) * 10;
    const rotateY = (relX / rect.width) * 10;

    card.style.transform = `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (isReducedMotion.current) return;
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) scale(1)';
  };

  return (
    <div
      ref={cardRef}
      className={`glass-card-container ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Local internal sheen highlight (lit from within) */}
      <div className="card-sheen" aria-hidden="true" />
      {/* Content wrapper with isolation so clicks & links work unobstructed */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}
