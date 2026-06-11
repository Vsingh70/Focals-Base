/**
 * Marketing token map — the prototype's `LT` object, remapped onto the
 * app's CSS variables (locked to the dark palette by .lp-root).
 *
 * The prototype concatenates hex alpha onto literal hex tokens (e.g.
 * `${LT.accent}22`). CSS variables can't be string-concatenated, so the
 * resolved rgba literals live here, named after the prototype's hex
 * alpha suffix. Accent is the locked marketing sand (#e8e0d0).
 */
export const LT = {
  maxW: 1180,

  bg: 'var(--color-bg)',
  bg2: 'var(--color-bg-secondary)',
  bg3: 'var(--color-bg-tertiary)',
  border: 'var(--color-border)',
  border2: 'var(--color-border-secondary)',
  text: 'var(--color-text-primary)',
  text2: 'var(--color-text-secondary)',
  text3: 'var(--color-text-tertiary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',

  serif: 'var(--font-display)',
  ui: 'var(--font-sans)',

  // Alpha blends of the sand accent (#e8e0d0).
  accentA08: 'rgba(232, 224, 208, 0.08)',
  accentA10: 'rgba(232, 224, 208, 0.10)',
  accentA14: 'rgba(232, 224, 208, 0.08)', // hex alpha 14 ≈ 8%
  accentA1c: 'rgba(232, 224, 208, 0.11)', // hex alpha 1c ≈ 11%
  accentA22: 'rgba(232, 224, 208, 0.13)', // hex alpha 22 ≈ 13%
  accentA33: 'rgba(232, 224, 208, 0.20)', // hex alpha 33 = 20%

  // Alpha blends of success (#4caf7d) / warning (#e8a020).
  successA12: 'rgba(76, 175, 125, 0.12)',
  successA44: 'rgba(76, 175, 125, 0.27)', // hex alpha 44 ≈ 27%
  warningA12: 'rgba(232, 160, 32, 0.12)',
} as const;
