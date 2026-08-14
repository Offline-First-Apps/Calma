import { Pressable, View } from 'react-native';

import { Text } from '@/src/ui/Text';

/**
 * The Week/Longer and 6 months/Year toggle (h1, h5).
 *
 * The selected pill is `segment-selected`, which is the screen's own
 * background — a hole punched in the track rather than a raised button. That
 * is why it has no shadow, and it is the reason the pair are separate tokens
 * even though they hold the same hex in light mode: if the ground moves, this
 * has to move with it, and a shared name is the only thing that guarantees it.
 *
 * Two options is all this ever has. A third would need a scroll or a shrink at
 * 200% font scale, and there is no third view of a person's own history that
 * Calma wants to offer.
 */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly [SegmentOption<T>, SegmentOption<T>];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row gap-1 rounded-[22px] border border-segment-border bg-segment-track p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            // 36px is under the 48px minimum target, so the hit area is
            // extended rather than the control being grown — the design's
            // proportion survives and the thumb still lands.
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            className={`h-9 items-center justify-center rounded-[18px] px-4 ${
              selected ? 'bg-segment-selected' : ''
            }`}
          >
            <Text
              variant="label"
              className={selected ? 'text-warm' : 'font-sans text-label-quiet'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
