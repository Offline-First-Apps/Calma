import {
  EMPTY_ANSWERS,
  applyAnswers,
  createOnboarding,
  currentStep,
  isFinished,
  next,
  progressFor,
  type OnboardingAnswers,
  type OnboardingState,
} from '@calma/domain';
import { LANGUAGES } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import Animated from 'react-native-reanimated';

import { useSession } from '@/src/features/breathing/useSession';
import { useReduceMotion } from '@/src/lib/motion';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';

import { StepFrame, type StepGround } from './StepFrame';
import { stepEntering, stepExiting } from './transitions';
import { FirstBreath, type BreathResult } from './steps/FirstBreath';
import { HowWasThat } from './steps/HowWasThat';
import { Language } from './steps/Language';
import { Name } from './steps/Name';
import { Notifications } from './steps/Notifications';
import { Question } from './steps/Question';
import { Welcome } from './steps/Welcome';
import { YourCalma } from './steps/YourCalma';

/**
 * Onboarding, start to finish.
 *
 * THE FLOW IS OPTIMISED FOR THE CALM ARRIVAL AND ABANDONED INSTANTLY FOR THE
 * DISTRESSED ONE. That inversion of the usual growth logic is the whole shape
 * of this file: ten steps that ask a lot of a person who has the room for it,
 * and a single tap that throws all of it away for a person who does not.
 *
 * WHERE STATE LIVES, AND WHY IT IS NOT IN A STORE. Answers are held in local
 * state and written once, at the end. Not for performance — for the guarantee:
 * a flow that persists as it goes has intermediate states on disk, and every
 * one of them is a way for an interrupted onboarding to leave the app in a
 * shape nobody designed. One write, from a value the machine has already
 * validated, means "abandoned" and "finished" are the only two outcomes.
 *
 * The exception is the first breath (b7), which writes a real session the
 * moment it ends. That is deliberate and is the point of the step — see
 * `steps/FirstBreath.tsx`.
 *
 * EVERY EXIT WRITES. Completion, skipping to the end, and the crisis exit all
 * set `onboardingCompletedAt`, so onboarding shows exactly once whatever
 * happened. The difference between them is `onboardingEscaped`, which buys the
 * person exactly one gentle re-offer on a later day and nothing more.
 */

/** Steps that stand on a different ground. Everything else uses `base`. */
const GROUND: Partial<Record<string, StepGround>> = {
  breath: 'immersive',
  reveal: 'lift',
};

export function OnboardingFlow() {
  const router = useRouter();
  const { prefs: prefsRepo } = useRepositories();
  const updatePrefs = usePrefsStore((state) => state.update);
  const reduceMotion = useReduceMotion();

  const [state, setState] = useState<OnboardingState>(() =>
    createOnboarding({ languageCount: LANGUAGES.length }),
  );
  const [answers, setAnswers] = useState<OnboardingAnswers>(EMPTY_ANSWERS);

  /**
   * The breathing session lives here rather than inside the step.
   *
   * B7 runs the breath and B8 asks how it was, and both belong in ONE record:
   * the feeling check is the last thing that happens to that session, so it
   * does the write and the answer lands in the same row instead of as a
   * second one. That means the session has to outlive the step that ran it,
   * and a hook's refs inside `FirstBreath` do not. Same ownership the session
   * screen uses, for the same reason.
   */
  const session = useSession();
  const breath = useRef<BreathResult | null>(null);

  // Guards the double-tap. Writing twice would be harmless; navigating twice
  // would not, and a shaking hand produces more double-taps than a steady one.
  const leaving = useRef(false);

  /**
   * Writes what the flow gathered and leaves.
   *
   * Storage failure is swallowed, as everywhere else on a distress path: there
   * is nothing the person could usefully do about a local write failing, and
   * being told about it while leaving a panic session would be its own small
   * cruelty. The consequence of a failed write is that onboarding is offered
   * again next launch, which is survivable.
   */
  const leave = useCallback(
    async (destination: '/(tabs)' | '/panic', escaped: boolean) => {
      if (leaving.current) return;
      leaving.current = true;

      // Navigate FIRST on the crisis path. The write is a few milliseconds,
      // but they are milliseconds between someone asking for help and getting
      // it, and the write does not need to be awaited to be correct.
      if (escaped) router.replace(destination);

      // A breath taken but never asked about is still a breath taken. Someone
      // who runs the session and then hits the crisis exit on the next screen
      // has done a minute of real breathing, and it goes in the record with
      // no feeling attached rather than being discarded for being incomplete.
      const pending = breath.current;
      if (pending !== null) {
        breath.current = null;
        void session.finish(pending.timeline, pending.elapsedSec, pending.completed, null);
      }

      try {
        await updatePrefs(prefsRepo, {
          ...applyAnswers(answers),
          onboardingCompletedAt: Date.now(),
          onboardingEscaped: escaped,
        });
      } catch {
        // Deliberately silent. See above.
      }

      if (!escaped) router.replace(destination);
    },
    [answers, prefsRepo, router, session, updatePrefs],
  );

  /**
   * Forward one step, or several.
   *
   * `count` exists for exactly one case: a first breath that was skipped
   * before it started jumps the feeling check too. "How was that?" after
   * nothing happened is a question about nothing, and answering it would
   * write a feeling with no session under it.
   */
  const advance = useCallback(
    (count = 1) => {
      setState((current) => {
        let moved = current;
        for (let i = 0; i < count; i += 1) moved = next(moved);
        if (isFinished(moved)) void leave('/(tabs)', false);
        return moved;
      });
    },
    [leave],
  );

  const escape = useCallback(() => {
    void leave('/panic', true);
  }, [leave]);

  const step = currentStep(state);
  const ground = step === null ? 'base' : (GROUND[step] ?? 'base');

  const content = useMemo(() => {
    switch (step) {
      case 'welcome':
        return <Welcome onContinue={() => advance()} />;

      case 'language':
        return <Language onContinue={() => advance()} />;

      case 'why':
      case 'when':
      case 'helped':
        return (
          <Question
            question={step}
            selected={answers[step]}
            onChange={(selected) =>
              setAnswers((current) => ({ ...current, [step]: selected }))
            }
            onContinue={() => advance()}
          />
        );

      case 'breath':
        return (
          <FirstBreath
            session={session}
            onDone={(result) => {
              breath.current = result;
              // Nothing to ask about if nothing happened -- jump the check.
              advance(result === null ? 2 : 1);
            }}
          />
        );

      case 'howWasThat':
        return (
          <HowWasThat
            onAnswer={(answer) => {
              // The write, with the answer in the same record as the breath.
              // `null` is a skipped question and is stored as `null`, never
              // as "same" (D-007).
              const result = breath.current;
              if (result !== null) {
                breath.current = null;
                void session.finish(
                  result.timeline,
                  result.elapsedSec,
                  result.completed,
                  answer,
                );
              }
              advance();
            }}
          />
        );

      case 'reveal':
        return <YourCalma answers={answers} onContinue={() => advance()} />;

      case 'notifications':
        return <Notifications onContinue={() => advance()} />;

      case 'name':
        return <Name onContinue={() => advance()} />;

      default:
        // The flow has finished and `leave` is already navigating. Rendering
        // nothing for a frame is better than rendering a step that is over.
        return null;
    }
  }, [step, answers, advance, session]);

  return (
    <StepFrame
      ground={ground}
      progress={progressFor(state)}
      onEscape={escape}
      // The step's identity, so each screen's content settles in rather than
      // swapping instantly under a hairline that is already moving.
      stepKey={state.steps[state.index]}
    >
      {/*
        Keyed on the step, so each one mounts fresh and cross-fades. The key
        is what makes the transition happen at all -- without it React
        reconciles one step's tree into the next and nothing enters or leaves.
      */}
      <Animated.View
        key={step ?? 'done'}
        className="flex-1"
        entering={stepEntering(reduceMotion)}
        exiting={stepExiting(reduceMotion)}
      >
        {content}
      </Animated.View>
    </StepFrame>
  );
}
