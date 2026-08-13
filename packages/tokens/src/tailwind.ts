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
import { amber, clay, dark, light, orb, sage } from './colors';
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
  /** Buttons, not cards. See the note on `light.surfaceQuiet`. */
  { cssVar: 'surface-quiet', lightValue: light.surfaceQuiet, darkValue: dark.surfaceQuiet },
  { cssVar: 'border-quiet', lightValue: light.borderQuiet, darkValue: dark.borderQuiet },
  /** The third ground and the cards that stand on it (b9, f8, h3). */
  { cssVar: 'lift', lightValue: light.bgLift, darkValue: dark.bgLift },
  { cssVar: 'surface-lift', lightValue: light.surfaceLift, darkValue: dark.surfaceLift },
  { cssVar: 'border-lift', lightValue: light.borderLift, darkValue: dark.borderLift },
  { cssVar: 'option-mark', lightValue: light.optionMark, darkValue: dark.optionMark },
  { cssVar: 'hairline-track', lightValue: light.hairlineTrack, darkValue: dark.hairlineTrack },
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
  /** Selection: a wash plus an edge, so it survives greyscale (b2-dark). */
  { cssVar: 'accent-wash', lightValue: amber.light.wash, darkValue: amber.dark.wash },
  { cssVar: 'accent-wash-border', lightValue: amber.light.washBorder, darkValue: amber.dark.washBorder },
  /** Amber as text rather than as a fill. */
  { cssVar: 'accent-ink', lightValue: amber.light.ink, darkValue: amber.dark.ink },

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
  /** The focused capture field's edge, and clay as a label colour (f1, f2). */
  { cssVar: 'clay-ring', lightValue: clay.light.ring, darkValue: clay.dark.ring },
  { cssVar: 'clay-ink', lightValue: clay.light.ink, darkValue: clay.dark.ink },
  { cssVar: 'clay-on', lightValue: clay.light.on, darkValue: clay.dark.on },
  { cssVar: 'clay-placeholder', lightValue: clay.light.placeholder, darkValue: clay.dark.placeholder },

  /**
   * The fourth ground and everything standing on it (f1-f7).
   *
   * See the long note on `light.bgWorry`: six screens, four light hexes, one
   * dark hex, normalised to f1's. `bgWindow` is deliberately not folded in.
   */
  /** The fifth ground: writing (g0, g2, g3, g5, g6, e1). */
  { cssVar: 'write', lightValue: light.bgWrite, darkValue: dark.bgWrite },
  { cssVar: 'surface-paper', lightValue: light.surfacePaper, darkValue: dark.surfacePaper },
  { cssVar: 'border-paper', lightValue: light.borderPaper, darkValue: dark.borderPaper },
  /** A draft. Dashed border, never an error colour. */
  { cssVar: 'surface-draft', lightValue: light.surfaceDraft, darkValue: dark.surfaceDraft },
  { cssVar: 'border-draft', lightValue: light.borderDraft, darkValue: dark.borderDraft },
  { cssVar: 'saved', lightValue: light.bgSaved, darkValue: dark.bgSaved },
  { cssVar: 'offer', lightValue: light.bgOffer, darkValue: dark.bgOffer },
  { cssVar: 'surface-offer', lightValue: light.surfaceOffer, darkValue: dark.surfaceOffer },
  { cssVar: 'border-offer', lightValue: light.borderOffer, darkValue: dark.borderOffer },
  { cssVar: 'highlight', lightValue: light.highlight, darkValue: dark.highlight },
  { cssVar: 'surface-price', lightValue: light.surfacePrice, darkValue: dark.surfacePrice },
  { cssVar: 'border-price', lightValue: light.borderPrice, darkValue: dark.borderPrice },
  { cssVar: 'surface-tile-accent', lightValue: light.surfaceTileAccent, darkValue: dark.surfaceTileAccent },
  { cssVar: 'border-tile-accent', lightValue: light.borderTileAccent, darkValue: dark.borderTileAccent },
  { cssVar: 'surface-tile-neutral', lightValue: light.surfaceTileNeutral, darkValue: dark.surfaceTileNeutral },
  { cssVar: 'border-tile-neutral', lightValue: light.borderTileNeutral, darkValue: dark.borderTileNeutral },
  { cssVar: 'surface-tile-clay', lightValue: light.surfaceTileClay, darkValue: dark.surfaceTileClay },
  { cssVar: 'border-tile-clay', lightValue: light.borderTileClay, darkValue: dark.borderTileClay },
  /** Progress (h1-h5). See the block comment in `colors.ts`. */
  { cssVar: 'card-secondary', lightValue: light.cardSecondary, darkValue: dark.cardSecondary },
  { cssVar: 'segment-track', lightValue: light.segmentTrack, darkValue: dark.segmentTrack },
  { cssVar: 'segment-border', lightValue: light.segmentBorder, darkValue: dark.segmentBorder },
  { cssVar: 'segment-selected', lightValue: light.segmentSelected, darkValue: dark.segmentSelected },
  { cssVar: 'bar-track', lightValue: light.barTrack, darkValue: dark.barTrack },
  { cssVar: 'surface-tile-sage', lightValue: light.surfaceTileSage, darkValue: dark.surfaceTileSage },
  { cssVar: 'border-tile-sage', lightValue: light.borderTileSage, darkValue: dark.borderTileSage },
  { cssVar: 'glyph-accent', lightValue: light.glyphAccent, darkValue: dark.glyphAccent },
  { cssVar: 'glyph-clay', lightValue: light.glyphClay, darkValue: dark.glyphClay },
  { cssVar: 'glyph-neutral', lightValue: light.glyphNeutral, darkValue: dark.glyphNeutral },
  { cssVar: 'glyph-sage', lightValue: light.glyphSage, darkValue: dark.glyphSage },
  { cssVar: 'plus-label', lightValue: light.textPlusLabel, darkValue: dark.textPlusLabel },
  { cssVar: 'sage-mark', lightValue: light.sageMark, darkValue: dark.sageMark },
  { cssVar: 'sage-mark-core', lightValue: light.sageMarkCore, darkValue: dark.sageMarkCore },
  { cssVar: 'surface-streak-note', lightValue: light.surfaceStreakNote, darkValue: dark.surfaceStreakNote },
  { cssVar: 'border-streak-note', lightValue: light.borderStreakNote, darkValue: dark.borderStreakNote },

  { cssVar: 'surface-plus', lightValue: light.surfacePlus, darkValue: dark.surfacePlus },
  { cssVar: 'border-plus', lightValue: light.borderPlus, darkValue: dark.borderPlus },
  { cssVar: 'plus-foreground', lightValue: light.textPlus, darkValue: dark.textPlus },
  { cssVar: 'plus-muted', lightValue: light.textPlusMuted, darkValue: dark.textPlusMuted },
  { cssVar: 'separator-row', lightValue: light.separatorRow, darkValue: dark.separatorRow },
  { cssVar: 'surface-stepper', lightValue: light.surfaceStepper, darkValue: dark.surfaceStepper },
  { cssVar: 'stepper-glyph', lightValue: light.stepperGlyph, darkValue: dark.stepperGlyph },

  { cssVar: 'worry', lightValue: light.bgWorry, darkValue: dark.bgWorry },
  /**
   * THE PANIC PATH (e2, e3) and THE PANIC ENDING (e4).
   *
   * `panic` is NOT `immersive`. Two dim warm sands that are not the same dim
   * warm sand -- the exact shape of mistake this map exists to make visible.
   */
  { cssVar: 'panic', lightValue: light.bgPanic, darkValue: dark.bgPanic },
  { cssVar: 'panic-foreground', lightValue: light.textPanic, darkValue: dark.textPanic },
  { cssVar: 'surface-panic-exit', lightValue: light.surfacePanicExit, darkValue: dark.surfacePanicExit },
  { cssVar: 'border-panic-exit', lightValue: light.borderPanicExit, darkValue: dark.borderPanicExit },
  { cssVar: 'panic-exit-foreground', lightValue: light.textPanicExit, darkValue: dark.textPanicExit },
  { cssVar: 'ending', lightValue: light.bgEnding, darkValue: dark.bgEnding },
  { cssVar: 'surface-ending', lightValue: light.surfaceEnding, darkValue: dark.surfaceEnding },
  { cssVar: 'border-ending', lightValue: light.borderEnding, darkValue: dark.borderEnding },
  { cssVar: 'surface-worry', lightValue: light.surfaceWorry, darkValue: dark.surfaceWorry },
  { cssVar: 'border-worry', lightValue: light.borderWorry, darkValue: dark.borderWorry },
  { cssVar: 'surface-worry-quiet', lightValue: light.surfaceWorryQuiet, darkValue: dark.surfaceWorryQuiet },
  { cssVar: 'border-worry-quiet', lightValue: light.borderWorryQuiet, darkValue: dark.borderWorryQuiet },
  { cssVar: 'surface-clay-quiet', lightValue: light.surfaceClayQuiet, darkValue: dark.surfaceClayQuiet },
  { cssVar: 'border-clay-quiet', lightValue: light.borderClayQuiet, darkValue: dark.borderClayQuiet },
  { cssVar: 'window-ground', lightValue: light.bgWindow, darkValue: dark.bgWindow },

  /** One screen, one meaning: the action step's edge and caret (f6). */
  { cssVar: 'sage', lightValue: sage.light.base, darkValue: sage.dark.base },
  { cssVar: 'sage-ring', lightValue: sage.light.ring, darkValue: sage.dark.ring },
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
  /** f8's closing line. A registered face — see the note in `_layout.tsx`. */
  'font-serif-italic': `${fontFamily.serif}_400Regular_Italic`,
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
  'spacing-option-card': `${control.optionCard}px`,
  'spacing-card-tall': `${control.cardTall}px`,
  'spacing-min-target': `${control.minTarget}px`,
  'spacing-panic-fab': `${control.panicFab}px`,
  'spacing-button-compact': `${control.compact}px`,
  'spacing-button-fork': `${control.fork}px`,
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
  'radius-option': `${radius.option}px`,
  'radius-sheet': `${radius.xl}px`,
  'radius-note': `${radius.note}px`,
  'radius-well': `${radius['2xl']}px`,
  'radius-hero': `${radius['3xl']}px`,
};
