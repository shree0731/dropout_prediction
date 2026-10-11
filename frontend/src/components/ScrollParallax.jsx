import { useEffect } from 'react';

/**
 * ScrollParallax Component
 * High-performance, multi-layer parallax scrolling engine:
 * - Calculates viewport intersection for every [data-speed] element across the document.
 * - Applies smooth, proportional vertical parallax translations using translate3d.
 * - Supports positive and negative speeds for multi-plane depth illusions:
 *   - Eyebrows: data-speed="0.22"
 *   - Headings: data-speed="0.14"
 *   - Staggered cards: data-speed="0.12" / "-0.08" / "0.10"
 * - Clamps translations smoothly to [-60px, 60px] to preserve layout harmony.
 * - Uses passive scroll listeners and requestAnimationFrame for 60/120fps performance.
 * - Automatically disabled when prefers-reduced-motion is active.
 */
export default function ScrollParallax() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const elements = document.querySelectorAll('[data-speed]');
    if (!elements.length) return;

    let ticking = false;

    // Measure document-relative natural positions
    const getItems = () => {
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      return Array.from(elements).map((el) => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0.08;
        // Strip transform momentarily to measure true document position
        const prevTransform = el.style.transform;
        el.style.transform = '';
        const rect = el.getBoundingClientRect();
        el.style.transform = prevTransform;

        const docTop = rect.top + currentScroll;
        return {
          el,
          speed,
          centerDoc: docTop + rect.height / 2
        };
      });
    };

    let items = getItems();

    const update = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = window.innerHeight || 800;
      const viewportCenter = scrollY + vh / 2;

      for (const item of items) {
        // Distance from element's natural center to current viewport center
        const offset = item.centerDoc - viewportCenter;
        // Proportional parallax displacement
        const rawY = -offset * item.speed;
        // Clamp to [-60px, 60px] to provide bold, clear depth while respecting layout bounds
        const clampedY = Math.max(-60, Math.min(60, rawY));
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
      items = getItems();
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
