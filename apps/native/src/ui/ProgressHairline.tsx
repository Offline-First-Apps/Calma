import { duration } from '@calma/tokens';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/src/lib/motion';

/**
 * DELIBERATE EXCEPTION to the app-wide ban on progress indicators
 * (plans/17-screens.md bans them; systems/11-onboarding.md carves this out).
 *
 * The reasoning differs by context and the difference is the whole argument.
 * In a breathing session a progress indicator turns rest into a task being
 * completed. In onboarding, NOT knowing how much is left is its own low-grade
 * anxiety, and reducing that is exactly what this app is for.
 *
 * IT TAKES A FRACTION, NOT A STEP NUMBER, AND THAT IS ON PURPOSE.
 *
 * The obvious implementation is `step / total`. The designs are not linear:
 * 18, 38, 48, 58, 72, 84, 92, 99. The designer's note on b5 says what the
 * curve is for — "the hairline has moved about a finger's width in five
 * screens: enough to sense position, nowhere near enough to count." A linear
 * bar invites arithmetic. This one resists it, and it never reaches 100, so
 * the last screen is not a finish line either.
 *
 * The fractions live in `packages/domain/src/onboarding/machine.ts` beside
 * the steps they belong to. Keeping them there is what stops someone
 * "simplifying" this back into a division.
 *
 * 3px and a near-invisible track, from the b-screens. Hidden from
 * accessibility entirely: a screen reader announcing "38 percent" would be
 * the spoken step count the system doc explicitly rules out.
 *
 * IT GROWS RATHER THAN JUMPING, AND THAT IS WHAT MAKES THE CURVE VISIBLE.
 *
 * The width used to change between two frames, which threw away the one thing
 * the non-linear fractions are for: 18 to 38 and 92 to 99 are very different
 * distances, and a jump communicates neither. Growing over the step's own
 * cross-fade turns the hairline into a thing that moved a finger's width,
 * which is exactly the sensation the b5 caption asks for.
 *
 * Under Reduce Motion it still moves, only faster — a bar that teleports is
 * not "less motion", it is a different and worse animation.
 */
export function ProgressHairline({ fraction }: { fraction: number }) {
  const clamped = Math.max(0, Math.min(1, fraction));
  const reduceMotion = useReduceMotion();

  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, {
      // Matched to the step cross-fade, so the bar arrives with the screen
      // rather than after it.
      duration: reduceMotion ? 140 : duration.transition,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, reduceMotion, width]);

  const style = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      className="h-[3px] w-full overflow-hidden rounded-[2px] bg-hairline-track"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View className="h-full rounded-[2px] bg-accent" style={style} />
    </View>
  );
}
