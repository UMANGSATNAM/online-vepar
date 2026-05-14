// OMNI Commerce — Global CSS Token Generator
// Converts a NicheTheme's ColorSystem + TypographySystem → CSS custom properties

import type { NicheTheme } from './types'

/**
 * Generate CSS custom properties from a theme's color + typography system.
 * Injected as a <style> tag into the <head> when a theme is active.
 */
export function generateThemeCSS(theme: NicheTheme): string {
  const { colorSystem: c, typography: t, motionSystem: m } = theme

  return `
:root {
  /* ── Brand Colors ───────────────────────────────────── */
  --brand-primary:       ${c.primary};
  --brand-primary-fg:    ${c.primaryFg};
  --brand-secondary:     ${c.secondary};
  --brand-secondary-fg:  ${c.secondaryFg};
  --brand-accent:        ${c.accent};

  /* ── Surfaces ───────────────────────────────────────── */
  --surface-bg:          ${c.background};
  --surface-base:        ${c.surface};
  --surface-raised:      ${c.surfaceRaised};

  /* ── Borders ────────────────────────────────────────── */
  --border-default:      ${c.border};
  --border-strong:       ${c.borderStrong};

  /* ── Text ───────────────────────────────────────────── */
  --text-primary:        ${c.text};
  --text-muted:          ${c.textMuted};
  --text-inverse:        ${c.textInverse};

  /* ── Status ─────────────────────────────────────────── */
  --status-success:      ${c.success};
  --status-warning:      ${c.warning};
  --status-error:        ${c.error};

  /* ── Typography ─────────────────────────────────────── */
  --font-display:        ${t.displayFont};
  --font-body:           ${t.bodyFont};
  --font-mono:           ${t.monoFont ?? "'JetBrains Mono', 'Fira Code', monospace"};

  /* ── Type Scale (Perfect Fourth 1.333) ──────────────── */
  --text-xs:   0.694rem;
  --text-sm:   0.833rem;
  --text-base: 1rem;
  --text-lg:   1.2rem;
  --text-xl:   1.44rem;
  --text-2xl:  1.728rem;
  --text-3xl:  2.074rem;
  --text-4xl:  2.488rem;
  --text-5xl:  2.986rem;
  --text-6xl:  3.583rem;
  --text-7xl:  4.3rem;
  --text-8xl:  5.16rem;

  /* ── Spacing (8-point grid) ─────────────────────────── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;

  /* ── Radius ──────────────────────────────────────────── */
  --radius-none: 0px;
  --radius-sm:   2px;
  --radius-md:   6px;
  --radius-lg:   12px;
  --radius-xl:   20px;
  --radius-full: 9999px;

  /* ── Motion ──────────────────────────────────────────── */
  --ease-default: ${m.defaultEasing};
  --ease-spring:  ${m.springEasing};
  --ease-sharp:   ${m.sharpEasing};
  --dur-fast:     ${m.fastDuration};
  --dur-base:     ${m.baseDuration};
  --dur-slow:     ${m.slowDuration};

  /* ── Shadows ─────────────────────────────────────────── */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.12);
  --shadow-xl:  0 20px 60px rgba(0,0,0,0.15);
  --shadow-brand: 0 8px 32px ${c.primary}33;
}

/* ── Base Styles ───────────────────────────────────────── */
body {
  background-color: var(--surface-bg);
  color: var(--text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

/* ── Reduced Motion ────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`.trim()
}

/**
 * Inject theme CSS into the DOM (client-side only).
 * Call this when a theme is applied in the editor or storefront.
 */
export function injectThemeCSS(css: string, themeId: string): void {
  if (typeof document === 'undefined') return
  const id = `omni-theme-${themeId}`
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = css
}
