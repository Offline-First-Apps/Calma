import { Pressable, View } from 'react-native';

import { Text } from './Text';

/**
 * A selectable option. Every multi-select question in onboarding (b4, b5, b6)
 * and, later, the breathing pattern picker.
 *
 * BUILT FROM designs/extracted/b4-what-brings-you-here-{light,dark}.html.
 *
 * EVERY OPTION IS IDENTICAL IN WEIGHT. Not approximately — identically. Same
 * fill, same radius, same type, same mark, same order of reading. The designer
 * says it three times in three captions and means something specific by it:
 * none of these is the concerning answer, "Nothing yet" must never read as an
 * admission, and "It's hard to say" is an equal rather than a fallback. The
 * moment one option is styled as the healthy one, the screen has started
 * grading the person filling it in.
 *
 * SELECTION IS A WASH PLUS AN EDGE PLUS A FILLED MARK — three signals, none of
 * them brightness alone. That is not belt-and-braces: at 2am on a dimmed
 * screen, or in greyscale, a brightness step is invisible, and those are
 * exactly the conditions this app is designed around.
 *
 * THE HEIGHT IS A FLOOR. 76px minimum, and it grows. A ~40% longer German or
 * Finnish string must wrap; nothing user-facing in Calma truncates, ever
 * (systems/10-i18n.md).
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
      className={`min-h-option-card flex-row items-center justify-between gap-4 rounded-option px-5 py-4 active:opacity-90 ${
        selected
          ? 'border-[1.5px] border-accent-wash-border bg-accent-wash'
          : 'border border-border bg-surface'
      }`}
    >
      {/* `shrink` so the mark keeps its size and the text takes the wrap. */}
      <View className="shrink gap-1">
        <Text variant="bodySmTight">{label}</Text>
        {description ? <Text variant="callout">{description}</Text> : null}
      </View>

      {/*
        The mark is decoration, not information — `accessibilityState.checked`
        on the row already tells a screen reader everything this circle says,
        and announcing it twice is how a simple question starts sounding like
        a form.
      */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`h-[22px] w-[22px] flex-none rounded-full ${
          selected ? 'bg-accent' : 'border-[1.5px] border-option-mark'
        }`}
      />
    </Pressable>
  );
}
