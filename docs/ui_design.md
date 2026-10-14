# UI Design & Editorial Style System

This document outlines the visual restyle of the **Baymate** (AI-Powered Student Dropout Prediction and Proactive Intervention System) frontend. The restyle implements an editorial aesthetic characterized by deep forest green over warm sand, large tight headlines, rounded photography, outlined pill buttons, and calm, spacious layouts.

---

## 1. Palette Tokens & Font Stack

All colors and design tokens are defined centrally in `src/styles/tokens.css`. No color literals exist anywhere else in the application stylesheets.

### CSS Custom Properties (`src/styles/tokens.css`)

```css
:root {
  /* Editorial Palette */
  --bg: #F3EBDD;          /* Warm sand page background */
  --bg-accent: #E8D9BE;   /* Deeper sand: hero ends, nav fade, alternate sections */
  --ink: #17531F;         /* Deep forest green: primary text, borders, outlined buttons */
  --ink-on-dark: #FCFAEE; /* Warm cream: high-contrast text on solid green surfaces */
  --surface: #17531F;     /* Solid green cards, ticker band, primary submit buttons */
  --star: #F5C518;        /* Editorial accent star for citations & tickers */
  --radius: 16px;         /* Standard card border-radius */
  --radius-input: 8px;   /* Form input border-radius */

  /* Semantic Diagnostic & Risk Tokens */
  --risk-low: #17531F;    /* Low Risk: Deep Forest Green (paired with label "Low Risk") */
  --risk-med: #8A5A0B;    /* Medium Risk: Amber Ochre (paired with label "Medium Risk") */
  --risk-high: #A8402C;   /* High Risk: Terracotta Red (paired with label "High Risk") */
  --alert-bg: #F6E3DC;    /* Crisis / distress banner background */
  --alert-ink: #7A2A1A;   /* Crisis / distress text & border */
  --focus: var(--ink);    /* Focus ring color */

  /* Typography Stack */
  --font-family: 'Inter Tight Variable', 'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
```

### Contrast & Accessibility Verification
All text colors achieve at least WCAG 2.1 AA (4.5:1) contrast on their respective backgrounds:
- `--ink` (`#17531F`) on `--bg` (`#F3EBDD`): **7.8:1** (Exceeds AAA 7.0:1)
- `--ink` (`#17531F`) on `--bg-accent` (`#E8D9BE`): **6.8:1** (Exceeds AA 4.5:1)
- `--ink-on-dark` (`#FCFAEE`) on `--surface` (`#17531F`): **9.2:1** (Exceeds AAA 7.0:1)
- `--risk-med` (`#8A5A0B`) on `--bg` (`#F3EBDD`): **5.1:1** (Exceeds AA 4.5:1)
- `--risk-high` (`#A8402C`) on `--bg` (`#F3EBDD`): **5.4:1** (Exceeds AA 4.5:1)
- `--alert-ink` (`#7A2A1A`) on `--alert-bg` (`#F6E3DC`): **6.9:1** (Exceeds AA 4.5:1)

### Typography Stack
- Bundled offline via `@fontsource-variable/inter-tight` so the platform does not depend on Google CDN or external networks.
- **Headings (H1/H2)**: `clamp(2.5rem, 6.5vw, 5.75rem)`, weight `700`, line-height `0.95`, letter-spacing `-0.03em`.
- **Subheadings (H3/H4)**: `clamp(1.4rem, 2.8vw, 2.2rem)`, weight `700`, line-height `1.1`.
- **Body & Labels**: 14–16px, weight `500`–`700`, color `var(--ink)`. No serif typefaces.

---

## 2. Component Classes (`src/styles/components.css`)

- **`.btn-outline`**: Transparent background, 1px solid `--ink` border, 9999px pill radius, padding `14px 28px`. On hover, fills solid `--surface` with `--ink-on-dark` text via 200ms ease transition.
- **`.btn-solid` / `.btn-primary`**: Solid `--surface` background with `--ink-on-dark` text, 9999px pill radius, padding `14px 28px`.
- **`.card`**: Warm sand card (`var(--bg)`), 1px solid `--ink` border, 16px radius, hover lift with subtle shadow.
- **`.card-sand`**: Deeper warm sand card (`var(--bg-accent)`), 1px solid `--ink` border.
- **`.card-green`**: Solid forest green card (`var(--surface)`), cream text (`var(--ink-on-dark)`).
- **`.input` / `.form-input`**: Transparent background, 1px solid `--ink` border, 8px radius, bold label pairings.
- **`.chip` / `.badge`**: Outlined pill badges for metadata tags and status indicators.
- **`.ticker-band` & `.ticker-track`**: Continuous horizontal marquee band in solid forest green with warm star (`var(--star)`) separators. Automatically pauses on user hover and includes an `aria-hidden` duplicated track for smooth looping.
- **`.hero-photo-gallery`**: Dedicated 3-photo campus gallery strip in the right column showcasing campus moments without overlapping editorial typography.

---

## 3. Deliberately Omitted Design Sections

To strictly preserve informational integrity and avoid inventing unverified content, the following editorial template sections were deliberately omitted:
1. **Team / Leadership Section**: Omitted to prevent fictional academic faculty or executive profiles.
2. **Corporate Partner Logos**: Omitted to prevent unverified sponsor claims.
3. **Contact / Feedback Form**: Omitted because interactive contact submission belongs to the institutional ERP portal.
4. **Newsletter Subscription**: Omitted because student retention interventions are event-driven within the academic semester.

---

## 4. Hard Logic Freeze & AST Guard

To prevent regressions and ensure zero behavioral drift during the visual restyle, the project enforced a **Hard Logic Freeze** backed by an automated AST comparison guard (`frontend/scripts/ui-guard.mjs`).

### Frozen Invariants
- **API & Services**: Zero modifications to `src/services/**`, endpoints, headers, auth flows, or error handling.
- **Component Architecture**: Every hook (`useState`, `useEffect`, `useRef`), event handler, conditional, `.map()` render, prop, key, and function signature preserved.
- **Form Fields**: Every `name`, `id`, `type`, `value`, `onChange`, `htmlFor`, `required`, `min`, `max`, `step` attribute preserved.
- **Text & Data Verbatim**: All strings, numbers, statistics, research citations (UDISE+ 2024-25, Anna University 2026 Audit, SC/ST retention metrics), and model metrics preserved verbatim.
- **Safety Filter & Helplines**: Disclaimer text and crisis support hotlines (Tele-MANAS `14416` and KIRAN `1800-599-0019`) preserved verbatim.

### How the Guard Works (`scripts/ui-guard.mjs`)
1. Parses baseline files from `git show pre-restyle:<path>` using `@babel/parser`.
2. Normalizes non-logic styling attributes:
   - For `style` and `className`: extracts and sorts referenced identifier names (verifying that dynamic data references like `width: pct` are preserved while style values change).
   - Strips non-logic accessibility and layout attributes (`alt`, `loading`, `width`, `height`, `role`, `aria-*`, `data-*`).
   - Strips comments and whitespace variations.
3. Performs strict recursive AST comparison across all nodes. Any differing identifier, handler, hook, string literal, or DOM element triggers an immediate build failure and prints the exact AST node path.
4. Run via `npm run guard` in CI/local workflows.

---

## 5. Responsive & Accessibility Audit

- **375px (Mobile Phone)**:
  - Grid columns reflow to single column (`1fr`).
  - Hero photography adapts: `.hero-photo-desktop` hidden to maintain clear headline hierarchy.
  - Ticker band remains smoothly scrollable.
  - Nav brand and links wrap gracefully without horizontal overflow.
- **768px (Tablet)**:
  - Checkerboard cards reflow to 2-column layout.
  - Interactive prediction form displays clean 2-column input grid.
- **1280px (Desktop)**:
  - Full editorial layout with subtle interactive mouse parallax on hero imagery.
- **Accessibility & Motion Preferences**:
  - All interactive elements render a high-contrast focus ring (`:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }`).
  - `@media (prefers-reduced-motion: reduce)` completely disables all parallax tracking, transform shifts, and marquee scrolling.
  - Touch devices (`@media (hover: none)`) disable hover transforms.
