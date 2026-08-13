import {
  type BreathLabel,
  type BreathTimeline,
  buildTimeline,
  cyclesForDuration,
  extendTimeline,
  getPattern,
} from '@calma/domain';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playSound, setBreathingSessionActive } from '@/src/lib/audio';
import { useReduceMotion } from '@/src/lib/motion';
import { Text } from '@/src/ui/Text';

import { Orb } from './Orb';
import { PanicEnding } from './PanicEnding';
import { useBreathHaptics } from './useBreathHaptics';
import { useOrbAnimation } from './useOrbAnimation';
import { useSession } from './useSession';

/**
 * The panic session (e2, e3, e4).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS NOT `SessionScreen` WITH A `panic` PROP.
 *
 * It was, until session 12, and the shared screen quietly broke three of the
 * rules this path exists to keep:
 *
 *   1. "I'm okay" routed through `StopConfirmation` -- someone in a panic
 *      attack tapped the way out and got asked whether they meant it. Plan 07
 *      T05 says "exits immediately with no confirmation"; e3's caption says
 *      "never delayed, never asking to confirm".
 *   2. Finishing ran `stage: 'feeling'` -> `FeelingPicker` -> and, depending
 *      on `shouldOfferJournaling`, a journaling offer. Plan 07 T06 and e4's
 *      caption both forbid every one of those on this path.
 *   3. It rendered on `--immersive`, a whole step brighter than e2's ground.
 *
 * None of those were written on purpose. They were inherited, one `if (panic)`
 * at a time, from a screen whose job is to ask questions -- and the panic path
 * is defined by not asking any. A shared component with an exception flag will
 * keep growing the exception; a separate component cannot express the idea of
 * a feeling check at all, which is the only version of this rule that survives
 * someone adding a stage to `SessionScreen` in a year (D-006).
 * ---------------------------------------------------------------------------
 *
 * NOTHING IS ASKED HERE. No intensity slider, no feeling check, no journaling
 * offer, no permission prompt, no paywall, no modal, ever. If you are adding
 * something to this file, that is the first thing to check it against.
 */

/** Short, because a session has to end before someone gives up on it. */
const PANIC_SECONDS = 60;
/** One tap of "A bit longer". Offered from the ending, never mid-breath. */
const EXTENSION_SECONDS = 60;

/** The orb at full size (e2/e3 draw it at 306 on a 412-wide frame). */
const ORB_SIZE = 306;
/** e2's gap between the orb, the line and the exit. */
const STACK_GAP = 44;

/**
 * The opening line's timing (T04).
 *
 * In, held, out. Four seconds is long enough to read twice at 3am and short
 * enough that it is gone before it becomes something to look at instead of
 * breathing. After it goes there is only the orb -- the screen gets emptier
 * as the session goes on, never fuller.
 */
const OPENING = { fadeIn: 900, hold: 4000, fadeOut: 1400 } as const;

export function PanicSession() {
  const { t } = useTranslation('breathing');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const session = useSession();

  // The screen must not sleep mid-breath. Someone following the orb is not
  // touching the screen, which is exactly what the idle timer watches for.
  useKeepAwake();

  const pattern = useMemo(() => getPattern('physiological-sigh'), []);

  const [timeline, setTimeline] = useState<BreathTimeline | null>(null);
  const [ended, setEnded] = useState(false);
  const [extended, setExtended] = useState(false);
  // Held so the phase callbacks stay cheap; nothing renders it. The panic
  // screen shows no phase word -- e2 has one line and then nothing.
  const labelRef = useRef<BreathLabel | null>(null);

  const haptics = useBreathHaptics(timeline);

  // --- the breath -------------------------------------------------------

  const onPhaseStart = useCallback(
    (index: number) => {
      haptics.onPhaseStart(index);
      const step = timeline?.steps[index];
      if (step?.labelChanges) labelRef.current = step.label;
    },
    [haptics, timeline],
  );

  const onFinished = useCallback(() => {
    haptics.onFinished();
    // The bowl, once, as the session closes. The only sound permitted while a
    // session is running.
    playSound('sessionEnd');
    setEnded(true);
  }, [haptics]);

  const animation = useOrbAnimation({
    timeline: ended ? null : timeline,
    paused: false,
    reduceMotion,
    onPhaseStart,
    onFinished,
  });

  // --- lifecycle --------------------------------------------------------

  // Panic never asks, so the breath starts the moment the screen mounts.
  //
  // Guarded by a ref rather than an empty dependency array: rebuilding the
  // timeline would restart the breath from zero underneath someone who is
  // already following it.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const cycles = cyclesForDuration(pattern, PANIC_SECONDS);
    setTimeline(buildTimeline(pattern, cycles));
    session.begin({
      pattern: 'physiological-sigh',
      entryPoint: 'panic',
      // A skipped rating is null, never 0 (D-007). Nobody is asked here, so
      // there is nothing to record but the absence.
      preSuds: null,
    });
  }, [pattern, session]);

  useEffect(() => {
    setBreathingSessionActive(!ended);
    return () => setBreathingSessionActive(false);
  }, [ended]);

  const leave = useCallback(() => {
    setBreathingSessionActive(false);
    // `replace`, not `back`. A second tap of the panic button while this
    // screen was mounting can leave two /panic entries on the stack, and
    // going "back" from the way out onto another panic session is the exact
    // trap this button exists to be the opposite of.
    router.replace('/(tabs)');
  }, [router]);

  /**
   * "I'm okay" -- the way out, from any state, in one tap.
   *
   * No confirmation, no "are you sure", no pause. The partial session is
   * still written, `completed: false`, because a minute someone actually
   * spent breathing happened whether or not they finished it.
   *
   * Idempotent: a double-tap on the exit must not write two records.
   */
  const leaving = useRef(false);
  const dismiss = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;

    if (timeline !== null) {
      void session.finish(timeline, session.elapsed(), false, null);
    }
    leave();
  }, [timeline, session, leave]);

  /** The ending's "Home". The session ran its length, so it completed. */
  const finish = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;

    if (timeline !== null) {
      // `postFeeling` is null and always will be. There is no feeling check on
      // this path, and null is the honest record of a question never asked.
      void session.finish(timeline, timeline.duration, true, null);
    }
    leave();
  }, [timeline, session, leave]);

  /** The ending's "A bit longer". Offered once. */
  const extend = useCallback(() => {
    setExtended(true);
    haptics.reset();
    setTimeline((current) =>
      current === null
        ? null
        : extendTimeline(
            pattern,
            current,
            cyclesForDuration(pattern, EXTENSION_SECONDS),
          ),
    );
    setEnded(false);
  }, [haptics, pattern]);

  // --- the opening line -------------------------------------------------

  const openingOpacity = useSharedValue(0);

  useEffect(() => {
    if (ended) return;

    if (reduceMotion) {
      // Shorten rather than remove: the line still appears and still goes.
      // Someone who has asked for less motion has not asked for less help.
      openingOpacity.value = 1;
      openingOpacity.value = withDelay(
        OPENING.hold,
        withTiming(0, { duration: 200 }),
      );
      return;
    }

    openingOpacity.value = withSequence(
      withTiming(1, {
        duration: OPENING.fadeIn,
        easing: Easing.out(Easing.ease),
      }),
      withDelay(
        OPENING.hold,
        withTiming(0, {
          duration: OPENING.fadeOut,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
    );
  }, [ended, reduceMotion, openingOpacity]);

  const openingStyle = useAnimatedStyle(() => ({
    opacity: openingOpacity.value,
  }));

  // --- render -----------------------------------------------------------

  if (ended) {
    return (
      <PanicEnding
        onExtend={extended ? undefined : extend}
        onHome={finish}
        reduceMotion={reduceMotion}
      />
    );
  }

  return (
    <View
      className="flex-1 bg-panic"
      style={{
        paddingTop: Math.max(insets.top, 20),
        paddingBottom: Math.max(insets.bottom, 16) + 30,
        paddingHorizontal: 32,
      }}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{ gap: STACK_GAP }}
      >
        <Orb animation={animation} size={ORB_SIZE} reduceMotion={reduceMotion} />

        {/* One line, then it goes. `pointerEvents="none"` so a faded-out
            line can never sit in front of the exit and swallow a tap. */}
        <Animated.View pointerEvents="none" style={openingStyle}>
          <Text
            variant="headingSm"
            className="text-center text-[29px] leading-[40px] text-panic-foreground"
          >
            {t('panic.opening')}
          </Text>
        </Animated.View>

        <PanicExit onPress={dismiss} label={t('panic.dismiss')} />
      </View>
    </View>
  );
}

/**
 * "I'm okay" (e2, e3).
 *
 * A translucent wash with a hairline edge, not a fill -- unmistakably there
 * without competing with the orb for the eye. Present from the first second,
 * never faded in, never delayed, and it does not confirm.
 *
 * Deliberately NOT a `Button` variant. Adding `panicExit` to the app's button
 * vocabulary would let this styling -- and the no-confirmation behaviour it
 * signals -- be reused on a screen where stopping should be a considered
 * choice. It is one control on one path.
 */
function PanicExit({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      // Big, because the hand pressing it is shaking.
      hitSlop={16}
      className="h-[60px] items-center justify-center rounded-[30px] border border-border-panic-exit bg-surface-panic-exit px-[34px] active:opacity-80"
      style={{ marginTop: 6 }}
    >
      <Text variant="control" className="text-panic-exit-foreground">
        {label}
      </Text>
    </Pressable>
  );
}
