import { amber, dark, light } from '@calma/tokens';
import { type ReactNode, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { useReduceMotion } from '@/src/lib/motion';
import { SELECT_MS } from '@/src/ui/press';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

/**
 * The settings row vocabulary (j1, j2).
 *
 * Three kinds and no more: a row that states a value, a row that toggles, and
 * a row that goes somewhere. j1's caption is the constraint —
 * *"every switch says what it does to you, not what it toggles"* — so the
 * label is a sentence about the person's experience ("Gentle buzz on each
 * breath"), never a noun ("Haptics"), and the sub-line says what it is for
 * rather than what it does technically.
 */

/**
 * A group of rows, under a quiet heading.
 *
 * The designs set the heading in uppercase IBM Plex Mono. Calma ships two
 * typefaces and never shouts (`systems/03`, and the note in `typography.ts`),
 * so it is the sans caption with the design's tracking — the same call made
 * for h1's tile labels and i1's.
 */
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="mt-5">
      <Text variant="caption" className="mx-1 mb-[10px] tracking-[1.5px] text-faint">
        {title}
      </Text>
      <View className="overflow-hidden rounded-3xl border border-border-strong bg-surface-tertiary">
        {children}
      </View>
    </View>
  );
}

/** The rule between rows. Absent on the last one, which is why it is a prop. */
function Divider({ last }: { last: boolean }) {
  if (last) return null;
  return <View className="h-px bg-row-separator" />;
}

interface RowText {
  label: string;
  /** The second line. Says what the setting is for, never what it toggles. */
  hint?: string;
}

function Labels({ label, hint }: RowText) {
  return (
    <View className="flex-1 gap-[3px]">
      <Text variant="bodySm" className="text-[18px] leading-[24px]">
        {label}
      </Text>
      {hint ? (
        <Text
          variant="label"
          className="font-sans text-[15px] leading-[20px] text-label-quiet"
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** A row that states a value: "Your window · 8–8:20pm". */
export function ValueRow({
  label,
  hint,
  value,
  onPress,
  last = false,
}: RowText & { value: string; onPress?: () => void; last?: boolean }) {
  const body = (
    <View className="flex-row items-center justify-between gap-[14px] px-5 py-[18px]">
      <Labels label={label} hint={hint} />
      <Text variant="callout" className="text-[17px] text-label-quiet">
        {value}
      </Text>
    </View>
  );

  return (
    <>
      {onPress ? (
        <Touchable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${value}`}
        >
          {body}
        </Touchable>
      ) : (
        body
      )}
      <Divider last={last} />
    </>
  );
}

/** A row that goes somewhere. */
export function LinkRow({
  label,
  hint,
  onPress,
  last = false,
}: RowText & { onPress: () => void; last?: boolean }) {
  return (
    <>
      <Touchable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="flex-row items-center justify-between gap-[14px] px-5 py-[18px]"
      >
        <Labels label={label} hint={hint} />
        <Chevron />
      </Touchable>
      <Divider last={last} />
    </>
  );
}

/**
 * Two rotated borders rather than an icon-font chevron.
 *
 * `@expo/vector-icons` is already a dependency and its chevron is a different
 * weight and proportion from the design's, which is a 9x9 square with 2px
 * borders on two sides. At this size that difference is the whole shape.
 */
export function Chevron() {
  return (
    <View
      className="flex-none border-r-2 border-t-2 border-chevron"
      style={{ width: 9, height: 9, transform: [{ rotate: '45deg' }] }}
    />
  );
}

/**
 * A switch.
 *
 * Drawn rather than using RN's `Switch`, because the platform control is
 * green-when-on on iOS and the palette has no green outside sage — and sage
 * means "settled", not "correct". The off track is a warm sand, never a grey
 * and never half of a red/green pair: a setting that is off is a thing that
 * is not happening, not a thing that is wrong.
 *
 * The whole row is the target, not just the 52px switch. At 200% font scale
 * the label wraps to three lines and the switch stays 32px tall; making only
 * the switch tappable would leave most of the row dead.
 */
export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  last = false,
}: RowText & {
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const tokens = isDark ? dark : light;
  const on = isDark ? amber.dark.base : amber.light.base;
  const reduceMotion = useReduceMotion();

  /*
   * THE KNOB USED TO TELEPORT.
   *
   * `alignItems: value ? 'flex-end' : 'flex-start'` moves it 20px between two
   * frames, and the track colour swapped on the same frame. That is the
   * clearest "this is a checkbox in a form" signal a settings screen can send,
   * on a screen whose caption says every switch should say what it does to
   * you.
   *
   * Translation and colour share `SELECT_MS`, so the switch reads as one
   * object moving rather than as a dot jumping while a background repaints.
   *
   * `interpolateColor` rather than two className states, for the same reason
   * the OptionCard wash is an overlay: Uniwind resolves classes to a
   * stylesheet and there is nothing to interpolate between two of them.
   */
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, {
      // Reduce Motion keeps the switch legible without sliding it: the colour
      // still crosses, the knob simply arrives.
      duration: reduceMotion ? 0 : SELECT_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress, reduceMotion]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [tokens.toggleTrackOff, on],
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    // 52 wide, 3 padding each side, 26 knob -> 20px of travel.
    transform: [{ translateX: progress.value * 20 }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [tokens.toggleKnobOff, tokens.toggleKnob],
    ),
  }));

  return (
    <>
      <Touchable
        onPress={() => onChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={hint ? `${label}. ${hint}` : label}
        className="flex-row items-center justify-between gap-[14px] px-5 py-[18px]"
      >
        <Labels label={label} hint={hint} />
        <Animated.View
          style={[
            {
              width: 52,
              height: 32,
              borderRadius: 16,
              padding: 3,
              justifyContent: 'center',
              alignItems: 'flex-start',
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[{ width: 26, height: 26, borderRadius: 13 }, knobStyle]}
          />
        </Animated.View>
      </Touchable>
      <Divider last={last} />
    </>
  );
}
