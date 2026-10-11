import { useEffect } from 'react';

/**
 * ScrollParallax Component
 * Applies smooth, jitter-free scroll-driven vertical translation (translate3d)
 * to elements marked with [data-speed] outside the hero section.
 * - Eyebrows: data-speed="0.15"
 * - Section headings: data-speed="0.08"
 * - Large cards: data-speed="0.04" - 0.06
 * Offsets are computed relative to viewport center and clamped to [-28px, 28px].
 * Uses requestAnimationFrame debounce and respects prefers-reduced-motion.
 */
export default function ScrollParallax() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll('[data-speed]');
    if (!elements.length) return;

    let ticking = false;

    // Cache initial vertical centers relative to document
    let items = [];
    const measure = () => {
      items = Array.from(elements).map((el) => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0.05;
        // Temporarily reset transform to measure true document position
        const prevTransform = el.style.transform;
        el.style.transform = '';
        const rect = el.getBoundingClientRect();
        const docTop = rect.top + (window.scrollY || window.pageYOffset || 0);
        el.style.transform = prevTransform;
        return {
          el,
          speed,
          initialCenter: docTop + rect.height / 2
        };
      });
    };

    measure();

    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 800;
      const viewportCenter = scrollY + vh / 2;

      for (const item of items) {
        // Distance from current viewport center to element's natural center
        const offset = item.initialCenter - viewportCenter;
        const rawY = -offset * item.speed;
        const clampedY = Math.max(-28, Math.min(28, rawY));
        item.el.style.transform = `translate3d(0, ${clampedY.toFixed(1)}px, 0)`;
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    const handleResize = () => {
      measure();
      update();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      for (const item of items) {
        item.el.style.transform = '';
      }
    };
  }, []);

  return null;
}
