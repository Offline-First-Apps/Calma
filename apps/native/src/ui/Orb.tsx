import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

/**
 * THE ORB. The single most important visual in the app.
 *
 * Three stacked, blurred radial layers — NOT a circle with a gradient. The
 * offset highlight and the heavy blur are what make it read as alive rather
 * than as a div. Structure taken from designs/extracted/b1-welcome-light.html:
 *
 *   glow      inset -56  rgba(227,154,69,0.38) → 0 @68%   blur 34
 *   body      inset  22  #F8DFB2 → #EFB86E 40% → #E39A45 66% → 0 84%  blur 17
 *   highlight inset  84  rgba(255,248,235,0.92) → 0 78%   blur 22, offset 46/36
 *
 * Ambient loop is 11s peaking at 46%, so the inhale is marginally shorter than
 * the exhale — as a settled breath actually is. It is NEVER perfectly still: a
 * static orb reads as frozen, and frozen reads as broken.
 *
 * All animation runs on the UI thread. Never drive this from Zustand or a JS
 * timer — a store write during an inhale is a dropped frame the user can feel.
 */
const AnimatedView = Animated.createAnimatedComponent(View);

export function Orb({ size = 300, reduceMotion = false }: { size?: number; reduceMotion?: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [t]);

  // Under Reduce Motion the orb shifts opacity instead of scaling. Breath
  // TIMING is unchanged — the guidance must remain fully usable.
  const body = useAnimatedStyle(() => ({
    transform: reduceMotion ? [] : [{ scale: interpolate(t.value, [0, 1], [0.93, 1.07]) }],
    opacity: reduceMotion ? interpolate(t.value, [0, 1], [0.82, 1]) : 1,
  }));

  const glow = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0, 1], [0.72, 1]) }));

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no">
      <AnimatedView style={[{ position: 'absolute', inset: -Math.round(size * 0.187) }, glow]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="48%" r="50%">
              <Stop offset="0%" stopColor="#E39A45" stopOpacity="0.38" />
              <Stop offset="68%" stopColor="#E39A45" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#glow)" />
        </Svg>
      </AnimatedView>

      <AnimatedView style={[{ position: 'absolute', inset: Math.round(size * 0.073) }, body]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="body" cx="50%" cy="42%" r="50%">
              <Stop offset="0%" stopColor="#F8DFB2" />
              <Stop offset="40%" stopColor="#EFB86E" />
              <Stop offset="66%" stopColor="#E39A45" />
              <Stop offset="84%" stopColor="#E39A45" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="hl" cx="46%" cy="36%" r="42%">
              <Stop offset="0%" stopColor="#FFF8EB" stopOpacity="0.92" />
              <Stop offset="58%" stopColor="#F7D49E" stopOpacity="0.34" />
              <Stop offset="78%" stopColor="#F7D49E" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#body)" />
          <Circle cx="50%" cy="50%" r="34%" fill="url(#hl)" />
        </Svg>
      </AnimatedView>
    </View>
  );
}
