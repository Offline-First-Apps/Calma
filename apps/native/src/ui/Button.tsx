import { Pressable, type PressableProps } from 'react-native';

import { Text } from './Text';

/**
 * Buttons are 62px tall with a fully rounded end — radius is always exactly
 * half the height, per the designs.
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
 * 'secondary'` -- which made `quiet` an error in all eight places it is used,
 * and `quiet` is the variant every dismissal in the app depends on.
 *
 * Dropping down to `Pressable` fixes that by removing the conflict rather
 * than working around it, and we lose nothing: every visual property of this
 * button was already being overridden by className, and heroui's press
 * feedback is a scale-and-ripple animation that Calma's motion rules forbid
 * anyway ("no bounce, no overshoot, no elastic"). The press state is the
 * `active:` class, which is a 120ms fill change and nothing else.
 * ---------------------------------------------------------------------------
 */
const variants = {
  /** Amber fill. The one obvious action on a screen. */
  primary: 'bg-accent active:bg-accent-pressed border border-transparent',
  /** Sand fill. Used where nothing is allowed to out-shout the orb. */
  secondary: 'bg-surface border border-border active:bg-border-strong',
  /** Text only. Dismissals and skips. */
  quiet: 'bg-transparent border border-transparent active:opacity-70',
} as const;

const labelColor = {
  primary: 'text-accent-foreground',
  secondary: 'text-foreground',
  quiet: 'text-muted',
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-button rounded-full flex-row items-center justify-center px-6 ${variants[variant]} ${className}`}
      {...props}
    >
      <Text variant="control" className={labelColor[variant]}>
        {label}
      </Text>
    </Pressable>
  );
}
