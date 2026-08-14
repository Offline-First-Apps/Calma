import { duration as motionDuration } from '@calma/tokens';
import { type ReactNode, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/src/lib/motion';

/**
 * The entrance every screen's content shares.
 *
 * WHAT THIS IS FOR. The owner's first run: everything appeared instantly and
 * fully formed, which reads as abrupt on screens whose whole register is
 * unhurried — the orb breathes at eleven seconds and the copy around it
 * arrived like a page load. Content that settles in gives the screen the same
 * pace as the thing it is asking someone to do.
 *
 * WHAT IT IS NOT. No spring, no bounce, no overshoot, no scale-up-from-small,
 * nothing sliding in from the side. `systems/03` forbids all of them and the
 * reason is not taste: an element that overshoots has to correct itself, and
 * a correction is a small visual surprise. This app cannot afford surprises.
 *
 * So: opacity, plus a few points of upward travel. That is the whole vocabulary.
 *
 * STAGGERED BY DEFAULT, because a screen where six things fade in together is
 * one thing fading in. `index` shifts the start so the eye lands on the top of
 * the screen first and reads downward, which is the order the copy was
 * written to be read in.
 */

/** Short enough to be over before it is noticed as an animation. */
const FADE_MS = 320;
/** Between staggered siblings. Six items land inside half a second. */
export const STAGGER_MS = 55;
/** Points of upward drift. More than this reads as a slide. */
const RISE = 10;

export function Enter({
  children,
  index = 0,
  delay = 0,
  /** Set false where a parent already animates, to avoid double motion. */
  enabled = true,
  className,
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  enabled?: boolean;
  className?: string;
}) {
  const reduceMotion = useReduceMotion();
  const progress = useSharedValue(enabled ? 0 : 1);

  useEffect(() => {
    if (!enabled) return;

    progress.value = withDelay(
      delay + index * STAGGER_MS,
      withTiming(1, {
        // Under Reduce Motion this becomes a plain cross-fade with no travel,
        // rather than nothing at all: the content still needs to not snap.
        duration: reduceMotion ? motionDuration.transition : FADE_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [delay, enabled, index, progress, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: reduceMotion ? 0 : (1 - progress.value) * RISE },
    ],
  }));

  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  );
}
