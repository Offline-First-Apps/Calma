import { describe, expect, it } from 'vitest';

import { EMPTY_ANSWERS, applyAnswers, leadToolFor, worryWindowFor } from './answers';
import {
  ONBOARDING_STEPS,
  createOnboarding,
  currentStep,
  isFinished,
  isSkippable,
  next,
} from './machine';

/**
 * The whole-flow guarantees, in the half that is pure (plan 13 T15).
 *
 * The other half — "no paywall, price, plan, account prompt or review request
 * can render during onboarding" — is a claim about every possible code path
 * rather than about one, so it is checked by reading the source rather than by
 * rendering it: `apps/native/src/features/onboarding/__tests__/guards.test.ts`.
 * That test cannot live here, because `packages/domain`'s tsconfig sets
 * `types: []` to keep the package genuinely platform-free, which also rules
 * out `node:fs`. The boundary doing its job.
 *
 * Neither half covers what T15 still asks for by hand: VoiceOver, 200% font
 * scale, Reduce Motion and the pseudo-locale, walked on both platforms.
 */

describe('the complete flow', () => {
  it('reaches every step, in order, and then finishes', () => {
    let state = createOnboarding({ languageCount: 6 });
    const seen: string[] = [];

    while (!isFinished(state)) {
      seen.push(currentStep(state)!);
      state = next(state);
    }

    expect(seen).toEqual([...ONBOARDING_STEPS]);
    expect(isFinished(state)).toBe(true);
  });

  it('finishes in nine steps when English ships alone', () => {
    let state = createOnboarding({ languageCount: 1 });
    let steps = 0;

    while (!isFinished(state)) {
      state = next(state);
      steps += 1;
    }

    expect(steps).toBe(9);
  });

  it('terminates from every starting point, so no flow can strand someone', () => {
    for (let start = 0; start < ONBOARDING_STEPS.length; start += 1) {
      let state = createOnboarding({ languageCount: 6 });
      for (let i = 0; i < start; i += 1) state = next(state);

      // A bounded walk: if `next` ever failed to advance, this would spin.
      let guard = 0;
      while (!isFinished(state) && guard < 100) {
        state = next(state);
        guard += 1;
      }

      expect({ start, finished: isFinished(state) }).toEqual({ start, finished: true });
    }
  });
});

describe('a flow in which everything was skipped', () => {
  it('leaves a working app rather than a half-configured one', () => {
    // D-014: "a person who never completes onboarding must have a completely
    // functional app. Every step's outcome has a working default."
    const patch = applyAnswers(EMPTY_ANSWERS);

    expect(patch.worryWindowTime).toBe(worryWindowFor([]));
    expect(patch.worryWindowTime).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    expect(leadToolFor(patch.onboardingAnswers)).toBe('sigh');
  });

  it('still reaches the end', () => {
    // Skipping and continuing are the same transition; only what got stored
    // differs. A fully-skipped run is a complete run, not an abandoned one.
    let state = createOnboarding({ languageCount: 1 });
    while (!isFinished(state)) state = next(state);
    expect(isFinished(state)).toBe(true);
  });

  it('requires an answer on no step at all', () => {
    // Every step either is skippable or asks for nothing. There is no third
    // kind, and a step that required an answer would be a wall.
    for (const step of ONBOARDING_STEPS) {
      const asksNothing = step === 'welcome' || step === 'reveal';
      expect({ step, passable: isSkippable(step) || asksNothing }).toEqual({
        step,
        passable: true,
      });
    }
  });
});

describe('the crisis escape, from every step index', () => {
  /**
   * The escape is not a transition in this machine, on purpose.
   *
   * It does not advance, reverse, or resume — it abandons the flow entirely
   * and writes defaults. So what is checkable here is the thing the escape
   * depends on: that whatever step someone was on, the answers gathered so
   * far still produce a valid, complete set of preferences. If that were only
   * true at the end, escaping from step three would leave a broken app.
   */
  it('produces valid defaults from a flow abandoned at any point', () => {
    const partial = { why: ['panic'], when: ['night'], helped: ['breathing'] };

    for (let stopAt = 0; stopAt <= 3; stopAt += 1) {
      const answers = {
        why: stopAt > 0 ? partial.why : [],
        when: stopAt > 1 ? partial.when : [],
        helped: stopAt > 2 ? partial.helped : [],
      };

      const patch = applyAnswers(answers);
      expect(patch.worryWindowTime).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
      expect(['sigh', 'breathing', 'journal']).toContain(leadToolFor(patch.onboardingAnswers));
    }
  });
});
