import { clay, radius } from '@calma/tokens';
import { useTranslation } from 'react-i18next';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';
import { useUniwind } from 'uniwind';

import { playSound } from '@/src/lib/audio';
import { hapticWorryReleased } from '@/src/lib/haptics';
import { useReduceMotion } from '@/src/lib/motion';
import { Text } from '@/src/ui/Text';

/**
 * Release (f7).
 *
 * IT IS A MOVEMENT, NOT A BUTTON, AND THAT IS THE WHOLE DESIGN.
 *
 * The caption: "A real movement, not a button, because releasing by tap would
 * feel administrative." Letting go of something you were afraid of should
 * cost a deliberate gesture of the hand — and the gesture is upward, away,
 * matching the direction the card travels and the direction the ripple went
 * on capture.
 *
 * THE CARD DOES NOT GO ANYWHERE. IT STOPS BEING A THING.
 *
 * Also the caption: "it doesn't go somewhere, it stops being a thing". So it
 * disperses — rising, fading, and scaling very slightly out — rather than
 * sliding off an edge or flying into a bin. There is no destination in the
 * animation because there is no destination in the data: `markReleased`
 * removes it from the pending list and nothing archives it.
 *
 * NO UNDO, AND THE COPY DOES NOT PRETEND OTHERWISE.
 *
 * T15 requires a deliberate swipe past a threshold with a spring-back for an
 * incomplete one, and no undo. The honesty is the safety: an incomplete swipe
 * returns the card exactly where it was, so the only way to release is to
 * mean it. The words "delete", "archive" and "remove" appear nowhere.
 */

/** Fraction of the travel that commits. Past this, releasing the finger releases the worry. */
const COMMIT_FRACTION = 0.38;
/** Full travel distance for the gesture, in points. */
const TRAVEL = 260;
/** The scatter, per plan 08 T11. */
const SCATTER_MS = 1400;

export function TriageRelease({
  text,
  onReleased,
}: {
  text: string;
  /** Called once the scatter has finished and the record is gone. */
  onReleased: () => void;
}) {
  const { t } = useTranslation('worry');
  const { theme } = useUniwind();
  const reduceMotion = useReduceMotion();

  const rgb = theme === 'dark' ? clay.dark.ripple : clay.light.ripple;

  /** 0 at rest, 1 fully dispersed. Drives position, opacity and scale together. */
  const progress = useSharedValue(0);

  const commit = () => {
    hapticWorryReleased();
    void playSound('worryReleased');
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      // Upward only. A downward drag does nothing rather than pushing the
      // card into the bottom of the screen — there is no "put it back
      // harder", and the gesture should not suggest one.
      progress.value = Math.min(1, Math.max(0, -event.translationY / TRAVEL));
    })
    .onEnd(() => {
      if (progress.value >= COMMIT_FRACTION) {
        runOnJS(commit)();

        progress.value = withTiming(
          1,
          {
            duration: reduceMotion ? 200 : SCATTER_MS,
            easing: Easing.out(Easing.cubic),
          },
          (finished) => {
            'worklet';
            if (finished) runOnJS(onReleased)();
          },
        );
        return;
      }

      // Springs back to exactly where it was. An incomplete gesture is not a
      // partial release and leaves no trace of having been attempted.
      progress.value = withSpring(0, { damping: 18, stiffness: 140 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -progress.value * 180 },
      { scale: 1 - progress.value * 0.06 },
    ],
    opacity: 1 - progress.value,
  }));

  /** The motes drift up ahead of the card and fade first. */
  const moteStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 1.4,
    transform: [{ translateY: -progress.value * 60 }],
  }));

  return (
    <>
      <Text variant="headingSm" className="text-[26px] leading-[35px]">
        {t('window.release')}
      </Text>

      <View className="relative flex-1 items-center justify-center">
        <Animated.View
          style={moteStyle}
          className="absolute top-[18px] flex-row items-end gap-[26px]"
        >
          {/* Four, unevenly sized and unevenly raised. A regular row would
              read as a progress indicator, which this must never be. */}
          <Mote rgb={rgb} size={7} opacity={0.32} lift={0} />
          <Mote rgb={rgb} size={5} opacity={0.24} lift={16} />
          <Mote rgb={rgb} size={9} opacity={0.2} lift={6} />
          <Mote rgb={rgb} size={5} opacity={0.3} lift={22} />
        </Animated.View>

        <GestureDetector gesture={gesture}>
          <Animated.View
            accessibilityRole="button"
            accessibilityLabel={t('window.releaseLabel')}
            accessibilityHint={t('window.releaseAction')}
            // VoiceOver cannot swipe a card upward past a threshold, so the
            // gesture is also an activatable control for anyone using it.
            // A release that is only reachable by hand is a feature that
            // excludes the people most likely to be using a screen reader in
            // the dark.
            onAccessibilityTap={() => {
              commit();
              progress.value = withTiming(
                1,
                { duration: reduceMotion ? 200 : SCATTER_MS },
                (finished) => {
                  'worklet';
                  if (finished) runOnJS(onReleased)();
                },
              );
            }}
            style={[cardStyle, { borderRadius: radius.note }]}
            className="w-full border border-border-worry-quiet bg-surface-worry-quiet px-6 py-7"
          >
            <Text variant="headingSm" className="text-[26px] leading-[36px]">
              {text}
            </Text>
          </Animated.View>
        </GestureDetector>
      </View>

      <Text variant="bodySm" className="text-center text-secondary">
        {t('window.releaseAction')}
      </Text>
    </>
  );
}

function Mote({
  rgb,
  size,
  opacity,
  lift,
}: {
  rgb: string;
  size: number;
  opacity: number;
  lift: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        marginBottom: lift,
        backgroundColor: `rgba(${rgb},${opacity})`,
      }}
    />
  );
}
