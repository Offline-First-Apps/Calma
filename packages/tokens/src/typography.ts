/**
 * Calma typography — extracted from the delivered designs.
 *
 * TWO TYPEFACES, AND THE SPLIT IS THE WHOLE IDEA:
 *
 *   Newsreader (serif) — sentences a person is meant to FEEL.
 *     "Breathe into it." · "Then this one isn't yours to carry."
 *     · "You're still here. That's enough."
 *
 *   Figtree (sans)     — everything they only need to READ.
 *     Buttons, labels, hints, settings rows, counts, timestamps.
 *
 * Getting this backwards is the fastest way to make the app feel wrong:
 * a serif "Save" button reads precious, and a sans "Breathe into it."
 * reads like a system notification.
 *
 * IBM Plex Mono appears in the design files. It is design-doc annotation
 * only and MUST NOT ship.
 */

export const fontFamily = {
  /** Emotional copy. Weights 400, 500. */
  serif: 'Newsreader',
  /** Functional copy. Weights 400, 500, 600. */
  sans: 'Figtree',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const;

/**
 * Type scale. `family` is prescriptive — it encodes the feel/read split.
 * Sizes are the values actually used across the 58 delivered screens.
 */
export const type = {
  /** Splash wordmark, panic ending. The largest thing in the app. */
  display: { size: 38, lineHeight: 45, family: 'serif', weight: '400', letterSpacing: -0.4 },
  /** Screen-opening emotional lines. "Breathe into it." */
  title: { size: 36, lineHeight: 43, family: 'serif', weight: '400', letterSpacing: -0.36 },
  /** Question headings. "What brings you here?" */
  heading: { size: 32, lineHeight: 39, family: 'serif', weight: '400', letterSpacing: -0.32 },
  /** Smaller emotional line, used where a heading must share space. */
  headingSm: { size: 27, lineHeight: 34, family: 'serif', weight: '400', letterSpacing: -0.27 },

  /** DOMINANT BODY SIZE — the most used value in the whole design set. */
  body: { size: 21, lineHeight: 31, family: 'sans', weight: '400', letterSpacing: 0 },
  bodyEmphasis: { size: 21, lineHeight: 31, family: 'sans', weight: '500', letterSpacing: 0 },
  /** Buttons and control labels. */
  control: { size: 18, lineHeight: 24, family: 'sans', weight: '500', letterSpacing: 0 },
  /** Supporting copy, hints, secondary rows. */
  callout: { size: 17, lineHeight: 26, family: 'sans', weight: '400', letterSpacing: 0 },
  /** Chip and pill labels, status bar. */
  label: { size: 15, lineHeight: 20, family: 'sans', weight: '500', letterSpacing: 0 },
  /** Timestamps, meta, fine print. */
  caption: { size: 13, lineHeight: 18, family: 'sans', weight: '500', letterSpacing: 0.13 },
  captionSm: { size: 12, lineHeight: 16, family: 'sans', weight: '500', letterSpacing: 0.12 },
} as const;

export type TypeVariant = keyof typeof type;

/**
 * RULES (systems/03-design-system.md — behaviour, not appearance, so these
 * survive any visual revision):
 *   - Never all-caps. It reads as shouting.
 *   - Never italic for emphasis — use bodyEmphasis.
 *   - Every numeral scales with the system font setting. No exceptions.
 *     Supporting scaling everywhere EXCEPT the numbers is worse than not
 *     supporting it. (plans/19-review-findings.md R2)
 *   - Layouts must tolerate ~40% longer strings. Nothing truncates on
 *     user content, ever.
 */
