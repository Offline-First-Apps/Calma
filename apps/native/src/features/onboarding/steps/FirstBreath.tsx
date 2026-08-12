import {
  type BreathLabel,
  type BreathTimeline,
  buildTimeline,
  getPattern,
} from '@calma/domain';
import { amberGradient, amberGradientStops } from '@calma/tokens';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useUniwind } from 'uniwind';

import { Orb } from '@/src/features/breathing/Orb';
import { PhaseLabel } from '@/src/features/breathing/PhaseLabel';
import { useBreathHaptics } from '@/src/features/breathing/useBreathHaptics';
import { useOrbAnimation } from '@/src/features/breathing/useOrbAnimation';
import { useSession } from '@/src/features/breathing/useSession';
import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb as AmbientOrb } from '@/src/ui/Orb';
import { Text } from '@/src/ui/Text';

/**
 * B7 — the first breath. `designs/extracted/b7-first-breath-{light,dark}.html`.
 *
 * THE AHA MOMENT, AND THE REASON IT IS STEP SIX OF TEN RATHER THAN THE FINALE.
 *
 * For Airbnb it is the first booking. For Calma it is the first cycle where
 * the haptic pulses in someone's hand and they realise the app is doing
 * something to their body rather than showing them a screen. That is the whole
 * product in about eight seconds, and putting it in the middle means
 * everything after it is set-up with an obvious reason to exist, done by a
 * person who is calmer than they were four screens ago.
 *
 * IT IS A REAL SESSION. Not a preview, not a demo, not a "try it" mode. Three
 * physiological sighs, haptics on, written through `BreathingRepo` with its
 * own `onboarding` entry point, counted in Progress like any other. The
 * argument in `systems/11` is that letting someone try the core experience
 * only works if it *is* the core experience — a demo that does not count is a
 * screenshot with a heartbeat. This is the one step that persists as it goes.
 *
 * THE ROUND AMBER BUTTON IS THE PANIC BUTTON, AND THAT IS THE TUTORIAL.
 * A coach mark pointing at the FAB would be the obvious way to teach the most
 * important gesture in the app, and it is banned (`plans/17-screens.md`) —
 * an arrow with a tooltip is exactly the corporate register the tone guide
 * exists to avoid. Instead the person performs the gesture, in the shape and
 * the position it will always have, at the moment it first pays off. Step
 * eight then names it in one sentence. Teaching by use, not by annotation.
 *
 * NO RAIL, NO COUNTER, NO CYCLE COUNT, NO PROGRESS HAIRLINE. The ground warms
 * and dims so the orb is the only lit thing. A progress bar during a breath is
 * precisely what the app-wide ban on them exists to prevent.
 *
 * SKIPPABLE. An app that makes you breathe before it will let you past has
 * misunderstood itself.
 */

/** Three cycles. Long enough to feel, short enough that nobody waits it out. */
const CYCLES = 3;

/**
 * 84px, from the design — larger than the 72px FAB it teaches.
 *
 * Not an inconsistency: this is the only time the gesture is being learned
 * rather than reached for, and the button is the single target on a screen
 * with nothing else to hit. It shrinks to its permanent size the moment it
 * becomes permanent.
 */
const BUTTON_SIZE = 84;

/** What the step hands back, for the feeling check to write. */
export interface BreathResult {
  timeline: BreathTimeline;
  /** What happened, not what was intended. */
  elapsedSec: number;
  completed: boolean;
}

export function FirstBreath({
  session,
  onDone,
}: {
  /**
   * Owned by the flow, not by this component.
   *
   * The record has to survive this step unmounting so that B8's answer can go
   * into the same row, and a hook's refs do not.
   */
  session: ReturnType<typeof useSession>;
  onDone: (result: BreathResult | null) => void;
}) {
  const { t } = useTranslation(['onboarding', 'common', 'breathing']);
  const { theme } = useUniwind();
  const reduceMotion = useReduceMotion();

  const pattern = useMemo(() => getPattern('physiological-sigh'), []);

  const [timeline, setTimeline] = useState<BreathTimeline | null>(null);
  const [label, setLabel] = useState<BreathLabel | null>(null);

  const haptics = useBreathHaptics(timeline);

  const onPhaseStart = useCallback(
    (index: number) => {
      haptics.onPhaseStart(index);
      const step = timeline?.steps[index];
      // Only phases that change the word touch React. The sigh's 180ms
      // micro-hold inherits its neighbour's label and re-renders nothing.
      if (step?.labelChanges) setLabel(step.label);
    },
    [haptics, timeline],
  );

  /**
   * Hands the finished breath up, without writing it.
   *
   * THE WRITE HAPPENS AFTER B8, not here, and that is deliberate: the feeling
   * check is the last thing that happens to this session, so it does the
   * write and the answer lands in the same record rather than as a second
   * row. Exactly the arrangement `features/breathing/SessionScreen.tsx`
   * already uses, for exactly the same reason.
   *
   * `timeline.duration` rather than a measured elapsed time: this branch only
   * runs when the animation reported every phase finished, so intended and
   * actual are the same number. An early exit takes the skip path instead,
   * which reports what actually happened.
   */
  const onFinished = useCallback(() => {
    haptics.onFinished();
    if (timeline !== null) {
      onDone({ timeline, elapsedSec: timeline.duration, completed: true });
    } else {
      onDone(null);
    }
  }, [haptics, timeline, onDone]);

  const animation = useOrbAnimation({
    timeline,
    paused: false,
    reduceMotion,
    onPhaseStart,
    onFinished,
  });

  const begin = useCallback(() => {
    session.begin({
      pattern: 'physiological-sigh',
      entryPoint: 'onboarding',
      // Never asked here. Someone four screens into setup has not agreed to
      // rate their distress out of ten, and D-007 says a skipped rating is
      // null rather than zero.
      preSuds: null,
    });
    setTimeline(buildTimeline(pattern, CYCLES));
  }, [pattern, session]);

  const skip = useCallback(() => {
    // A started-then-abandoned breath is still a thing that happened, and it
    // is recorded with `completed: false` -- a fact, not a failure. There is
    // no threshold below which a session stops counting.
    //
    // A breath never started reports `null`, and the flow then skips the
    // feeling check too: "How was that?" after nothing happened is a question
    // about nothing.
    onDone(
      timeline === null
        ? null
        : { timeline, elapsedSec: session.elapsed(), completed: false },
    );
  }, [timeline, session, onDone]);

  const started = timeline !== null;

  return (
    <View className="flex-1 items-center">
      <Text variant="bodySm" className="text-center text-muted">
        {t('onboarding:breath.intro')}
      </Text>

      <View className="flex-1 items-center justify-center" style={{ gap: 40 }}>
        {started ? (
          <Orb animation={animation} size={288} reduceMotion={reduceMotion} />
        ) : (
          <AmbientOrb size={288} reduceMotion={reduceMotion} />
        )}

        {/* Before the tap there is no word, because nothing is being asked of
            the person's breath yet. The design shows "Breathe in" mid-session;
            an idle screen showing it would be an instruction nobody is
            following. */}
        {started ? <PhaseLabel label={label} /> : null}
      </View>

      <Text variant="footnote" className="mb-[22px] text-center">
        {t('onboarding:breath.hint')}
      </Text>

      {started ? (
        // Once it is running the button has done its teaching job and would
        // only be a second thing to look at. The way out stays.
        <View style={{ height: BUTTON_SIZE }} />
      ) : (
        <CalmButton
          size={BUTTON_SIZE}
          theme={theme}
          label={t('breathing:panic.fabLabel')}
          hint={t('breathing:panic.fabHint')}
          onPress={begin}
        />
      )}

      <Button variant="quiet" label={t('common:skip')} onPress={skip} />
    </View>
  );
}

/**
 * The panic button, in the position and the shape it will always have.
 *
 * Drawn here rather than reusing `PanicFab` because that component is a
 * position-fixed overlay that navigates to `/panic` — the two share an
 * appearance, not a behaviour. The gradient, the stops and the coloured glow
 * come from the same tokens, so the two cannot drift apart visually.
 *
 * Named for what it does, never "panic": that is not a word to say to someone
 * who might be having one.
 */
function CalmButton({
  size,
  theme,
  label,
  hint,
  onPress,
}: {
  size: number;
  theme: string;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const isDark = theme === 'dark';
  const stops = isDark ? amberGradient.dark.fab : amberGradient.light.fab;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      hitSlop={12}
      className="items-center justify-center rounded-full active:opacity-90"
      style={{
        width: size,
        height: size,
        shadowColor: isDark ? '#D19249' : '#D68B36',
        shadowOpacity: isDark ? 0.6 : 0.75,
        shadowRadius: isDark ? 20 : 20,
        shadowOffset: { width: 0, height: 18 },
        elevation: 10,
      }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="onboardingCalm" x1="0" y1="0" x2="0.38" y2="1">
            {stops.map((color, i) => (
              <Stop
                key={color}
                offset={`${amberGradientStops.fab[i]! * 100}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#onboardingCalm)" />
      </Svg>
    </Pressable>
  );
}
