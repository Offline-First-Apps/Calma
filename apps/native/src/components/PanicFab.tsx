import { amberGradient, amberGradientStops, ambientOrb, control } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Circle, Stop } from 'react-native-svg';
import { useUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';

import { playSound } from '@/src/lib/audio';
import { hapticPanic } from '@/src/lib/haptics';

/**
 * The panic button (e1).
 *
 * 72x72, amber, bottom-right, above the tab bar and inside the safe area. It
 * is the only element in Calma that is always on screen, and the one path that
 * must never be interrupted: no paywall, no permission prompt, no modal, ever
 * (systems/01-architecture.md, D-006).
 *
 * It breathes at rest on the same eleven-second cycle as the orb -- a much
 * smaller amplitude, enough to read as alive in peripheral vision without
 * asking for attention. A perfectly still button on a screen about anxiety
 * looks like a warning light.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Clearance so a list's last row is never trapped under the button. */
export const PANIC_FAB_CLEARANCE = 96;

/**
 * e1's two rings, as multiples of the button.
 *
 * The design draws them at 136 and 200 against a 72 button, both concentric
 * with it. Expressed as ratios so they stay right if `control.panicFab` ever
 * moves.
 */
const RINGS = [
  { scale: 136 / 72, opacity: { light: 0.4, dark: 0.38 }, duration: 620 },
  { scale: 200 / 72, opacity: { light: 0.2, dark: 0.18 }, duration: 820 },
] as const;

/**
 * A second tap inside this window is swallowed (plan 07 T07, review R1).
 *
 * Not a debounce for tidiness. The acknowledgement is instant, but the route
 * still takes a frame or two to mount, and a person mid-panic-attack who does
 * not see a screen change *immediately* taps again -- which without this guard
 * pushes a second `/panic` onto the stack, restarting the breath from zero and
 * leaving a session record behind that nobody breathed.
 */
const DOUBLE_FIRE_MS = 600;

export function PanicFab({
  reduceMotion = false,
  bottomOffset = 0,
}: {
  reduceMotion?: boolean;
  bottomOffset?: number;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('breathing');
  const { theme } = useUniwind();

  const isDark = theme === 'dark';
  const stops = isDark ? amberGradient.dark.fab : amberGradient.light.fab;
  const ringColor = isDark ? '209,146,73' : '227,154,69';

  const pulse = useSharedValue(0);
  const ring0 = useSharedValue(0);
  const ring1 = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    pulse.value = withRepeat(
      withTiming(1, {
        duration: ambientOrb.durationMs,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [pulse, reduceMotion]);

  const breathing = useAnimatedStyle(() => ({
    transform: reduceMotion
      ? []
      : [{ scale: interpolate(pulse.value, [0, 1], [0.98, 1.02]) }],
  }));

  const lastFire = useRef(0);

  /**
   * Fired on press-IN, not on press.
   *
   * `onPress` waits for the release and for the touch to be confirmed as not a
   * scroll. That is correct for every other button in the app and wrong for
   * this one: the drum, the haptic and the rings are the app saying "I heard
   * you", and they have to land on the same frame as the finger, before the
   * session screen mounts. The acknowledgement is never the result of the
   * navigation (T07).
   */
  const activate = useCallback(() => {
    const now = Date.now();
    if (now - lastFire.current < DOUBLE_FIRE_MS) return;
    lastFire.current = now;

    // The heaviest haptic in the app: it has to land through a shaking hand.
    // Both of these are fire-and-forget and neither is awaited -- nothing on
    // this path is allowed to wait for audio to load.
    hapticPanic();
    playSound('panic');

    if (!reduceMotion) {
      ring0.value = 0;
      ring1.value = 0;
      ring0.value = withTiming(1, {
        duration: RINGS[0].duration,
        easing: Easing.out(Easing.ease),
      });
      ring1.value = withTiming(1, {
        duration: RINGS[1].duration,
        easing: Easing.out(Easing.ease),
      });
    }

    router.push('/panic');
  }, [reduceMotion, ring0, ring1, router]);

  const ringStyle0 = useAnimatedStyle(() => ({
    opacity: interpolate(ring0.value, [0, 0.15, 1], [0, RINGS[0].opacity.light, 0]),
    transform: [{ scale: interpolate(ring0.value, [0, 1], [1, RINGS[0].scale]) }],
  }));

  const ringStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(ring1.value, [0, 0.15, 1], [0, RINGS[1].opacity.light, 0]),
    transform: [{ scale: interpolate(ring1.value, [0, 1], [1, RINGS[1].scale]) }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 20,
        bottom: Math.max(insets.bottom, 12) + bottomOffset + 16,
      }}
    >
      {/* The rings are concentric with the button and sit behind it, outside
          any clip. They are decoration only -- `pointerEvents="none"` so an
          expanding ring can never eat the second tap it was drawn for. */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: control.panicFab,
            height: control.panicFab,
            borderRadius: control.panicFab / 2,
            borderWidth: 1.5,
            borderColor: `rgba(${ringColor},1)`,
          },
          ringStyle1,
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: control.panicFab,
            height: control.panicFab,
            borderRadius: control.panicFab / 2,
            borderWidth: 1.5,
            borderColor: `rgba(${ringColor},1)`,
          },
          ringStyle0,
        ]}
      />

      <AnimatedPressable
        onPressIn={activate}
        accessibilityRole="button"
        // Named for what it does, not for what it is. Someone reaching for
        // this with a screen reader at 3am needs the outcome, not a noun --
        // and never the word "panic", which is not a thing to say to someone
        // who is having one.
        accessibilityLabel={t('panic.fabLabel')}
        accessibilityHint={t('panic.fabHint')}
        hitSlop={12}
        className="rounded-full items-center justify-center active:opacity-90"
        style={[
          breathing,
          {
            width: control.panicFab,
            height: control.panicFab,
            // The glow carries the accent's own colour, not a neutral grey.
            // This is the most important button in the app and in the designs
            // it is the only thing on the screen that looks lit.
            shadowColor: isDark ? '#D19249' : '#D68B36',
            shadowOpacity: isDark ? 0.6 : 0.8,
            shadowRadius: isDark ? 20 : 18,
            shadowOffset: { width: 0, height: 16 },
            elevation: 10,
          },
        ]}
      >
        {/* A three-stop gradient, brighter at both ends than the primary
            button's (d1). Drawn as a circle so no overflow clip is needed --
            clipping the container would clip the glow on Android. */}
        <Svg
          width={control.panicFab}
          height={control.panicFab}
          style={{ position: 'absolute' }}
        >
          <Defs>
            <LinearGradient id="panicFab" x1="0" y1="0" x2="0.38" y2="1">
              {stops.map((color, i) => (
                <Stop
                  key={color}
                  offset={`${amberGradientStops.fab[i]! * 100}%`}
                  stopColor={color}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill="url(#panicFab)" />
        </Svg>

        <View className="h-6 w-6 rounded-full bg-accent-foreground opacity-90" />
      </AnimatedPressable>
    </View>
  );
}
