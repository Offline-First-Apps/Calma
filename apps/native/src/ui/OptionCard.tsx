import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/src/lib/motion';

import { SELECT_MS } from './press';
import { Text } from './Text';
import { Touchable } from './Touchable';

/**
 * A selectable option. Every multi-select question in onboarding (b4, b5, b6),
 * the breathing pattern picker, appearance, and the worry-window lengths.
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
 * ---------------------------------------------------------------------------
 * THE THREE SIGNALS NOW ARRIVE TOGETHER, OVER 200ms.
 *
 * They used to snap. Three properties changing on one frame reads as a form
 * validating an entry, which is the register b4's caption spends a paragraph
 * avoiding — these are questions somebody is answering about their own
 * anxiety, and the screen should acknowledge an answer rather than record it.
 *
 * They share `SELECT_MS` so the selection is ONE event rather than three: a
 * mark that fills faster than its wash reads as two things happening, and the
 * eye notices the disagreement without being able to say what it saw.
 *
 * The mark scales from 0.7 rather than fading alone, and stops at exactly 1.
 * `systems/03` forbids overshoot and the reason is specific: an element that
 * overshoots has to correct itself, and a correction is a small surprise.
 * Under Reduce Motion the scale drops out and the fade remains.
 * ---------------------------------------------------------------------------
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
  const reduceMotion = useReduceMotion();

  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: SELECT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, progress]);

  /*
   * The wash and the edge are drawn by an overlay that fades in, rather than
   * by swapping className. Uniwind resolves classes to a stylesheet, so there
   * is no interpolating between two of them; an absolutely-positioned sibling
   * with its own opacity is the version that can actually animate, and it
   * keeps the unselected card's own border underneath doing its job.
   */
  const washStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: reduceMotion ? 1 : 0.7 + progress.value * 0.3 },
    ],
  }));

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className="min-h-option-card flex-row items-center justify-between gap-4 rounded-option border border-border bg-surface px-5 py-4"
    >
      <Animated.View
        pointerEvents="none"
        style={washStyle}
        className="absolute inset-0 rounded-option border-[1.5px] border-accent-wash-border bg-accent-wash"
      />

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
        className="h-[22px] w-[22px] flex-none items-center justify-center rounded-full border-[1.5px] border-option-mark"
      >
        {/* Inset by the border width so a filled mark is the solid 22px
            circle the design draws, not a ring with a dot in it. */}
        <Animated.View
          style={markStyle}
          className="absolute -inset-[1.5px] rounded-full bg-accent"
        />
      </View>
    </Touchable>
  );
}
