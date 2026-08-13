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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { JournalOffer } from '@/src/features/journal/JournalOffer';
import { useJournalStore } from '@/src/features/journal/store';
import { playSound, setBreathingSessionActive } from '@/src/lib/audio';
import { useReduceMotion } from '@/src/lib/motion';
import { useRepositories } from '@/src/lib/repositories';
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
  /*
   * THERE IS NO `panic` PROP, DELIBERATELY.
   *
   * There was one until session 12, and every stage this screen grew reached
   * the panic path by default: the exit routed through "Stop here?", and
   * finishing ran the feeling check and then a journaling offer -- all three
   * forbidden by plan 07 and by e2/e3/e4's captions. The flag made each of
   * them a one-line oversight rather than a decision.
   *
   * The panic session is `features/breathing/PanicSession.tsx`. It shares the
   * orb, the timeline and the haptics -- the parts that are genuinely the
   * same -- and nothing that asks a question.
   */
}

export function SessionScreen({
  pattern,
  customRatio,
  entryPoint,
  targetSeconds,
}: SessionScreenProps) {
  const { t } = useTranslation(['breathing', 'journal', 'common']);
  const router = useRouter();
  const navigation = useNavigation();
  const reduceMotion = useReduceMotion();
  const session = useSession();
  const repositories = useRepositories();
  const startDraft = useJournalStore((state) => state.startDraft);

  // The screen must not sleep mid-breath. Someone following the orb is not
  // touching the screen, which is exactly what the idle timer watches for.
  useKeepAwake();

  const breathingPattern = useMemo(
    () => getPattern(pattern, customRatio),
    [pattern, customRatio],
  );

  const seconds = targetSeconds ?? DEFAULT_SECONDS;

  const [timeline, setTimeline] = useState<BreathTimeline | null>(null);
  const [stage, setStage] = useState<Stage>('intensity');
  const [label, setLabel] = useState<BreathLabel | null>(null);
  const [preSuds, setPreSuds] = useState<number | null>(null);
  const [postFeeling, setPostFeeling] = useState<PostFeeling | null>(null);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const [extended, setExtended] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

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
        const outcome = await session.finish(
          timeline,
          timeline.duration,
          true,
          feeling,
        );
        setSessionId(outcome?.sessionId ?? null);
      }

      if (shouldOfferJournaling({ preSuds, postFeeling: feeling })) {
        setStage('offer');
      } else {
        close();
      }
    },
    [timeline, session, preSuds, close],
  );

  /**
   * "Let's write" (T09, T10).
   *
   * The draft is created HERE rather than on the Write tab, and it carries
   * `sessionId`. Two reasons. The entry exists on disk before the editor
   * mounts, so the usual guarantee holds -- there is no window in which
   * someone's writing lives only in component state. And the link is set at
   * the one moment the app actually knows the entry came from a session;
   * inferring it later from timestamps would be a guess dressed as a fact.
   */
  const acceptOffer = useCallback(async () => {
    const entry = await startDraft(repositories.journal, sessionId);
    close();
    router.push(`/journal/${entry.id}`);
  }, [startDraft, repositories.journal, sessionId, close, router]);

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
    /*
     * The response-specific copy (T09).
     *
     * "Same" and "worse" each get their own sentence, because they are not
     * the same thing to hear. The third case -- arrived at 7 or above but
     * came out better -- gets g1's own line, which acknowledges the intensity
     * without contradicting someone who has just said they feel better.
     */
    const prompt =
      postFeeling === 'worse'
        ? t('breathing:suds.post.worseResponse')
        : postFeeling === 'same'
          ? t('breathing:suds.post.sameResponse')
          : t('journal:offer');

    return (
      <JournalOffer
        prompt={prompt}
        onAccept={() => void acceptOffer()}
        // Dismissible without friction, and never re-prompted for the same
        // session -- the stage machine has no route back here.
        onDismiss={close}
      />
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
          label={t('breathing:extend.no')}
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
