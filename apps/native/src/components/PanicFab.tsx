import { ambientOrb } from '@calma/tokens';
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
        className="h-[72px] w-[72px] rounded-full bg-accent active:bg-accent-pressed items-center justify-center"
        style={[
          breathing,
          {
            shadowColor: '#E39A45',
            shadowOpacity: 0.35,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          },
        ]}
      >
        <View className="h-6 w-6 rounded-full bg-accent-foreground opacity-90" />
      </AnimatedPressable>
    </View>
  );
}
