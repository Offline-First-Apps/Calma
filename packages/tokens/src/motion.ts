/**
 * Motion. Nothing in Calma bounces, overshoots, or moves quickly.
 *
 * The orb's 11s cycle is the app's metronome — every other duration should
 * feel like it belongs to the same body.
 */

export const duration = {
  press: 120,
  transition: 280,
  sheet: 320,
  /** Worry text dissolving upward on capture. */
  dissolve: 900,
  /** Worry scattering on release. The most beautiful moment in the app. */
  release: 1400,
} as const;

export const easing = {
  standard: [0.33, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
  /** Matches how a breath actually accelerates and decelerates. */
  breath: [0.37, 0, 0.63, 1],
} as const;

/**
 * The ambient orb loop, from the designs:
 *   @keyframes calmaBreathe { 0%,100% { scale(0.93) } 46% { scale(1.07) } }
 *   @keyframes calmaGlow    { 0%,100% { opacity .72 } 46% { opacity 1 } }
 *   animation: 11s ease-in-out infinite
 *
 * 46% rather than 50% makes the inhale marginally shorter than the exhale,
 * which is what a settled breath actually does.
 */
export const ambientOrb = {
  durationMs: 11000,
  scaleFrom: 0.93,
  scaleTo: 1.07,
  glowFrom: 0.72,
  glowTo: 1,
  peakAt: 0.46,
} as const;

/** Orb scale range while actively guiding a breath (systems/03-design-system.md). */
export const guidedOrb = { exhaled: 0.62, inhaled: 1.0, opacityExhaled: 0.75, opacityInhaled: 1 } as const;

/**
 * Under Reduce Motion: the orb shifts opacity and colour instead of scaling,
 * dissolves become fades, transitions become cross-fades. Breath TIMING is
 * unchanged — the guidance must remain fully usable.
 */
export const reducedMotion = { transition: 200, dissolve: 400, release: 500 } as const;
