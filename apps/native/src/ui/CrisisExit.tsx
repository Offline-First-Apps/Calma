import { Pressable, View } from 'react-native';
import { Text } from './Text';

/**
 * "I need this now" — the one non-negotiable in onboarding (D-014).
 *
 * A 12-step onboarding is a wall in front of someone having a panic attack.
 * Some people download Calma DURING the thing it's for, and they must not meet
 * a quiz. Present on EVERY onboarding step; goes straight to a panic session
 * with nothing in between — no confirmation, no save prompt, no dialog.
 *
 * Clay, not red. Its wording has to be recognisable in about half a second of
 * degraded reading, so the copy is plain and never clever. Most people will
 * never tap it; its presence is what makes the rest of onboarding safe to be
 * long.
 */
export function CrisisExit({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Skips setup and starts a breathing session immediately."
      hitSlop={12}
      className="h-pill flex-row items-center gap-[9px] self-end rounded-full border border-clay-border bg-clay-fill px-[18px]"
    >
      <View className="h-2 w-2 rounded-full bg-clay" />
      <Text variant="label" className="text-clay-foreground">{label}</Text>
    </Pressable>
  );
}
