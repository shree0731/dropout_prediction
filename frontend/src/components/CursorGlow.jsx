import React, { useEffect, useRef } from 'react';

/**
 * CursorGlow Component
 * Renders a large (480px), heavily blurred (35px), soft white radial-gradient orb
 * that trails the cursor with smooth lerp interpolation (factor ~0.12) via requestAnimationFrame.
 * Automatically cleans up listeners and animation frames on unmount.
 * Respects prefers-reduced-motion OS accessibility settings.
 */
export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    // Check if user has requested reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return; // Skip animation loop entirely
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let rafId = null;

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animateGlow = () => {
      // Eased/lagged motion with ~0.12 lerp factor
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }

      rafId = requestAnimationFrame(animateGlow);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(animateGlow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return <div ref={glowRef} className="cursor-glow" aria-hidden="true" />;
}
