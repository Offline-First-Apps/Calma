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
  /**
   * The breathing and panic ground. A warmer, deeper sand than `bg`.
   *
   * LIGHT MODE HAS ITS OWN IMMERSIVE COLOUR AND IT IS NOT `bg`. Session 9
   * originally assumed it did not — reasoning that a room does not need
   * dimming when the lights are already on — and shipped the ordinary
   * background instead. The designer disagreed: `#F2E7D6` is the ground on
   * five screens (d3, d4, d5, b7-first-breath, k3-session-interrupted), and
   * the warmth is the point. Stepping into a session should feel like moving
   * to a different, lamp-lit room, not like the same page with less on it.
   *
   * It was missing from `designs/TOKEN-CENSUS.md` too, which is how it got
   * this far unnoticed. Take colours from `designs/extracted/*.html`.
   */
  bgImmersive: '#F2E7D6',
  /** Highest surface — sheets, elevated cards. */
  surfaceRaised: '#FDFCFA',
  /** Cards and wells. */
  surface: '#F3EBE0',
  /**
   * Secondary and quiet BUTTON fill. Not `surface`.
   *
   * Session 9 built `Button variant="secondary"` as `bg-surface`, on the
   * reasonable-sounding theory that a card and a quiet button are the same
   * material. The designs disagree: every secondary button standing on the
   * ordinary ground is this warmer, slightly deeper pair (b1, b10, b11 in
   * light; e4, f8, h1, h5, j4 and the same three in dark). A card is
   * something to read; a button is something to press, and it sits a step
   * further forward. Same class of mistake as `surface` vs `surfaceImmersive`
   * — the value agreed with itself everywhere downstream and matched nothing.
   *
   * Note this pair is mixed against `bg`. On the `bgLift` ground the designs
   * shift it again (f8 uses #F1E7D8/#E6D9C4); nothing needs that yet.
   */
  surfaceQuiet: '#EFE5D8',
  borderQuiet: '#E2D5C3',
  /**
   * Cards and buttons sitting ON the immersive ground.
   *
   * `surface` is mixed against `bg`; on the warmer immersive ground it reads
   * washed out, so the designs use a separate, warmer pair (d4 and d5).
   */
  surfaceImmersive: '#EADCC7',
  borderImmersive: '#DFCEB4',

  /**
   * THE THIRD GROUND. A step warmer than `bg`, a long way short of
   * `bgImmersive`.
   *
   * Used where a screen is saying something good back to the person rather
   * than asking them for anything: the onboarding reveal (b9, "warmest ground
   * in onboarding"), the worry-window summary (f8) and the streak moment
   * (h3). Note the direction reverses between themes — light warms upward
   * from #FBF7F1, dark *lifts* off navy rather than sinking below it, which
   * is the opposite of what `bgImmersive` does. The designer's note on b3 is
   * where the word comes from: "ground lifts a step off navy".
   */
  bgLift: '#FBF4E9',
  /** Cards standing on the lift ground. Mixed against it, like the immersive pair. */
  surfaceLift: '#F6EADA',
  borderLift: '#EBDBC4',

  /**
   * THE FOURTH GROUND: worry.
   *
   * f1, f2, f3, f5, f6 and f7 all sit on a warm clay-tinted sand that is
   * neither `bg` nor `bgImmersive`. It is the ground for everything to do
   * with setting something down and coming back to it later, and it is the
   * third time this project has found a ground missing from the token layer
   * — after `bgImmersive` in session 9 and `surfaceQuiet` in session 10.
   *
   * A NOTE ON THE VALUES, BECAUSE THEY DO NOT ALL MATCH.
   *
   * The six screens carry four hexes: #F6EDE3 (f1, f2, f3), #F4E8DD (f5, f7)
   * and #F5EADF (f6) in light; #1A1D24 for all six in dark. Dark agreeing
   * exactly while light varies by two or three points, non-monotonically
   * through the flow, is the signature of hand-tuning rather than intent —
   * there is no reading of f5 → f6 → f7 in which the ground gets lighter,
   * then darker again, on purpose.
   *
   * So they are normalised to f1's value, which is the one the tab itself
   * uses and therefore the one a person sees most. Recorded in `plans/08`
   * T04 as a judgement call, and cheap to reverse: split this into three
   * names and the screens take them individually.
   */
  /**
   * THE FIFTH GROUND: writing.
   *
   * g0, g2, g3, g5, g6 and e1. Warmer than `bg` and lighter than `bgWorry` —
   * paper rather than clay. Worry is something you set down; writing is
   * something you sit with, and the grounds say so before any copy does.
   */
  bgWrite: '#FAF4E9',
  /**
   * The page itself: the blank-page card on g0 and the editor field on g2.
   *
   * Nearly white and, like `surfaceWorry`, brighter than its ground. The two
   * features' surfaces are the same idea in different materials.
   */
  surfacePaper: '#FEFCF7',
  borderPaper: '#EBDFC9',
  /**
   * A draft (g0).
   *
   * The border is DASHED and that is the whole signal — a draft is visually
   * distinct without being an error state (plan 09 T11). No amber, no badge,
   * no "unfinished" label. Something left open, drawn as something left open.
   */
  surfaceDraft: '#F5EDDF',
  borderDraft: '#DFCFB6',

  bgWorry: '#F6EDE3',
  /**
   * The capture card, and the card a worry is shown in during triage.
   *
   * Lighter than the ground rather than darker — a slip of paper laid on a
   * table, per f2's caption. This is the only surface in Calma that is
   * brighter than the screen it sits on.
   */
  surfaceWorry: '#FCF6EF',
  borderWorry: '#E7D6C6',
  /**
   * Quiet buttons standing on the worry ground (f5's fork), and the card the
   * released worry sits in on f7.
   *
   * Not `surfaceQuiet`: that pair is mixed against `bg`, and on the warmer
   * worry sand it reads washed out. The same relationship, and the same
   * reason, as `surfaceImmersive` versus `surface`.
   */
  surfaceWorryQuiet: '#EFDFD0',
  borderWorryQuiet: '#E2CDBB',
  /**
   * "Open it now" (f1) — a quiet button carrying a clay label.
   *
   * In light mode this is the same pair as `surfaceWorryQuiet` and only the
   * label colour differs. In dark they part company: the fork's buttons stay
   * navy-grey (#262A33) while this one warms to #2C2A2C, because it is the
   * one thing on the tab a person is being invited to do. Two names rather
   * than one, so the dark divergence is expressible.
   */
  surfaceClayQuiet: '#EFDFD0',
  borderClayQuiet: '#E2CDBB',
  /**
   * The window intro (f4), which is its own ground for one screen.
   *
   * Kept separate from `bgWorry` rather than normalised with the rest,
   * because f4's caption describes an intention the others do not share:
   * "clay warms toward amber and the light comes from above — sitting down at
   * a table with a lamp on". Dark has its own value too, which the six
   * normalised screens do not. Where a difference has a stated reason it is
   * kept; where it does not, it is jitter.
   */
  bgWindow: '#F7EBDC',

  /**
   * The empty mark on an unselected option row (b4, b5, b6).
   *
   * Deliberately not `border`: the ring has to read as an unfilled control
   * rather than as a hairline, so it is a touch darker than the card edge it
   * sits inside.
   */
  optionMark: '#D8CAB6',

  /**
   * Track behind onboarding's progress hairline.
   *
   * A tint of the text colour, not a border colour — it has to disappear
   * almost entirely against the ground so that only the amber travelled
   * portion registers.
   */
  hairlineTrack: 'rgba(42,54,66,0.09)',

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
  /** Secondary and quiet button fill. See the note on `light.surfaceQuiet`. */
  surfaceQuiet: '#212C39',
  borderQuiet: '#2E3B4A',
  /** Cards and buttons on the immersive ground (d4, d5). */
  surfaceImmersive: '#1C2733',
  borderImmersive: '#2A3644',
  /** The third ground. Lifts off navy; light's equivalent warms. See above. */
  bgLift: '#16202B',
  surfaceLift: '#1F2A36',
  borderLift: '#2C3846',

  /**
   * The worry ground in dark.
   *
   * Note it is WARMER than `bg` (#141C26) rather than cooler — it drops the
   * blue slightly instead of deepening it. The light theme warms up and the
   * dark theme de-blues; both move the same direction emotionally, toward
   * clay, which is the direction the whole feature is coloured in.
   *
   * Unlike light, all six worry screens agree on this value exactly. See the
   * note on `light.bgWorry` for why that asymmetry decided the normalisation.
   */
  bgWrite: '#151D26',
  /** Note this equals `surfaceWarm` in dark — the designs converge here. */
  surfacePaper: '#1E2731',
  borderPaper: '#2C3742',
  surfaceDraft: '#1B242E',
  borderDraft: '#333E4A',

  bgWorry: '#1A1D24',
  surfaceWorry: '#242830',
  borderWorry: '#343945',
  surfaceWorryQuiet: '#262A33',
  borderWorryQuiet: '#363B46',
  surfaceClayQuiet: '#2C2A2C',
  borderClayQuiet: '#3D383B',
  bgWindow: '#1C1F26',
  optionMark: '#3B4857',
  hairlineTrack: 'rgba(234,226,215,0.12)',
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
    /**
     * Ring around an amber control that sits ON an amber surface -- the
     * SUDS thumb (d2). A step between `base` and `pressed`: reach for either
     * of those instead and the thumb reads flat against the track.
     */
    ring: '#D08A45',
    /** Label colour on an amber fill. */
    on: '#33230F',
    /**
     * SELECTION. A warm wash plus a border, never brightness alone.
     *
     * The designer's note on b2-dark says why: selection carried by a
     * brightness step vanishes at low display brightness and in greyscale,
     * which are precisely the conditions of the 2am user. So a selected
     * option row is a fill AND a 1.5px edge, and it survives being unable to
     * see colour at all.
     *
     * `wash` is a flat colour in light mode and a translucent one in dark —
     * that is the designs, not an inconsistency: over navy a solid tint reads
     * as a second surface, over sand it does not.
     */
    wash: '#F9EDDC',
    washBorder: '#E39A45',
    /**
     * Amber as TEXT, not as a fill. The one emphasised phrase on the
     * onboarding reveal (b9). Darkened well past `base`, which is a fill
     * colour and fails contrast at body size on any of our grounds.
     */
    ink: '#9A6220',
  },
  dark: {
    /** Lower intensity than light mode. This is the 2am rule, in a token. */
    base: '#D19249',
    pressed: '#B87A3A',
    soft: '#DFA55B',
    softer: '#E7C089',
    ring: '#C08347',
    on: '#221708',
    wash: 'rgba(209,146,73,0.13)',
    /** Not `base`. The selected edge is duller here so it does not glow. */
    washBorder: '#A9743A',
    ink: '#DFAE73',
  },
} as const;

/**
 * Amber is a GRADIENT wherever it is a fill, never a flat colour.
 *
 * Every amber surface in the designs — the primary button, the panic FAB — is
 * a three-stop linear gradient at 158deg with a coloured glow beneath it.
 * Session 9 shipped them as flat `bg-accent` and they read as dead: amber is
 * the one thing in this app that gives off light, and a flat fill is a swatch.
 *
 * Angles and offsets are the designers'. The glow is a real shadow in the
 * accent's own colour, not a neutral drop shadow.
 */
export const amberGradient = {
  light: {
    /** Primary button (d2). Offsets 0 / 52 / 100. */
    button: ['#F0B96D', '#E39A45', '#D68B36'],
    /** Panic FAB (d1). Offsets 0 / 54 / 100. Brighter at both ends. */
    fab: ['#F2C079', '#E39A45', '#D0842F'],
    buttonGlow: 'rgba(214,139,54,0.7)',
    fabGlow: 'rgba(214,139,54,0.8)',
  },
  dark: {
    button: ['#DFA55B', '#D19249', '#BE8039'],
    fab: ['#E0AC66', '#D19249', '#B9772F'],
    buttonGlow: 'rgba(209,146,73,0.5)',
    fabGlow: 'rgba(209,146,73,0.6)',
  },
} as const;

/** Gradient stop positions, as fractions. Same in both themes. */
export const amberGradientStops = {
  button: [0, 0.52, 1],
  fab: [0, 0.54, 1],
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
    /**
     * The edge of a focused capture field (f2).
     *
     * 1.5px and solid, where the unfocused edge is 1px and neutral. Focus is
     * shown by the field warming rather than by a glow or a shadow: the
     * keyboard is already up, so this is confirmation that typing lands here
     * — not an attention-grab.
     */
    ring: '#C98B6B',
    /**
     * Clay as text, on a clay-tinted quiet button ("Open it now", f1).
     *
     * Distinct from `text` (#8A4E36), which is the crisis exit's label on the
     * ordinary background. This one is read against `surfaceWorryQuiet` and
     * the designs give it its own, slightly lighter value.
     */
    ink: '#7A4633',
    /**
     * The label on the clay gradient button ("Set it down", f2).
     *
     * Very dark and slightly warm rather than the app's text colour: it sits
     * on a mid-tone clay fill, and `foreground` (#2A3642) is a cool navy that
     * reads as a bruise against it.
     */
    on: '#2E1810',
    /** Ripple rings on the capture confirmation (f3), at 0.22 / 0.3 / 0.4. */
    ripple: '190,116,88',
    /** Placeholder in the capture field (f1). */
    placeholder: '#6E6155',
  },
  dark: {
    base: '#D48C6A',
    text: '#E3A98C',
    fill: 'rgba(222,150,110,0.13)',
    border: 'rgba(222,150,110,0.32)',
    ring: '#A96B52',
    ink: '#DBA78F',
    on: '#23130C',
    ripple: '196,129,106',
    placeholder: '#A0A5AE',
  },
} as const;

/**
 * The clay gradient — the "Set it down" button on f2.
 *
 * The only fill in Calma that is neither amber nor flat. Amber is the app's
 * light source and is reserved for the one obvious action on a screen;
 * setting a worry down is not that kind of action, but it is not a quiet
 * dismissal either, so it gets the same treatment in the feature's own
 * colour. Same three-stop shape and the same offsets as the amber button.
 */
export const clayGradient = {
  light: {
    button: ['#D4906F', '#BE7458', '#A9634A'],
    buttonGlow: 'rgba(190,116,88,0.7)',
  },
  dark: {
    button: ['#C9866B', '#B06E55', '#965B44'],
    buttonGlow: 'rgba(176,110,85,0.6)',
  },
} as const;

/* ------------------------------------------------------------------ *
 * SAGE — one screen, one meaning
 * ------------------------------------------------------------------ */

/**
 * The action step's green (f6), and nowhere else in the app.
 *
 * The designer's note: "Sage enters here, quietly, on the field's edge —
 * something turned useful." It marks the one moment in the worry flow where a
 * person is writing down what they are going to do about something, and it is
 * the only non-amber, non-clay hue in the product.
 *
 * It is a border and a caret, never a fill and never text at body size. That
 * restraint is what keeps it from reading as a success state — Calma has no
 * green ticks, because it has nothing to be right about (systems/03).
 */
export const sage = {
  light: {
    /** The caret in the action field. */
    base: '#7E8F72',
    /** The focused field's 1.5px edge. */
    ring: '#A8B39C',
  },
  dark: {
    base: '#9AAA8C',
    ring: '#6E7C63',
  },
} as const;

/**
 * The lamp on the window intro (f4).
 *
 * A radial ellipse from the top edge, 320px tall, in the amber accent at low
 * opacity. It is the only light-from-above in the app and it exists for one
 * screen, where the metaphor is sitting down at a table to look at something
 * properly.
 */
export const windowLamp = {
  light: { from: 'rgba(227,154,69,0.28)', to: 'rgba(227,154,69,0)' },
  dark: { from: 'rgba(209,146,73,0.2)', to: 'rgba(209,146,73,0)' },
} as const;

/** Device chrome in the design mockups. Not app UI — reference only. */
export const bezel = { light: '#14110E', dark: '#0C0F14' } as const;

export const scheme = { light, dark } as const;
export type ColorScheme = keyof typeof scheme;
