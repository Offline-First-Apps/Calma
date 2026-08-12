import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { hapticSelection } from '@/src/lib/haptics';
import { Text } from '@/src/ui/Text';

/**
 * A 0–10 intensity control.
 *
 * ELEVEN TAPPABLE MARKS, NOT A SLIDER.
 *
 * The pre-session SUDS control is a slider because it is dragged mid-spiral
 * with one thumb. This one is answered while sitting still and writing, and a
 * slider there has a worse property: it is analogue, so it invites fiddling
 * with a number that does not deserve precision. Eleven marks say "roughly
 * this" and let someone move on.
 *
 * NO LABELS BEYOND THE ENDS, AND NO COLOUR RAMP.
 *
 * A green-to-red scale would make 8 a failing grade. Calma has no red and
 * nothing to be right about (systems/03): the marks are all the same colour
 * and only the selected one is filled.
 */
export function IntensityScale({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: number | null;
  onChange: (next: number) => void;
  accessibilityLabel: string;
}) {
  const { t } = useTranslation('journal');

  return (
    <View>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 10, now: value ?? 0 }}
        className="flex-row items-center justify-between"
      >
        {Array.from({ length: 11 }, (_, mark) => (
          <Mark
            key={mark}
            mark={mark}
            selected={value === mark}
            onPress={() => {
              hapticSelection();
              onChange(mark);
            }}
          />
        ))}
      </View>

      <View className="mt-3 flex-row justify-between">
        <Text variant="footnote">{t('intensityLow')}</Text>
        <Text variant="footnote">{t('intensityHigh')}</Text>
      </View>
    </View>
  );
}

function Mark({
  mark,
  selected,
  onPress,
}: {
  mark: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={String(mark)}
      accessibilityState={{ selected }}
      onPress={onPress}
      // 44 wide keeps every mark above the minimum target even though the dot
      // is small. Eleven 20px circles across a phone would be a dexterity
      // test, and this control is answered by people whose hands are shaking.
      className="h-12 flex-1 items-center justify-center"
      hitSlop={6}
    >
      <View
        className={
          selected
            ? 'h-[22px] w-[22px] rounded-full border-2 border-accent-wash-border bg-accent'
            : 'h-[10px] w-[10px] rounded-full bg-option-mark'
        }
      />
    </Pressable>
  );
}
