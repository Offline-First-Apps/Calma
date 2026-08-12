import { clay } from '@calma/tokens';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { useReduceMotion } from '@/src/lib/motion';

/**
 * Three rings settling where the worry was (f3).
 *
 * A pebble into still water — the same image as the sound that plays with it,
 * which is why they are one event rather than two things scheduled to agree.
 *
 * The rings expand OUTWARD from nothing and fade, rather than contracting
 * inward. Outward is something being let go of; inward would read as
 * something being swallowed, and the difference is the whole feeling of the
 * screen.
 */

/** Outer to inner, with the opacity each ring carries at rest (f3). */
const RINGS = [
  { size: 150, opacity: 0.22, delay: 0 },
  { size: 96, opacity: 0.3, delay: 90 },
  { size: 46, opacity: 0.4, delay: 180 },
] as const;

export function Ripple() {
  const { theme } = useUniwind();
  const rgb = theme === 'dark' ? clay.dark.ripple : clay.light.ripple;

  return (
    <View className="items-center justify-center">
      {RINGS.map((ring) => (
        <Ring key={ring.size} rgb={rgb} {...ring} />
      ))}
    </View>
  );
}

function Ring({
  size,
  opacity,
  delay,
  rgb,
}: {
  size: number;
  opacity: number;
  delay: number;
  rgb: string;
}) {
  const progress = useSharedValue(0);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      // Reduce Motion gets the rings at rest rather than no rings at all:
      // the confirmation still reads, it just does not travel. Removing the
      // feedback entirely would leave someone who needs motion reduced with
      // less certainty that their worry was taken, not more.
      progress.value = 1;
      return;
    }

    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + progress.value * 0.6 }],
    opacity: progress.value,
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: `rgba(${rgb},${opacity})`,
        },
      ]}
    />
  );
}
