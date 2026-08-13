import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Orb } from './Orb';
import { Text } from '@/src/ui/Text';
import { useOrbAnimation } from './useOrbAnimation';

/**
 * The panic ending (e4).
 *
 * "Light coming back up in a room, slowly, from above. The emotional peak of
 * the product and visually almost nothing."
 *
 * ---------------------------------------------------------------------------
 * WHAT IS NOT ON THIS SCREEN, AND WILL NOT BE.
 *
 * No feeling check. No SUDS re-rating. No journaling offer. No streak, no
 * stat, no count, no "that's your third this week". No paywall. No share. No
 * rating prompt. Nothing that turns a minute someone survived into a number
 * (plan 07 T06, e4's caption, D-006).
 *
 * Until session 12 this path landed on `FeelingPicker` and could go on to a
 * journaling offer, because it shared `SessionScreen` with the ordinary
 * breathing session. It does not share it any more. The reason this screen is
 * its own component with two buttons and no stage machine is so that there is
 * nowhere for any of the above to be added without deleting this comment
 * first.
 * ---------------------------------------------------------------------------
 */

/** e4: half-faded, and breathing far slower than a person would. */
const ORB_SIZE = 128;
const ORB_OPACITY = 0.5;
/** The gap between the orb and the line. */
const STACK_GAP = 34;

export function PanicEnding({
  onExtend,
  onHome,
  reduceMotion,
}: {
  /** Omitted once the session has already been extended. Offered once. */
  onExtend?: () => void;
  onHome: () => void;
  reduceMotion: boolean;
}) {
  const { t } = useTranslation('breathing');
  const insets = useSafeAreaInsets();

  // No timeline. The orb here is not leading a breath any more -- it is just
  // still warm. `useOrbAnimation` with a null timeline settles it at rest.
  const animation = useOrbAnimation({
    timeline: null,
    paused: false,
    reduceMotion,
    onPhaseStart: () => {},
    onFinished: () => {},
  });

  return (
    <View className="flex-1 bg-ending">
      {/* The light from above. An ellipse anchored near the top, fading out
          by three-quarters of its height -- the whole visual event of the
          screen, and it is almost invisible, which is the point. */}
      <View pointerEvents="none" className="absolute left-0 right-0 top-0 h-[380px]">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="endingLight" cx="50%" cy="8%" rx="70%" ry="100%">
              <Stop offset="0%" stopColor="#E39A45" stopOpacity="0.22" />
              <Stop offset="74%" stopColor="#E39A45" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#endingLight)" />
        </Svg>
      </View>

      <View
        className="flex-1"
        style={{
          paddingTop: Math.max(insets.top, 20) + 80,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
          paddingHorizontal: 32,
        }}
      >
        <View
          className="flex-1 items-center justify-center"
          style={{ gap: STACK_GAP }}
        >
          <View style={{ opacity: ORB_OPACITY }}>
            <Orb animation={animation} size={ORB_SIZE} reduceMotion={reduceMotion} />
          </View>

          {/* The one sentence. Serif, because it is meant to be felt and not
              merely read (D-017) -- and it is the only thing this screen has
              to say. */}
          <Text
            variant="title"
            className="text-center text-[38px] leading-[48px]"
            accessibilityRole="header"
          >
            {t('panic.end')}
          </Text>
        </View>

        {/* Two identical targets. Leaving is never the smaller or the harder
            one, and neither is favoured -- no primary fill, no amber. Amber
            on this screen would read as a recommendation, and there is no
            right answer to recommend. */}
        <View className="w-full flex-row" style={{ gap: 12 }}>
          {onExtend ? (
            <EndingButton label={t('panic.longer')} onPress={onExtend} />
          ) : null}
          <EndingButton label={t('panic.home')} onPress={onHome} />
        </View>
      </View>
    </View>
  );
}

/**
 * e4's buttons. Their own surface pair, not `surface-quiet`.
 *
 * `#F1E7D6` is warmer than the quiet button's `#EFE5D8`: a button standing on
 * the ending ground is not the same material as a button standing on
 * `--background`. That distinction has been collapsed twice before and found
 * again both times by opening the design file.
 */
function EndingButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="h-16 flex-1 items-center justify-center rounded-[32px] border border-border-ending bg-surface-ending active:opacity-80"
    >
      <Text variant="control">{label}</Text>
    </Pressable>
  );
}
