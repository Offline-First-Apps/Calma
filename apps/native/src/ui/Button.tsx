import { Button as HeroButton } from 'heroui-native';
import { Text } from './Text';

/**
 * Buttons are 62px tall with a fully rounded end — radius is always exactly
 * half the height, per the designs.
 *
 * `quiet` is not a lesser button. Every "Not now", "Skip", and "I'm done" in
 * Calma uses it, and the tone rules require those to be equal in weight and
 * timing to the primary action — never greyed, never delayed, never smaller.
 * (systems/05-entitlements.md)
 */
const variants = {
  /** Amber fill. The one obvious action on a screen. */
  primary: 'bg-accent active:bg-accent-pressed border border-transparent',
  /** Sand fill. Used where nothing is allowed to out-shout the orb. */
  secondary: 'bg-surface border border-border active:bg-surface-secondary',
  /** Text only. Dismissals and skips. */
  quiet: 'bg-transparent border border-transparent',
} as const;

const labelColor = {
  primary: 'text-accent-foreground',
  secondary: 'text-foreground',
  quiet: 'text-muted',
} as const;

export type ButtonVariant = keyof typeof variants;

export function Button({
  variant = 'primary',
  label,
  className = '',
  ...props
}: React.ComponentProps<typeof HeroButton> & { variant?: ButtonVariant; label: string }) {
  return (
    <HeroButton
      accessibilityRole="button"
      className={`h-button rounded-full flex-row items-center justify-center px-6 ${variants[variant]} ${className}`}
      {...props}
    >
      <Text variant="control" className={labelColor[variant]}>
        {label}
      </Text>
    </HeroButton>
  );
}
