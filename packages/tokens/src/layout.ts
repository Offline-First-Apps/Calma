/** Spacing, radii, control sizing, and elevation. Extracted from the designs. */

/** 4pt base. */
export const space = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28,
  8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80,
} as const;

/** Screen content insets, from the delivered screens: `padding: 76px 32px 40px`. */
export const screenInset = { top: 76, horizontal: 32, bottom: 40 } as const;

export const radius = {
  sm: 8,
  md: 14,
  /** Cards, wells, option rows. The most used component radius. */
  lg: 20,
  /** Multi-select option cards (b4-b6). Two points softer than `lg`. */
  option: 22,
  /** Larger cards and sheets. */
  xl: 24,
  /**
   * The worry card (f1, f2, f3, f6, f7).
   *
   * Between `xl` and `2xl` and used by nothing else. Worth its own name
   * rather than rounding to 28, because the capture field is the component a
   * person touches most in this feature and it is the one card in the app
   * that is lighter than its ground — the radius is doing visible work.
   */
  note: 26,
  '2xl': 28,
  '3xl': 32,
  /** Pills and primary buttons — always exactly half the control height. */
  full: 9999,
} as const;

/**
 * Control heights. `pill` (46) is the single most repeated dimension in the
 * design set — chips, the crisis exit, language rows, selectable options.
 */
export const control = {
  /** Chips, pills, the crisis exit, small selectable rows. */
  pill: 46,
  /** Primary and secondary buttons. */
  button: 62,
  /**
   * Buttons on the immersive ground (d4, d5). Two points taller than
   * `button`, which is not a rounding error in the designs: these are the
   * only buttons ever tapped mid-session, sometimes by a shaking hand.
   */
  buttonImmersive: 64,
  /** Standard list row — the language picker's rows are exactly this (b2). */
  card: 64,
  /**
   * Multi-select option card (b4-b6). A FLOOR, never a height: the designer's
   * note is explicit that these grow with their text so a 40% longer German
   * string wraps instead of truncating.
   */
  optionCard: 76,
  /** Option card with a description line. */
  cardTall: 78,
  /**
   * The worry flow's two extra heights.
   *
   * `compact` (54) is "Open it now" and "Set it down" — buttons that sit
   * beside content rather than under it, and are not the screen's one big
   * action. `fork` (66) is f5's pair, the tallest buttons in the app: both
   * answers to "is this something you can do something about?" are equally
   * weighted and equally easy to hit, because which one is right depends on
   * the worry and the app does not know.
   */
  compact: 54,
  fork: 66,
  /** Minimum tappable target, anywhere. */
  minTarget: 48,
  /** The panic button. Sized to be hittable by shaking hands. */
  panicFab: 72,
} as const;

export const elevation = {
  card: {
    light: '0 2px 16px rgba(42,54,66,0.09)',
    dark: '0 2px 16px rgba(0,0,0,0.35)',
  },
  sheet: {
    light: '0 -8px 40px rgba(42,54,66,0.14)',
    dark: '0 -8px 40px rgba(0,0,0,0.5)',
  },
} as const;

/** Hairline borders in the designs are 1px at ~25% of the text colour. */
export const hairline = {
  light: 'rgba(42,54,66,0.25)',
  dark: 'rgba(234,226,215,0.3)',
} as const;
