import {
  type BreathLabel,
  type BreathingEntryPoint,
  type BreathingPatternId,
  type BreathTimeline,
  type CustomRatio,
  type PostFeeling,
  buildTimeline,
  cyclesForDuration,
  extendTimeline,
  getPattern,
} from '@calma/domain';
import { useNavigation, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { playSound, setBreathingSessionActive } from '@/src/lib/audio';
import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

import { FeelingPicker } from './FeelingPicker';
import { Orb } from './Orb';
import { PhaseLabel } from './PhaseLabel';
import { SudsSlider } from './SudsSlider';
import { useBreathHaptics } from './useBreathHaptics';
import { useOrbAnimation } from './useOrbAnimation';
import { shouldOfferJournaling, useSession } from './useSession';

/**
 * A breathing session, start to finish.
 *
 * THE SCREEN IS EMPTY ON PURPOSE. One orb, one word, nothing else. No timer,
 * no progress ring, no cycle count, no chrome, no "calm" button. Every one of
 * those is a thing to look at instead of breathing, and a progress indicator
 * in particular converts a breath into a wait.
 *
 * The only permanent control is the way out, and it is always visible. Never
 * trap someone in a screen; least of all this one.
 *
 * THE STAGES. intensity -> breathing -> extend? -> feeling -> journal offer?
 * Panic skips intensity entirely and never asks it.
 */

/** Default session length when the caller does not specify. */
const DEFAULT_SECONDS = 180;
/** The panic session. Short, because it has to end before someone gives up on it. */
const PANIC_SECONDS = 60;
/** One tap of "A bit longer" adds this much, once. */
const EXTENSION_SECONDS = 60;

/**
 * Orb size and the gap beneath it, per state, straight from the designs.
 *
 * These are not one shared value. The orb shrinks and the gap opens as
 * something is asked of the person: 320/46 while breathing (d3), 268/48 while
 * the extension is offered (d5), 240/54 and half-faded behind "Stop here?"
 * (d4). The orb giving up room to the question is how the screen shows it is
 * listening, so the numbers are worth keeping exact.
 */
const LAYOUT = {
  breathing: { orb: 320, gap: 46 },
  extend: { orb: 268, gap: 48 },
  stopping: { orb: 240, gap: 54 },
} as const;

type Stage = 'intensity' | 'breathing' | 'extend' | 'feeling' | 'offer';

export interface SessionScreenProps {
  pattern: BreathingPatternId;
  customRatio?: CustomRatio;
  entryPoint: BreathingEntryPoint;
  /** Target length. Rounded DOWN to whole cycles by `cyclesForDuration`. */
  targetSeconds?: number;
  /**
   * The panic path. Turns off the intensity question, shortens the session,
   * and puts an opening line above the orb.
   *
   * There is no paywall, no permission prompt and no modal on this path, ever
   * (D-006). If you are adding something to this screen, that rule is the
   * first thing to check it against.
   */
  panic?: boolean;
}

export function SessionScreen({
  pattern,
  customRatio,
  entryPoint,
  targetSeconds,
  panic = false,
}: SessionScreenProps) {
  const { t } = useTranslation(['breathing', 'common']);
  const router = useRouter();
  const navigation = useNavigation();
  const reduceMotion = useReduceMotion();
  const session = useSession();

  // The screen must not sleep mid-breath. Someone following the orb is not
  // touching the screen, which is exactly what the idle timer watches for.
  useKeepAwake();

  const breathingPattern = useMemo(
    () => getPattern(pattern, customRatio),
    [pattern, customRatio],
  );

  const seconds = targetSeconds ?? (panic ? PANIC_SECONDS : DEFAULT_SECONDS);

  const [timeline, setTimeline] = useState<BreathTimeline | null>(null);
  const [stage, setStage] = useState<Stage>(panic ? 'breathing' : 'intensity');
  const [label, setLabel] = useState<BreathLabel | null>(null);
  const [preSuds, setPreSuds] = useState<number | null>(null);
  const [postFeeling, setPostFeeling] = useState<PostFeeling | null>(null);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [extended, setExtended] = useState(false);

  const haptics = useBreathHaptics(timeline);

  // --- the breath -------------------------------------------------------

  const onPhaseStart = useCallback(
    (index: number) => {
      haptics.onPhaseStart(index);
      const step = timeline?.steps[index];
      // Only phases that change the word touch React at all. A hold does not
      // re-render anything, and neither does the sigh's micro-hold.
      if (step?.labelChanges) setLabel(step.label);
    },
    [haptics, timeline],
  );

  const onFinished = useCallback(() => {
    haptics.onFinished();
    // The extension is offered once. Asking twice would turn "want to keep
    // going?" into a thing to get past.
    setStage(extended ? 'feeling' : 'extend');
  }, [haptics, extended]);

  const animation = useOrbAnimation({
    timeline: stage === 'breathing' || stage === 'extend' ? timeline : null,
    // The orb keeps breathing behind "Stop here?" -- the question must not
    // end the session before the answer does.
    paused: false,
    reduceMotion,
    onPhaseStart,
    onFinished,
  });

  // --- lifecycle --------------------------------------------------------

  const startBreathing = useCallback(
    (suds: number | null) => {
      const cycles = cyclesForDuration(breathingPattern, seconds);
      setPreSuds(suds);
      setTimeline(buildTimeline(breathingPattern, cycles));
      session.begin({ pattern, customRatio, entryPoint, preSuds: suds });
      setStage('breathing');
    },
    [breathingPattern, seconds, session, pattern, customRatio, entryPoint],
  );

  // Panic never asks, so it starts the moment the screen mounts.
  //
  // Guarded by a ref rather than an empty dependency array: `startBreathing`
  // is not referentially stable, and re-running this effect would rebuild the
  // timeline and restart the breath from zero underneath someone who is
  // already following it.
  const started = useRef(false);
  useEffect(() => {
    if (!panic || started.current) return;
    started.current = true;
    startBreathing(null);
  }, [panic, startBreathing]);

  // Nothing in the app makes a sound while a session is running, except the
  // bowl that ends it. Flagged centrally so no call site has to know.
  useEffect(() => {
    setBreathingSessionActive(stage === 'breathing' || stage === 'extend');
    return () => setBreathingSessionActive(false);
  }, [stage]);

  const close = useCallback(() => {
    setBreathingSessionActive(false);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  /**
   * Ends the session.
   *
   * The write happens exactly once, and where it happens depends on how the
   * session ended:
   *
   *   - stopped early -> written here, `completed: false`, `postFeeling: null`,
   *     and the person leaves. Someone who just asked to stop is not then
   *     asked to rate the thing they stopped.
   *   - ran to the end -> NOT written here. The feeling check writes it, so
   *     the answer lands in the same record rather than as a second row.
   */
  const endSession = useCallback(
    async (completed: boolean) => {
      if (timeline === null) {
        close();
        return;
      }

      if (completed) {
        // The bowl plays once, as the session closes. It is the only sound
        // in the whole app permitted during a breathing session.
        playSound('sessionEnd');
        setStage('feeling');
        return;
      }

      await session.finish(timeline, session.elapsed(), false, null);
      close();
    },
    [timeline, session, close],
  );

  /** The feeling check is the last thing that happens, so it does the write. */
  const submitFeeling = useCallback(
    async (feeling: PostFeeling | null) => {
      setPostFeeling(feeling);

      if (timeline !== null) {
        await session.finish(timeline, timeline.duration, true, feeling);
      }

      if (shouldOfferJournaling({ preSuds, postFeeling: feeling })) {
        setStage('offer');
      } else {
        close();
      }
    },
    [timeline, session, preSuds, close],
  );

  // --- back and swipe-down ----------------------------------------------

  useEffect(() => {
    // Mid-session, leaving asks first. Not because the session matters more
    // than the person's choice -- it does not -- but because a swipe caught
    // by a shaking hand should not silently discard what they were doing.
    const guard = navigation.addListener('beforeRemove', (event) => {
      if (stage !== 'breathing' && stage !== 'extend') return;
      if (confirmingStop) return;

      event.preventDefault();
      setConfirmingStop(true);
    });

    return guard;
  }, [navigation, stage, confirmingStop]);

  // --- render -----------------------------------------------------------

  if (stage === 'intensity') {
    return (
      <Screen>
        <SudsSlider onSubmit={startBreathing} />
      </Screen>
    );
  }

  if (stage === 'feeling') {
    return (
      <Screen>
        <FeelingPicker onSubmit={(feeling) => void submitFeeling(feeling)} />
      </Screen>
    );
  }

  if (stage === 'offer') {
    const response =
      postFeeling === 'worse' ? 'suds.post.worseResponse' : 'suds.post.sameResponse';

    return (
      <Screen>
        <View className="flex-1 justify-center gap-8">
          <Text variant="heading">{t(`breathing:${response}`)}</Text>
          <View className="gap-1">
            <Button
              label={t('breathing:suds.post.writeAbout')}
              onPress={() => {
                close();
                router.push('/(tabs)/write');
              }}
            />
            {/* Dismissible without friction, and never re-prompted for the
                same session -- the stage machine has no route back here. */}
            <Button variant="quiet" label={t('common:notNow')} onPress={close} />
          </View>
        </View>
      </Screen>
    );
  }

  // breathing | extend
  const layout = confirmingStop
    ? LAYOUT.stopping
    : stage === 'extend'
      ? LAYOUT.extend
      : LAYOUT.breathing;

  return (
    <Screen immersive>
      <View
        className="flex-1 items-center justify-center"
        style={{ gap: layout.gap }}
      >
        {panic && stage === 'breathing' && !confirmingStop ? (
          <Text variant="title" className="text-center">
            {t('breathing:panic.opening')}
          </Text>
        ) : null}

        <Orb
          animation={animation}
          size={layout.orb}
          reduceMotion={reduceMotion}
          dimmed={confirmingStop}
        />

        {confirmingStop ? (
          <StopConfirmation
            onKeepGoing={() => setConfirmingStop(false)}
            onStop={() => {
              setConfirmingStop(false);
              void endSession(false);
            }}
          />
        ) : stage === 'extend' ? (
          <ExtensionOffer
            onExtend={() => {
              // Ratios cannot change mid-session; only the length can. The
              // elapsed phases keep their exact start times so the orb does
              // not jump at the moment someone chooses to continue.
              setExtended(true);
              haptics.reset();
              setTimeline((current) =>
                current === null
                  ? null
                  : extendTimeline(
                      breathingPattern,
                      current,
                      cyclesForDuration(breathingPattern, EXTENSION_SECONDS),
                    ),
              );
              setStage('breathing');
            }}
            onDone={() => void endSession(true)}
          />
        ) : (
          <PhaseLabel label={label} />
        )}
      </View>

      {/* The way out. Always present, always one tap, never behind a menu. */}
      {!confirmingStop && stage === 'breathing' ? (
        <Button
          variant="quiet"
          label={panic ? t('breathing:panic.dismiss') : t('breathing:extend.no')}
          onPress={() => setConfirmingStop(true)}
        />
      ) : null}
    </Screen>
  );
}

/**
 * "Stop here?"
 *
 * Not a modal -- the same room, dimmed, with the orb still breathing behind
 * it. Two identical targets: stopping is never the smaller or the harder one.
 * No "are you sure", no "you're almost there", no mention of an unfinished
 * session. Someone who wants to stop is allowed to stop without being sold to
 * on the way out.
 */
function StopConfirmation({
  onKeepGoing,
  onStop,
}: {
  onKeepGoing: () => void;
  onStop: () => void;
}) {
  const { t } = useTranslation('breathing');

  return (
    <View className="w-full items-center" style={{ gap: LAYOUT.stopping.gap }}>
      <Text variant="title" className="text-center">
        {t('stopConfirm')}
      </Text>
      <View className="w-full flex-row gap-3">
        <Button variant="immersive" className="flex-1" label={t('stop.keepGoing')} onPress={onKeepGoing} />
        <Button variant="immersive" className="flex-1" label={t('stop.stop')} onPress={onStop} />
      </View>
    </View>
  );
}

/**
 * "Want to keep going?"
 *
 * Asked once, with no recommended length and neither answer favoured. The orb
 * carries on behind it, so the question does not end the session before the
 * answer does.
 */
function ExtensionOffer({
  onExtend,
  onDone,
}: {
  onExtend: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation('breathing');

  return (
    <View className="w-full items-center" style={{ gap: LAYOUT.extend.gap }}>
      <Text variant="titleSm" className="text-center">
        {t('extend.prompt')}
      </Text>
      <View className="w-full flex-row gap-3">
        <Button variant="immersive" className="flex-1" label={t('extend.yes')} onPress={onExtend} />
        <Button variant="immersive" className="flex-1" label={t('extend.no')} onPress={onDone} />
      </View>
    </View>
  );
}
