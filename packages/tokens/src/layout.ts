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
  /** Larger cards and sheets. */
  xl: 24,
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
  /** Standard list/option card. */
  card: 64,
  /** Option card with a description line. */
  cardTall: 78,
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
