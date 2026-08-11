import { View, type ViewProps } from 'react-native';

/**
 * Surfaces. Radius 20 (the dominant component radius), 1px border, soft or no
 * shadow. Nothing sharper than 12 exists anywhere in Calma.
 */
const variants = {
  /** Standard card. */
  default: 'bg-surface border border-border',
  /** Paper-feeling surface — journal, reflective screens. */
  paper: 'bg-surface-secondary border border-border',
  /** Highest surface — sheets, elevated content. */
  raised: 'bg-surface-tertiary border border-border',
  /** Worry surfaces. Earthier, a little heavier. */
  worry: 'bg-clay-fill border border-clay-border',
} as const;

export function Card({
  variant = 'default',
  className = '',
  ...props
}: ViewProps & { variant?: keyof typeof variants; className?: string }) {
  return <View className={`rounded-[20px] p-5 ${variants[variant]} ${className}`} {...props} />;
}
