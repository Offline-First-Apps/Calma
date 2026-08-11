/**
 * Calma colour tokens — extracted from the delivered designs.
 *
 * SOURCE OF TRUTH: designs/extracted/*.html (58 screens, light + dark).
 * Census of every value in use: designs/TOKEN-CENSUS.md
 *
 * The designer's palette wins on colour. The behavioural rules from
 * systems/03-design-system.md still hold and are not negotiable:
 *
 *   - No pure #FFFFFF, no pure #000000.
 *   - No red. No traffic-light semantics. Nothing in Calma is an error.
 *   - Amber drops in intensity in dark mode so it never sears a
 *     dark-adapted eye at 2am.
 */

/* ------------------------------------------------------------------ *
 * LIGHT
 * ------------------------------------------------------------------ */

export const light = {
  /** Screen background. Warm off-white, never clinical. */
  bg: '#FBF7F1',
  /** Highest surface — sheets, elevated cards. */
  surfaceRaised: '#FDFCFA',
  /** Cards, wells, secondary button fill. */
  surface: '#F3EBE0',
  /** Warmer card variant used on paper-feeling screens (journal, founder note). */
  surfaceWarm: '#FDFAF3',
  /** Hairlines and card borders. */
  border: '#E4D8C8',
  /** Slightly stronger border, used on pressed/selected controls. */
  borderStrong: '#EDE2CE',

  /** Primary text. A deep slate-navy, not black. */
  text: '#2A3642',
  /** Secondary text — supporting sentences. */
  textSecondary: '#454F5A',
  /** Muted text — labels, timestamps, hints. */
  textMuted: '#5B6873',
  /** Faintest text. Use sparingly; check contrast at every size. */
  textFaint: '#7A6A5C',
} as const;

/* ------------------------------------------------------------------ *
 * DARK  — the primary mode. "The panic that hits at 2am."
 * ------------------------------------------------------------------ */

export const dark = {
  bg: '#141C26',
  /** Deeper ground used on full-screen breathing and panic sessions. */
  bgImmersive: '#101823',
  surfaceRaised: '#2C3844',
  surface: '#1D2733',
  surfaceWarm: '#1E2731',
  border: '#2B3745',
  borderStrong: '#2C3742',

  /**
   * Dark mode carries TWO text colours, and the split is deliberate:
   *   textWarm  → Newsreader serif, the sentences meant to be felt
   *   text      → Figtree sans, the copy that only needs reading
   * Using the cool grey for an emotional line makes it read clinical.
   */
  text: '#C9D2DA',
  textWarm: '#EAE2D7',
  textSecondary: '#A8B4BF',
  textMuted: '#8F98A3',
  textFaint: '#8996A2',
} as const;

/* ------------------------------------------------------------------ *
 * AMBER — the only thing in the app that glows
 * ------------------------------------------------------------------ */

export const amber = {
  light: {
    /** Primary fill, orb core. */
    base: '#E39A45',
    pressed: '#D68B36',
    soft: '#F0B96D',
    softer: '#F0BE7E',
    /** Label colour on an amber fill. */
    on: '#33230F',
  },
  dark: {
    /** Lower intensity than light mode. This is the 2am rule, in a token. */
    base: '#D19249',
    pressed: '#B87A3A',
    soft: '#DFA55B',
    softer: '#E7C089',
    on: '#221708',
  },
} as const;

/** Orb radial gradient stops, inner → outer. Identical in both themes. */
export const orb = {
  core: '#F8DFB2',
  mid: '#EFB86E',
  edge: '#E39A45',
  /** Highlight bloom, offset toward the upper-left. */
  highlight: 'rgba(255,248,235,0.92)',
  highlightFade: 'rgba(247,212,158,0.34)',
  /** Outer glow, sits behind the body at low opacity. */
  glow: 'rgba(227,154,69,0.38)',
  transparent: 'rgba(227,154,69,0)',
} as const;

/* ------------------------------------------------------------------ *
 * CLAY — worry surfaces, and the crisis exit
 * ------------------------------------------------------------------ */

export const clay = {
  light: {
    base: '#BE7458',
    text: '#8A4E36',
    fill: 'rgba(190,116,88,0.12)',
    border: 'rgba(190,116,88,0.34)',
  },
  dark: {
    base: '#D48C6A',
    text: '#E3A98C',
    fill: 'rgba(222,150,110,0.13)',
    border: 'rgba(222,150,110,0.32)',
  },
} as const;

/** Device chrome in the design mockups. Not app UI — reference only. */
export const bezel = { light: '#14110E', dark: '#0C0F14' } as const;

export const scheme = { light, dark } as const;
export type ColorScheme = keyof typeof scheme;
