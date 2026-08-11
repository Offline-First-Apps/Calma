import { Pressable, View } from 'react-native';
import { Text } from './Text';

/**
 * A selectable option. Used by every multi-select question in onboarding and
 * by the breathing pattern picker.
 *
 * Minimum 64px but GROWS with its text — a 40% longer translation must wrap,
 * never truncate (systems/10-i18n.md). Selection is carried by border and a
 * tinted fill, never by colour alone, so it survives colour-blindness and
 * high-contrast modes.
 *
 * Every option is visually identical in weight. In the onboarding questions no
 * option is the concerning one, and "Nothing yet" must never read as an
 * admission.
 */
export function OptionCard({
  label,
  description,
  selected = false,
  onPress,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className={`min-h-card justify-center rounded-[20px] border px-5 py-4 active:opacity-90 ${
        selected ? 'border-accent bg-accent/12' : 'border-border bg-surface'
      }`}
    >
      <View className="gap-1">
        <Text variant="control" className="text-foreground">{label}</Text>
        {description ? <Text variant="callout">{description}</Text> : null}
      </View>
    </Pressable>
  );
}
