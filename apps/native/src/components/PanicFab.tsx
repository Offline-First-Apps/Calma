import { amberGradient, amberGradientStops, ambientOrb, control } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
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

/**
 * The panic button.
 *
 * 72×72, amber, bottom-right, above the tab bar and inside the safe area. It
 * is the only element in Calma that is always on screen, and the one path that
 * must never be interrupted: no paywall, no permission prompt, no modal, ever
 * (systems/01-architecture.md, D-006).
 *
 * It breathes at rest on the same eleven-second cycle as the orb — a much
 * smaller amplitude, enough to read as alive in peripheral vision without
 * asking for attention. A perfectly still button on a screen about anxiety
 * looks like a warning light.
 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Clearance so a list's last row is never trapped under the button. */
export const PANIC_FAB_CLEARANCE = 96;

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

  const pulse = useSharedValue(0);

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

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 20,
        bottom: Math.max(insets.bottom, 12) + bottomOffset + 16,
      }}
    >
      <AnimatedPressable
        onPress={() => router.push('/panic')}
        accessibilityRole="button"
        // Named for what it does, not for what it is. Someone reaching for
        // this with a screen reader at 3am needs the outcome, not a noun —
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
