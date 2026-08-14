import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/src/lib/motion';

import { pressTargets } from './press';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Every pressable surface in Calma, with the one animation that fires on every
 * interaction in the app.
 *
 * A DROP-IN FOR `Pressable`. Same props, same children, same accessibility —
 * so adopting it at a call site is deleting an `active:opacity-*` class and
 * changing one word. That was a deliberate design constraint: a press
 * primitive that needs its call sites rewritten is one that gets adopted at
 * four of them and forgotten at thirty.
 *
 * IT RUNS ENTIRELY ON THE UI THREAD.
 *
 * The shared value is written from the press handlers and read by a worklet;
 * no React state, no re-render, nothing for a busy JS thread to delay. That
 * matters most in exactly the place presses matter most — a screen where a
 * breathing timeline, an autosave and a repository read may all be in flight.
 *
 * NO STATE IN ZUSTAND, EVER (D-004). A store write during an inhale is a
 * dropped frame somebody can feel.
 *
 * THE ONE PLACE THIS IS NOT USED IS THE PANIC FAB.
 *
 * `PanicFab` has its own pulse and its own reasons, and layering a press
 * scale under a running ambient animation would mean two things owning one
 * transform. Rule 3 says nothing may be added to the panic path; that
 * includes something as small as this.
 */
export const Touchable = forwardRef<View, PressableProps & { className?: string }>(
  function Touchable({ onPressIn, onPressOut, style, ...props }, ref) {
    const reduceMotion = useReduceMotion();

    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    function animate(pressed: boolean) {
      const target = pressTargets(pressed, reduceMotion);
      const easing = Easing.out(Easing.quad);

      opacity.value = withTiming(target.opacity, {
        duration: target.durationMs,
        easing,
      });
      scale.value = withTiming(target.scale, {
        duration: target.durationMs,
        easing,
      });
    }

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressable
        ref={ref}
        onPressIn={(event) => {
          animate(true);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animate(false);
          onPressOut?.(event);
        }}
        style={[animatedStyle, style as never]}
        {...props}
      />
    );
  },
);
