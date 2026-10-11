import { useEffect } from 'react';

/**
 * HeroParallax Component
 * Tracks pointer coordinates relative to hero center, smoothly lerping
 * photo positions ([data-depth]) toward pointer side using CSS translate.
 * Respects prefers-reduced-motion and touch device hover:none settings.
 */
export default function HeroParallax() {
  useEffect(() => {
    // Respect user accessibility and mobile environments
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    const hero = document.querySelector('[data-parallax-hero]');
    if (!hero) return;

    const photos = hero.querySelectorAll('[data-depth]');
    if (!photos.length) return;

    let targetNormX = 0;
    let targetNormY = 0;
    const photoStates = Array.from(photos).map(el => ({
      el,
      depth: parseFloat(el.getAttribute('data-depth')) || 0.7,
      currentX: 0,
      currentY: 0
    }));

    let rafId = null;

    const handleMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetNormX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2 || 1)));
      targetNormY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2 || 1)));
    };

    const handleMouseLeave = () => {
      targetNormX = 0;
      targetNormY = 0;
    };

    const animate = () => {
      for (const item of photoStates) {
        const targetX = targetNormX * 60 * item.depth;
        const targetY = targetNormY * 40 * item.depth;
        item.currentX += (targetX - item.currentX) * 0.07;
        item.currentY += (targetY - item.currentY) * 0.07;
        item.el.style.translate = `${item.currentX.toFixed(2)}px ${item.currentY.toFixed(2)}px`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    hero.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
      for (const item of photoStates) {
        item.el.style.translate = '0px 0px';
      }
    };
  }, []);

  return null;
}
