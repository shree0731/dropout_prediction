import { useEffect } from 'react';

/**
 * HeroParallax Component
 * Unified cursor-follow and scroll parallax for the hero photo ring:
 * - Computes normalized pointer offset [-1, 1] relative to hero center.
 * - Targets (normX * 60 * depth)px and (normY * 40 * depth)px for mouse follow.
 * - Smooths movement with requestAnimationFrame lerp (factor 0.08).
 * - Dynamically clamps targetX so photo inner edge stays >= 16px away from text column.
 * - Staggers vertical scroll speeds across photos for rich, multi-plane 3D depth:
 *   Photos drift in alternating positive and negative directions (range up to ±75px).
 * - Writes CSS variables --px, --py, --sy and updates element translate.
 * - Respects prefers-reduced-motion: reduce and (hover: none) touch environments.
 * - Pauses RAF animation when hero scrolls out of view via IntersectionObserver.
 */
export default function HeroParallax() {
  useEffect(() => {
    // Accessibility check: disable parallax entirely when reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Check if device lacks hover capability (touch devices)
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    const hero = document.querySelector('[data-parallax-hero]');
    if (!hero) return;

    const photos = hero.querySelectorAll('[data-hero-photo]');
    if (!photos.length) return;

    let targetNormX = 0;
    let targetNormY = 0;
    let isVisible = true;
    let rafId = null;

    const photoStates = Array.from(photos).map((el) => ({
      el,
      depth: parseFloat(el.getAttribute('data-depth')) || 0.7,
      currentX: 0,
      currentY: 0
    }));

    // Find the text column boundary for clamping
    const getTextRect = () => {
      const textEl = hero.querySelector('.hero-col-text') || hero.querySelector('h1')?.parentElement;
      return textEl ? textEl.getBoundingClientRect() : null;
    };

    const handleMouseMove = (e) => {
      if (isTouchDevice) return; // Disable cursor tracking on touch devices
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
      if (!isVisible) {
        rafId = null;
        return;
      }

      const textRect = getTextRect();

      for (const item of photoStates) {
        let targetX = isTouchDevice ? 0 : targetNormX * 60 * item.depth;
        let targetY = isTouchDevice ? 0 : targetNormY * 40 * item.depth;

        // Dynamic clamp: ensure photo inner edge never comes within 16px of text column
        if (textRect) {
          const photoRect = item.el.getBoundingClientRect();
          // Calculate rest rect without current translation
          const restLeft = photoRect.left - item.currentX;
          const restRight = photoRect.right - item.currentX;

          // If photo is to the left of the text column
          if (restRight <= textRect.left) {
            const maxAllowedX = textRect.left - 16 - restRight;
            targetX = Math.min(targetX, Math.max(0, maxAllowedX));
          }
          // If photo is to the right of the text column
          else if (restLeft >= textRect.right) {
            const minAllowedX = textRect.right + 16 - restLeft;
            targetX = Math.max(targetX, Math.min(0, minAllowedX));
          }
        }

        // Smooth lerp (factor 0.08)
        item.currentX += (targetX - item.currentX) * 0.08;
        item.currentY += (targetY - item.currentY) * 0.08;

        // Apply CSS custom properties and translation
        const px = item.currentX.toFixed(2);
        const py = item.currentY.toFixed(2);

        item.el.style.setProperty('--px', px);
        item.el.style.setProperty('--py', py);
        item.el.style.setProperty('--sy', '0');
        item.el.style.translate = `${px}px ${py}px`;
      }

      rafId = requestAnimationFrame(animate);
    };

    // IntersectionObserver to pause RAF loop when hero is out of view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry && entry.isIntersecting;
        if (isVisible && !rafId) {
          rafId = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );
    observer.observe(hero);

    const handleScroll = () => {
      if (isVisible && !rafId) {
        rafId = requestAnimationFrame(animate);
      }
    };

    if (!isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      hero.addEventListener('mouseleave', handleMouseLeave);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    rafId = requestAnimationFrame(animate);

    return () => {
      if (!isTouchDevice) {
        window.removeEventListener('mousemove', handleMouseMove);
        hero.removeEventListener('mouseleave', handleMouseLeave);
      }
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      for (const item of photoStates) {
        item.el.style.setProperty('--px', '0');
        item.el.style.setProperty('--py', '0');
        item.el.style.setProperty('--sy', '0');
        item.el.style.translate = '0px 0px';
      }
    };
  }, []);

  return null;
}
