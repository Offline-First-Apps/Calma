import { amberGradient, amberGradientStops, control } from '@calma/tokens';
import { Pressable, View, type PressableProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useUniwind } from 'uniwind';

import { Text } from './Text';

/**
 * Buttons are fully rounded — the radius is always exactly half the height,
 * per the designs.
 *
 * `quiet` is not a lesser button. Every "Not now", "Skip", and "I'm done" in
 * Calma uses it, and the tone rules require those to be equal in weight and
 * timing to the primary action — never greyed, never delayed, never smaller.
 * (systems/05-entitlements.md)
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A `Pressable` AND NOT `heroui-native`'s Button.
 *
 * It was heroui's, and it did not typecheck at a single call site. heroui's
 * `ButtonRootProps` is a discriminated union keyed on `feedbackVariant`, and
 * it declares a `variant` of its own whose values are not ours. Intersecting
 * our props onto it narrowed `variant` to the overlap -- `'primary' |
 * 'secondary'` -- which made `quiet` an error in all eight places it is used.
 *
 * Dropping to `Pressable` removes the conflict rather than working around it,
 * and we lose nothing: every visual property was already overridden by
 * className, and heroui's press feedback is a scale-and-ripple animation that
 * Calma's motion rules forbid anyway.
 *
 * WHY AMBER IS A GRADIENT AND NOT A FILL.
 *
 * Every amber surface in the designs is a three-stop linear gradient with a
 * coloured glow beneath it (d1, d2). Session 9 first shipped these as a flat
 * `bg-accent` and they read as dead — amber is the one thing in this app that
 * gives off light, and a flat fill is a swatch of paint. The gradient is
 * drawn with react-native-svg rather than by adding expo-linear-gradient,
 * since svg is already a dependency for the orb.
 * ---------------------------------------------------------------------------
 */
const variants = {
  /** Amber gradient. The one obvious action on a screen. */
  primary: 'active:opacity-90',
  /**
   * Sand fill. Used where nothing is allowed to out-shout the orb.
   *
   * `surface-quiet`, NOT `surface`. This was `bg-surface` until session 10,
   * on the reasonable-sounding theory that a card and a quiet button are the
   * same material. The designs disagree on every screen that has one (b1,
   * b10, b11, e4, f8, h1, h5, j4): a button sits a step forward of a card and
   * gets its own, warmer pair. Nothing downstream noticed, because everything
   * downstream agreed with itself.
   */
  secondary: 'bg-surface-quiet border border-border-quiet active:bg-border-strong',
  /**
   * Secondary, but standing on the immersive ground.
   *
   * `surface` is mixed against `background`; on the warmer sand of a session
   * screen it reads washed out, so d4 and d5 use their own pair. This is the
   * variant for anything shown during a breathing session.
   */
  immersive:
    'bg-surface-immersive border border-border-immersive active:opacity-90',
  /** Text only. Dismissals and skips. */
  quiet: 'bg-transparent border border-transparent active:opacity-70',
} as const;

const labelColor = {
  primary: 'text-accent-foreground',
  secondary: 'text-foreground',
  immersive: 'text-foreground',
  quiet: 'text-muted',
} as const;

/** d4 and d5 are two points taller than every other button in the app. */
const heights = {
  primary: control.button,
  secondary: control.button,
  immersive: control.buttonImmersive,
  quiet: control.button,
} as const;

export type ButtonVariant = keyof typeof variants;

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  variant?: ButtonVariant;
  label: string;
  className?: string;
}

export function Button({
  variant = 'primary',
  label,
  className = '',
  ...props
}: ButtonProps) {
  const { theme } = useUniwind();
  const height = heights[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`rounded-full flex-row items-center justify-center px-6 ${variants[variant]} ${className}`}
      style={[
        { height },
        // The glow is a shadow in the accent's OWN colour, not a neutral drop
        // shadow. It is what makes the button look lit from within rather
        // than raised off the page.
        variant === 'primary' ? glowFor(theme) : null,
      ]}
      {...props}
    >
      {variant === 'primary' ? <AmberFill height={height} theme={theme} /> : null}

      <Text variant="control" className={labelColor[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}

function isDark(theme: string): boolean {
  return theme === 'dark';
}

function glowFor(theme: string) {
  const dark = isDark(theme);

  return {
    shadowColor: dark ? '#D19249' : '#D68B36',
    shadowOffset: { width: 0, height: dark ? 16 : 14 },
    // CSS blur maps to roughly half as much shadowRadius on iOS.
    shadowRadius: dark ? 20 : 17,
    shadowOpacity: dark ? 0.5 : 0.7,
    // Android has no coloured shadow before API 28 and no spread at all, so
    // the glow degrades to a plain elevation there. Accepted: the gradient
    // still carries the shape, and fighting this would cost a second view.
    elevation: 6,
  };
}

/**
 * The amber gradient, drawn as a rounded rect rather than clipped.
 *
 * `rx` is half the height, which gives the pill without `overflow: hidden` --
 * and avoiding overflow matters, because on Android clipping the container
 * also clips the elevation shadow that is the glow.
 */
function AmberFill({ height, theme }: { height: number; theme: string }) {
  const stops = isDark(theme) ? amberGradient.dark.button : amberGradient.light.button;
  const offsets = amberGradientStops.button;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          {/*
            The designs specify 158deg. In objectBoundingBox units an angle is
            skewed by the box's aspect ratio, and a button is much wider than
            it is tall, so 158deg is expressed here as its dominant component:
            mostly downward with a slight lean to the right. On a 62px-tall
            pill the difference from a true 158deg is under a pixel.
          */}
          <LinearGradient id="amberButton" x1="0" y1="0" x2="0.22" y2="1">
            {stops.map((color, i) => (
              <Stop key={color} offset={`${offsets[i]! * 100}%`} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={height / 2}
          ry={height / 2}
          fill="url(#amberButton)"
        />
      </Svg>
    </View>
  );
}
