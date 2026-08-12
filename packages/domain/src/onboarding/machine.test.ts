import { describe, expect, it } from 'vitest';

import {
  ONBOARDING_STEPS,
  STEP_PROGRESS,
  back,
  canGoBack,
  createOnboarding,
  currentStep,
  isFinished,
  isSkippable,
  next,
  progressFor,
  shouldReOfferOnboarding,
  type OnboardingStepId,
} from './machine';

/** Walks a flow to the end and returns the steps it actually showed. */
function walk(state: ReturnType<typeof createOnboarding>): OnboardingStepId[] {
  const seen: OnboardingStepId[] = [];
  let current = state;

  while (!isFinished(current)) {
    const step = currentStep(current);
    if (step === null) break;
    seen.push(step);
    current = next(current);
  }

  return seen;
}

describe('the step sequence', () => {
  it('has ten screens, not eleven — the eleventh is Home', () => {
    expect(ONBOARDING_STEPS).toHaveLength(10);
  });

  it('keeps the design IDs after B3 was cut, rather than renumbering', () => {
    // b4/b5/b6 in designs/extracted are why/when/helped. If someone
    // "tidies" this into a contiguous run, every design reference breaks.
    expect(ONBOARDING_STEPS.indexOf('why')).toBe(2);
    expect(ONBOARDING_STEPS.indexOf('when')).toBe(3);
    expect(ONBOARDING_STEPS.indexOf('helped')).toBe(4);
  });

  it('puts the aha moment in the middle, not at the end', () => {
    // systems/11: everything after the first breath is set-up that now has an
    // obvious reason to exist, done by a calmer person.
    const breath = ONBOARDING_STEPS.indexOf('breath');
    expect(breath).toBeGreaterThan(0);
    expect(breath).toBeLessThan(ONBOARDING_STEPS.length - 1);
  });
});

describe('createOnboarding', () => {
  it('drops the language step when the build ships one language', () => {
    const steps = walk(createOnboarding({ languageCount: 1 }));
    expect(steps).not.toContain('language');
    expect(steps).toHaveLength(9);
  });

  it('shows it as soon as there are two', () => {
    expect(walk(createOnboarding({ languageCount: 2 }))).toContain('language');
  });

  it('starts on welcome either way', () => {
    expect(currentStep(createOnboarding({ languageCount: 1 }))).toBe('welcome');
    expect(currentStep(createOnboarding({ languageCount: 6 }))).toBe('welcome');
  });
});

describe('moving through it', () => {
  it('advances and reverses without losing its place', () => {
    // welcome, why, when, helped, ... (no language step in an English-only build)
    let state = createOnboarding({ languageCount: 1 });
    state = next(next(next(state)));
    expect(currentStep(state)).toBe('helped');
    expect(currentStep(back(state))).toBe('when');
  });

  it('cannot go back past the first step', () => {
    const first = createOnboarding({ languageCount: 1 });
    expect(canGoBack(first)).toBe(false);
    expect(back(first)).toEqual(first);
  });

  it('finishes rather than sticking on the last step', () => {
    let state = createOnboarding({ languageCount: 1 });
    for (let i = 0; i < 9; i += 1) state = next(state);

    expect(isFinished(state)).toBe(true);
    expect(currentStep(state)).toBeNull();
    // Idempotent: a double-tap on the last Continue must not walk past the end.
    expect(next(state)).toEqual(state);
  });

  it('never reports a step once finished', () => {
    let state = createOnboarding({ languageCount: 1 });
    while (!isFinished(state)) state = next(state);
    expect(progressFor(state)).toBeNull();
    expect(canGoBack(state)).toBe(false);
  });
});

describe('the progress hairline', () => {
  it('is absent on the welcome and the breath', () => {
    // b1: "position starts once the asking does". b7: a progress bar during a
    // breath is the exact thing the app-wide ban exists to prevent.
    expect(STEP_PROGRESS.welcome).toBeNull();
    expect(STEP_PROGRESS.breath).toBeNull();
  });

  it('never reaches the end, so the last screen is not a finish line', () => {
    for (const value of Object.values(STEP_PROGRESS)) {
      if (value !== null) expect(value).toBeLessThan(1);
    }
  });

  it('only ever moves forward', () => {
    const shown = ONBOARDING_STEPS.map((step) => STEP_PROGRESS[step]).filter(
      (value): value is number => value !== null,
    );

    for (let i = 1; i < shown.length; i += 1) {
      expect(shown[i]!).toBeGreaterThan(shown[i - 1]!);
    }
  });

  it('is not a step count in disguise', () => {
    // If these ever become linear, someone has "simplified" it into
    // index / total and the designer's whole point has been lost.
    const gaps: number[] = [];
    const shown = ONBOARDING_STEPS.map((step) => STEP_PROGRESS[step]).filter(
      (value): value is number => value !== null,
    );
    for (let i = 1; i < shown.length; i += 1) gaps.push(shown[i]! - shown[i - 1]!);

    expect(new Set(gaps.map((gap) => gap.toFixed(2))).size).toBeGreaterThan(1);
  });
});

describe('skipping', () => {
  it('lets every question be skipped', () => {
    for (const step of ['language', 'why', 'when', 'helped', 'howWasThat', 'notifications', 'name'] as const) {
      expect(isSkippable(step)).toBe(true);
    }
  });

  it('lets the first breath be skipped too', () => {
    // It is the aha moment, and it is still optional. An app that makes you
    // breathe before it will let you past has misunderstood itself.
    expect(isSkippable('breath')).toBe(true);
  });

  it('has nothing to skip on the two screens that ask for nothing', () => {
    expect(isSkippable('welcome')).toBe(false);
    expect(isSkippable('reveal')).toBe(false);
  });
});

describe('the single re-offer after a crisis escape', () => {
  const escapedAt = new Date('2026-08-11T02:14:00').getTime();
  const base = {
    onboardingEscaped: true,
    onboardingReOffered: false,
    onboardingCompletedAt: escapedAt,
  };

  it('never offers on the same day as the escape', () => {
    // 2am escape, 9am relaunch. Still the same night as they lived it, and
    // a setup prompt would be the app asking them to fill in a form about
    // the panic attack they just had.
    expect(shouldReOfferOnboarding(base, new Date('2026-08-11T09:00:00'))).toBe(false);
  });

  it('offers on a later day', () => {
    expect(shouldReOfferOnboarding(base, new Date('2026-08-12T09:00:00'))).toBe(true);
  });

  it('offers exactly once — declining is permanent', () => {
    expect(
      shouldReOfferOnboarding(
        { ...base, onboardingReOffered: true },
        new Date('2026-09-01T09:00:00'),
      ),
    ).toBe(false);
  });

  it('says nothing to someone who simply finished', () => {
    expect(
      shouldReOfferOnboarding(
        { ...base, onboardingEscaped: false },
        new Date('2026-08-12T09:00:00'),
      ),
    ).toBe(false);
  });

  it('says nothing to someone still mid-onboarding', () => {
    expect(
      shouldReOfferOnboarding(
        { ...base, onboardingCompletedAt: null },
        new Date('2026-08-12T09:00:00'),
      ),
    ).toBe(false);
  });
});
