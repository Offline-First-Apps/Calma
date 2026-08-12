import { duration, reducedMotion } from '@calma/tokens';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Screen transitions.
 *
 * 280ms, easing out, no bounce and no overshoot anywhere. Calma's metronome is
 * the orb's eleven-second breath; a screen that springs into place belongs to a
 * different app.
 *
 * Under Reduce Motion everything collapses to a cross-fade. Note that breath
 * *timing* is never reduced — the guidance has to stay usable, and slowing or
 * skipping it would break the one thing the app is for.
 */

export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduce(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce,
    );

    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}

export interface TransitionOptions {
  animation: 'slide_from_right' | 'fade';
  animationDuration: number;
}

export function transitionFor(reduce: boolean): TransitionOptions {
  return reduce
    ? { animation: 'fade', animationDuration: reducedMotion.transition }
    : { animation: 'slide_from_right', animationDuration: duration.transition };
}

/** Full-screen presentations rise from the bottom, or cross-fade. */
export function presentationFor(reduce: boolean): TransitionOptions {
  return reduce
    ? { animation: 'fade', animationDuration: reducedMotion.transition }
    : { animation: 'fade', animationDuration: duration.transition };
}
