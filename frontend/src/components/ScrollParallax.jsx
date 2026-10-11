import { useEffect } from 'react';

/**
 * ScrollParallax Component
 * Applies subtle scroll-driven vertical translation (translate3d) to elements
 * marked with [data-speed] outside the hero section.
 * - Eyebrows: data-speed="0.15"
 * - Section headings: data-speed="0.08"
 * - Large cards: data-speed="0.04"
 * Offsets are clamped to [-24px, 24px].
 * Uses requestAnimationFrame debounce and respects prefers-reduced-motion.
 */
export default function ScrollParallax() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll('[data-speed]');
    if (!elements.length) return;

    let ticking = false;

    const update = () => {
      const vh = window.innerHeight || 800;
      const viewportCenter = vh / 2;

      elements.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0.08;
        const rect = el.getBoundingClientRect();
        const elemCenter = rect.top + rect.height / 2;
        const offsetFromCenter = elemCenter - viewportCenter;
        const rawY = -offsetFromCenter * speed;
        const clampedY = Math.max(-24, Math.min(24, rawY));
        el.style.transform = `translate3d(0, ${clampedY.toFixed(1)}px, 0)`;
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial pass
    update();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      elements.forEach((el) => {
        el.style.transform = '';
      });
    };
  }, []);

  return null;
}
