/**
 * Calma colour tokens.
 *
 * Warm neutrals. A lamp-lit room, not a clinic.
 *
 * PROHIBITED, everywhere in the product:
 *   - pure #FFFFFF and pure #000000
 *   - any saturated red
 *   - any traffic-light semantic pair (green = good / red = bad)
 *
 * There is no error colour in this app. Nothing in Calma is an error.
 * A red alert shown to an anxious person is a small act of harm.
 *
 * See systems/03-design-system.md
 */

/** Backgrounds and surfaces. */
export const sand = {
  50: '#FDFBF7', // highest surface, sheets
  100: '#F7F1E8', // app background (light)
  200: '#EFE6DA', // raised cards
  300: '#E2D5C5', // borders, dividers
  400: '#CDBBA6', // disabled fills
} as const;

/** Primary warm accent. The orb, the primary action, the thing that glows. */
export const amber = {
  200: '#F7DCB8', // orb outer glow
  300: '#F0C48A', // orb mid; orb glow in dark mode (lower intensity)
  400: '#E5A961', // primary action fill, orb core
  500: '#D48F42', // pressed
  600: '#B0722F', // amber text on sand — AA at 16px+
} as const;

/**
 * Secondary. The worry surfaces.
 * Earthier and slightly heavier — the colour of something you're holding.
 */
export const clay = {
  300: '#D5A894', // worry card tint
  400: '#BE8873', // worry accents, release animation
  500: '#9E6A56', // clay text on sand
} as const;

/** Text, focus, and night. */
export const navy = {
  100: '#D8E0EA', // primary text (dark mode)
  300: '#8494A8', // muted text (light mode)
  500: '#4A5B72', // secondary text (dark mode)
  700: '#2E3B4E', // dark border
  800: '#1E2938', // dark raised card
  900: '#161E29', // primary text (light) / app background (dark)
} as const;

/** Quiet affirmative. Used sparingly — streak, completed, "within your control". */
export const sage = {
  400: '#7D9A7E',
} as const;

export const palette = { sand, amber, clay, navy, sage } as const;

/**
 * Semantic roles.
 *
 * Components consume THESE, not the raw palette. A component that reaches for
 * `sand[100]` directly will be wrong in dark mode.
 */
export const semantic = {
  light: {
    bg: sand[100],
    surface: sand[200],
    surfaceRaised: sand[50],
    border: sand[300],
    text: navy[900],
    textMuted: navy[300],
    accent: amber[400],
    accentPressed: amber[500],
    accentText: navy[900], // label on an amber fill
    onAccentSurface: amber[600], // amber-family text ON sand
    worry: clay[300],
    worryAccent: clay[400],
    worryText: clay[500],
    affirm: sage[400],
    disabled: sand[400],
  },
  dark: {
    bg: navy[900],
    surface: navy[800],
    surfaceRaised: navy[700],
    border: navy[700],
    text: navy[100],
    textMuted: navy[500],
    // Amber drops to 300 in dark so it never sears a dark-adapted eye at 2am.
    accent: amber[300],
    accentPressed: amber[400],
    accentText: navy[900],
    onAccentSurface: amber[300],
    worry: clay[400],
    worryAccent: clay[300],
    worryText: clay[300],
    affirm: sage[400],
    disabled: navy[700],
  },
} as const;

export type ColorScheme = keyof typeof semantic;
export type SemanticRole = keyof (typeof semantic)['light'];

/** Orb gradient stops. Shared by the native SVG orb and the web landing page. */
export const orbGradient = {
  light: [amber[300], amber[400], amber[500]],
  dark: [amber[200], amber[300], amber[400]],
} as const;
