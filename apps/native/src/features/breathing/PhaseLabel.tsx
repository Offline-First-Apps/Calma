import type { BreathLabel } from '@calma/domain';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/src/ui/Text';

/**
 * The one word beneath the orb.
 *
 * NEVER A COUNTDOWN. Not "4... 3... 2...", not a shrinking ring, not a
 * progress bar. Counting down is a stress cue -- it turns a breath into a
 * deadline, and the entire screen exists to do the opposite. Someone who
 * wants to know how long is left is someone who has stopped breathing and
 * started waiting.
 *
 * THE CROSS-FADE IS THE POINT. A word that snaps between states draws the eye
 * away from the orb; a word that fades through gives the orb the attention
 * and lets the label be read peripherally. The fade is deliberately faster
 * out than in, so there is never a moment showing two overlapping words.
 *
 * SERIF, BECAUSE IT IS MEANT TO BE FELT (D-017). "Breathe out" in Figtree
 * reads like a system instruction. In Newsreader it reads like someone
 * saying it to you.
 */

const FADE_OUT_MS = 160;
const FADE_IN_MS = 260;

export interface PhaseLabelProps {
  label: BreathLabel | null;
  /** Hidden while a question is up, so the orb is the only thing moving. */
  hidden?: boolean;
}

/** i18n keys. `secondInhale` has its own line, not a repeat of "Breathe in". */
const KEYS: Record<BreathLabel, string> = {
  inhale: 'phase.inhale',
  secondInhale: 'sigh.second',
  holdFull: 'phase.holdFull',
  exhale: 'phase.exhale',
  holdEmpty: 'phase.holdEmpty',
};

export function PhaseLabel({ label, hidden = false }: PhaseLabelProps) {
  const { t } = useTranslation('breathing');
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (label === null || hidden) {
      opacity.value = withTiming(0, { duration: FADE_OUT_MS });
      return;
    }

    // Out, then in. React has already swapped the text by the time the fade
    // runs, so this reads as the previous word leaving and the new one
    // arriving even though only one element ever exists.
    opacity.value = withSequence(
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.ease) }),
    );
  }, [label, hidden, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const text = label === null ? '' : t(KEYS[label]);

  return (
    <Animated.View
      style={style}
      // THIS is how the breathing guidance reaches VoiceOver and TalkBack.
      // The orb is marked decorative precisely so this can be the single
      // announcement -- a live region on a shape changing sixty times a
      // second would be unusable, and a session that cannot be followed with
      // your eyes shut fails one of the app's stated goals.
      //
      // `polite` and not `assertive`: the announcement should wait its turn
      // rather than interrupt whatever the person is already being told.
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessible
      accessibilityLabel={text}
    >
      <Text variant="title" className="text-center">
        {text}
      </Text>
    </Animated.View>
  );
}
