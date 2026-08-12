import { OPACITY_EXHALED, OPACITY_INHALED, SCALE_EXHALED, SCALE_INHALED } from '@calma/domain';
import { Image, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import type { OrbAnimation } from './useOrbAnimation';

/**
 * THE ORB.
 *
 * Four layers, and every one of them is load-bearing:
 *
 *   1. HALO   -- the same gradient at low opacity on a larger radius, running
 *                ~120ms behind the breath. The lag is what makes the edge feel
 *                like it belongs to something alive rather than to a shape
 *                being resized.
 *   2. BODY   -- the core gradient. Warm cream at the centre through amber to
 *                nothing at the rim.
 *   3. HIGHLIGHT -- offset up and left, so there is an implied light source in
 *                the room and the orb has a top.
 *   4. GRAIN  -- a static, very low-opacity noise texture. This is the layer
 *                that stops it looking like a CSS circle, and it is the one
 *                most likely to be dropped as "surely nobody notices". People
 *                do not notice it; they notice its absence.
 *
 * WHY THE EDGES ARE GRADIENT STOPS AND NOT A BLUR. The designs achieve their
 * soft edge with `filter: blur(18px)`. React Native SVG has no equivalent that
 * is cheap enough to run at 60fps on a mid-range Android, and a real blur on
 * the largest moving element on screen is the fastest way to make a breathing
 * app stutter. Fading each gradient to zero alpha well before its own radius
 * gets the same soft, unresolvable edge for free. The last stop of every
 * gradient is transparent for exactly this reason -- do not "tidy" it away.
 *
 * NOTHING HERE HOLDS STATE. Scale, opacity and colour are all read from shared
 * values on the UI thread (D-004). This component re-renders when the size or
 * the theme changes, and at no other time -- not once per phase, and certainly
 * not once per frame.
 */

const AnimatedView = Animated.createAnimatedComponent(View);

/** Halo radius as a multiple of the body's. */
const HALO_SCALE = 1.35;
/** Peak halo opacity. Above ~0.4 the orb starts to read as two circles. */
const HALO_OPACITY = 0.35;
/** Grain strength. Deliberately almost invisible. */
const GRAIN_OPACITY = 0.055;

export interface OrbProps {
  animation: OrbAnimation;
  /** Body diameter in points. The halo draws outside this. */
  size?: number;
  reduceMotion?: boolean;
  /**
   * Dims the whole orb without stopping it. Used while "Stop here?" is up:
   * the orb keeps breathing behind the question, so the question does not
   * end the session before the answer does.
   */
  dimmed?: boolean;
}

export function Orb({
  animation,
  size = 320,
  reduceMotion = false,
  dimmed = false,
}: OrbProps) {
  const { breath, haloBreath, drift } = animation;

  const bodyStyle = useAnimatedStyle(() => {
    const t = interpolate(
      breath.value,
      [SCALE_EXHALED, SCALE_INHALED],
      [0, 1],
      'clamp',
    );

    // Under Reduce Motion the orb does not change size at all. It brightens
    // and warms instead, on exactly the same schedule -- the breath is still
    // fully followable, which is the whole requirement. Someone who cannot
    // tolerate motion still gets the guidance, not a degraded version of it.
    if (reduceMotion) {
      return {
        transform: [{ scale: 1 }],
        opacity: interpolate(t, [0, 1], [0.62, 1]),
        backgroundColor: interpolateColor(t, [0, 1], ['#E39A45', '#F8DFB2']),
      };
    }

    return {
      transform: [{ scale: breath.value * drift.value }],
      opacity: interpolate(t, [0, 1], [OPACITY_EXHALED, OPACITY_INHALED]),
      backgroundColor: 'transparent',
    };
  });

  const haloStyle = useAnimatedStyle(() => {
    const t = interpolate(
      haloBreath.value,
      [SCALE_EXHALED, SCALE_INHALED],
      [0, 1],
      'clamp',
    );

    if (reduceMotion) {
      return { transform: [{ scale: 1 }], opacity: HALO_OPACITY * (0.6 + t * 0.4) };
    }

    return {
      transform: [{ scale: haloBreath.value * drift.value }],
      opacity: HALO_OPACITY * interpolate(t, [0, 1], [0.75, 1]),
    };
  });

  const halo = size * HALO_SCALE;
  const inset = (halo - size) / 2;

  return (
    <View
      style={{
        width: halo,
        height: halo,
        alignItems: 'center',
        justifyContent: 'center',
        // Dimming lives on the container so the halo dims with the body and
        // the two never separate into two shapes.
        opacity: dimmed ? 0.5 : 1,
      }}
      // The orb itself is decorative. The phase LABEL is what announces the
      // breath to a screen reader, because a live region on a shape that
      // changes sixty times a second would be unusable.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {/* 1. Halo */}
      <AnimatedView
        style={[{ position: 'absolute', width: halo, height: halo }, haloStyle]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="orbHalo" cx="50%" cy="48%" r="50%">
              <Stop offset="0%" stopColor="#E39A45" stopOpacity="0.44" />
              <Stop offset="42%" stopColor="#E39A45" stopOpacity="0.22" />
              <Stop offset="68%" stopColor="#E39A45" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#orbHalo)" />
        </Svg>
      </AnimatedView>

      {/* 2 + 3. Body and highlight, and 4. grain over both */}
      <AnimatedView
        style={[
          {
            position: 'absolute',
            top: inset,
            left: inset,
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          bodyStyle,
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="orbBody" cx="50%" cy="42%" r="50%">
              <Stop offset="0%" stopColor="#F8DFB2" />
              <Stop offset="40%" stopColor="#EFB86E" />
              <Stop offset="66%" stopColor="#E39A45" />
              {/* Transparent well inside the radius. This IS the soft edge. */}
              <Stop offset="84%" stopColor="#E39A45" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="orbHighlight" cx="46%" cy="36%" r="42%">
              <Stop offset="0%" stopColor="#FFF8EB" stopOpacity="0.92" />
              <Stop offset="58%" stopColor="#F7D49E" stopOpacity="0.34" />
              <Stop offset="78%" stopColor="#F7D49E" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#orbBody)" />
          <Circle cx="50%" cy="50%" r="34%" fill="url(#orbHighlight)" />
        </Svg>

        {/*
          Grain. Tiled rather than stretched: a 128px texture scaled to 320
          becomes soft blobs, which is the opposite of the point. It does not
          animate -- the grain belongs to the surface, and a surface whose
          texture swims is a surface made of liquid.
        */}
        <Image
          source={require('@/assets/images/grain.png')}
          resizeMode="repeat"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: GRAIN_OPACITY,
          }}
        />
      </AnimatedView>
    </View>
  );
}
