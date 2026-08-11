import { Pressable } from 'react-native';
import { Text } from './Text';

/** 46px pill — the most repeated dimension in the design set. Radius 23. */
export function Chip({
  label,
  selected = false,
  onPress,
}: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`h-pill flex-row items-center justify-center rounded-full border px-[18px] ${
        selected ? 'border-accent bg-accent/12' : 'border-border bg-surface'
      }`}
    >
      <Text variant="label">{label}</Text>
    </Pressable>
  );
}
