import { useEffect } from 'react';

/**
 * HeroParallax Component
 * Unified cursor-follow and scroll parallax for the hero photo ring:
 * - Computes normalized pointer offset [-1, 1] relative to hero center.
 * - Targets (normX * 60 * depth)px and (normY * 40 * depth)px.
 * - Smooths movement with requestAnimationFrame lerp (factor 0.07).
 * - Dynamically clamps targetX so photo inner edge stays >= 16px away from text column.
 * - Computes scroll parallax offset --sy = clamp(-48px, -scrollY * depth * 0.18, 48px).
 * - Writes CSS variables --px, --py, --sy and updates translate.
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

    // Initialize item states
    const photoStates = Array.from(photos).map((el) => ({
      el,
      depth: parseFloat(el.getAttribute('data-depth')) || 0.7,
      currentX: 0,
      currentY: 0,
      currentScrollY: 0
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

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const textRect = getTextRect();

      for (const item of photoStates) {
        let targetX = isTouchDevice ? 0 : targetNormX * 60 * item.depth;
        let targetY = isTouchDevice ? 0 : targetNormY * 40 * item.depth;
        const targetScrollY = Math.max(-48, Math.min(48, -scrollY * item.depth * 0.18));

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

        // Smooth lerp (factor 0.07)
        item.currentX += (targetX - item.currentX) * 0.07;
        item.currentY += (targetY - item.currentY) * 0.07;
        item.currentScrollY += (targetScrollY - item.currentScrollY) * 0.07;

        // Apply CSS custom properties and translation
        const px = item.currentX.toFixed(2);
        const py = item.currentY.toFixed(2);
        const sy = item.currentScrollY.toFixed(2);

        item.el.style.setProperty('--px', px);
        item.el.style.setProperty('--py', py);
        item.el.style.setProperty('--sy', sy);
        item.el.style.translate = `${px}px ${(item.currentY + item.currentScrollY).toFixed(2)}px`;
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

    if (!isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      hero.addEventListener('mouseleave', handleMouseLeave);
    }

    rafId = requestAnimationFrame(animate);

    return () => {
      if (!isTouchDevice) {
        window.removeEventListener('mousemove', handleMouseMove);
        hero.removeEventListener('mouseleave', handleMouseLeave);
      }
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
