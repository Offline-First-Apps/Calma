/**
 * Tailwind preset shared by apps/native (uniwind) and apps/web.
 *
 * Semantic names only. A component that writes `bg-sand-100` will be wrong in
 * dark mode; `bg-surface` will not. Theme switching is handled by the
 * `.dark` class / colorScheme, so every semantic colour resolves per theme.
 */
import { light, dark, amber, clay, orb } from './colors';
import { radius, space, control } from './layout';
import { type, fontFamily } from './typography';

export const calmaPreset = {
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: light.bg, dark: dark.bg },
        'bg-immersive': { DEFAULT: light.bg, dark: dark.bgImmersive },
        surface: { DEFAULT: light.surface, dark: dark.surface },
        'surface-raised': { DEFAULT: light.surfaceRaised, dark: dark.surfaceRaised },
        'surface-warm': { DEFAULT: light.surfaceWarm, dark: dark.surfaceWarm },
        border: { DEFAULT: light.border, dark: dark.border },
        'border-strong': { DEFAULT: light.borderStrong, dark: dark.borderStrong },

        text: { DEFAULT: light.text, dark: dark.text },
        'text-warm': { DEFAULT: light.text, dark: dark.textWarm },
        'text-secondary': { DEFAULT: light.textSecondary, dark: dark.textSecondary },
        'text-muted': { DEFAULT: light.textMuted, dark: dark.textMuted },
        'text-faint': { DEFAULT: light.textFaint, dark: dark.textFaint },

        accent: { DEFAULT: amber.light.base, dark: amber.dark.base },
        'accent-pressed': { DEFAULT: amber.light.pressed, dark: amber.dark.pressed },
        'accent-soft': { DEFAULT: amber.light.soft, dark: amber.dark.soft },
        'on-accent': { DEFAULT: amber.light.on, dark: amber.dark.on },

        clay: { DEFAULT: clay.light.base, dark: clay.dark.base },
        'clay-text': { DEFAULT: clay.light.text, dark: clay.dark.text },

        orb: { core: orb.core, mid: orb.mid, edge: orb.edge },
      },
      borderRadius: {
        sm: `${radius.sm}px`, md: `${radius.md}px`, lg: `${radius.lg}px`,
        xl: `${radius.xl}px`, '2xl': `${radius['2xl']}px`, '3xl': `${radius['3xl']}px`,
      },
      spacing: Object.fromEntries(Object.entries(space).map(([k, v]) => [k, `${v}px`])),
      height: Object.fromEntries(Object.entries(control).map(([k, v]) => [k, `${v}px`])),
      fontFamily: { serif: [fontFamily.serif, 'serif'], sans: [fontFamily.sans, 'system-ui', 'sans-serif'] },
      fontSize: Object.fromEntries(
        Object.entries(type).map(([k, v]) => [
          k,
          [`${v.size}px`, { lineHeight: `${v.lineHeight}px`, letterSpacing: `${v.letterSpacing}px`, fontWeight: v.weight }],
        ]),
      ),
    },
  },
} as const;

export default calmaPreset;
