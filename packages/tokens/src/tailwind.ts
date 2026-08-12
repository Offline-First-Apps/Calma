/**
 * The token -> CSS-variable name map.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE USED TO EXPORT A TAILWIND v3 PRESET. IT WAS DEAD CODE.
 *
 * `calmaPreset` was a `theme.extend` object of the shape Tailwind v3 reads
 * from `tailwind.config.js`. Uniwind v1 runs Tailwind v4, which is CSS-first
 * and never loads a JS config. Nothing imported the preset, so nothing
 * noticed: every semantic class in the app quietly resolved against
 * heroui-native's stock palette instead, and the app rendered in heroui blue
 * on cool grey while the tokens sat here describing a warm, lamp-lit room.
 *
 * The theme now lives in `apps/native/global.css` as real CSS. That file is
 * the only place the values are consumed; THIS file remains the only place
 * they are *defined*. `theme-parity.test.ts` walks the map below, reads the
 * CSS, and fails if any pair has drifted.
 *
 * So: change a colour here. Never there.
 * ---------------------------------------------------------------------------
 */
import { amber, clay, dark, light, orb } from './colors';
import { control, radius } from './layout';
import { fontFamily } from './typography';

/**
 * A theme-dependent variable: the bare custom property heroui-native reads,
 * and the value it must carry in each theme.
 *
 * The bare name (`--accent`) is the override point; the utility class name
 * (`bg-accent`) is generated from heroui's own `@theme inline` mapping, or
 * from ours for the Calma-only additions.
 */
export interface ThemedVar {
  /** The bare custom property, without the leading dashes. */
  cssVar: string;
  lightValue: string;
  darkValue: string;
}

/**
 * Every colour that changes between themes.
 *
 * Note `warm`: light and dark do NOT agree, and that is the point. Dark mode
 * carries two text colours -- cream for the serif sentences meant to be felt,
 * cool grey for the sans copy that only needs reading (D-017). Collapsing
 * them would make "You're still here. That's enough." read like a status bar.
 */
export const themedColors: readonly ThemedVar[] = [
  { cssVar: 'background', lightValue: light.bg, darkValue: dark.bg },
  { cssVar: 'foreground', lightValue: light.text, darkValue: dark.text },
  { cssVar: 'surface', lightValue: light.surface, darkValue: dark.surface },
  { cssVar: 'surface-secondary', lightValue: light.surfaceRaised, darkValue: dark.surfaceRaised },
  { cssVar: 'surface-tertiary', lightValue: light.surfaceWarm, darkValue: dark.surfaceWarm },
  { cssVar: 'surface-immersive', lightValue: light.surfaceImmersive, darkValue: dark.surfaceImmersive },
  { cssVar: 'border-immersive', lightValue: light.borderImmersive, darkValue: dark.borderImmersive },
  { cssVar: 'muted', lightValue: light.textMuted, darkValue: dark.textMuted },
  { cssVar: 'border', lightValue: light.border, darkValue: dark.border },
  { cssVar: 'separator', lightValue: light.border, darkValue: dark.border },
  { cssVar: 'border-strong', lightValue: light.borderStrong, darkValue: dark.borderStrong },

  { cssVar: 'accent', lightValue: amber.light.base, darkValue: amber.dark.base },
  { cssVar: 'accent-foreground', lightValue: amber.light.on, darkValue: amber.dark.on },
  { cssVar: 'accent-pressed', lightValue: amber.light.pressed, darkValue: amber.dark.pressed },
  { cssVar: 'accent-soft', lightValue: amber.light.soft, darkValue: amber.dark.soft },
  { cssVar: 'accent-softer', lightValue: amber.light.softer, darkValue: amber.dark.softer },
  { cssVar: 'accent-ring', lightValue: amber.light.ring, darkValue: amber.dark.ring },

  /** Light mode has one text colour; dark mode's cream is the whole reason. */
  { cssVar: 'warm', lightValue: light.text, darkValue: dark.textWarm },
  { cssVar: 'secondary', lightValue: light.textSecondary, darkValue: dark.textSecondary },
  { cssVar: 'faint', lightValue: light.textFaint, darkValue: dark.textFaint },

  /**
   * The deeper ground under a breathing or panic session.
   *
   * BOTH themes have their own value. Light mode's is not `bg` -- see the
   * note on `light.bgImmersive`.
   */
  { cssVar: 'immersive', lightValue: light.bgImmersive, darkValue: dark.bgImmersive },

  { cssVar: 'clay', lightValue: clay.light.base, darkValue: clay.dark.base },
  { cssVar: 'clay-foreground', lightValue: clay.light.text, darkValue: clay.dark.text },
  { cssVar: 'clay-fill', lightValue: clay.light.fill, darkValue: clay.dark.fill },
  { cssVar: 'clay-border', lightValue: clay.light.border, darkValue: clay.dark.border },
] as const;

/**
 * Colours that are identical in both themes.
 *
 * Only the orb qualifies. It glows the same at 3pm and 3am because it is a
 * lamp in the room rather than part of the room.
 */
export const staticColors: Readonly<Record<string, string>> = {
  'color-orb-core': orb.core,
  'color-orb-mid': orb.mid,
  'color-orb-edge': orb.edge,
};

/**
 * Font families, by the name they are registered under in `useFonts`.
 *
 * The weight is baked into the family name on purpose -- see the long note in
 * `global.css`. Asking for `font-sans font-medium` gets you the regular face
 * on iOS and Roboto on some Android builds, silently, with no error anywhere.
 */
export const fontVars: Readonly<Record<string, string>> = {
  'font-serif': fontFamily.serif,
  'font-serif-medium': `${fontFamily.serif}_500Medium`,
  'font-sans': fontFamily.sans,
  'font-sans-medium': `${fontFamily.sans}_500Medium`,
  'font-sans-semibold': `${fontFamily.sans}_600SemiBold`,
};

/** Control heights, exposed through Tailwind's `--spacing-*` namespace. */
export const spacingVars: Readonly<Record<string, string>> = {
  'spacing-pill': `${control.pill}px`,
  'spacing-button': `${control.button}px`,
  'spacing-button-immersive': `${control.buttonImmersive}px`,
  'spacing-card': `${control.card}px`,
  'spacing-card-tall': `${control.cardTall}px`,
  'spacing-min-target': `${control.minTarget}px`,
  'spacing-panic-fab': `${control.panicFab}px`,
};

/**
 * Radii, namespaced away from heroui's `--radius-*` scale.
 *
 * heroui's own components are built against `rounded-lg` meaning 8px. Calma's
 * `lg` means 20. Overriding the scale would restyle every heroui internal;
 * naming ours `rounded-card` and friends keeps both correct.
 */
export const radiusVars: Readonly<Record<string, string>> = {
  'radius-tight': `${radius.sm}px`,
  'radius-input': `${radius.md}px`,
  'radius-card': `${radius.lg}px`,
  'radius-sheet': `${radius.xl}px`,
  'radius-well': `${radius['2xl']}px`,
  'radius-hero': `${radius['3xl']}px`,
};
