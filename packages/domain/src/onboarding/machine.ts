/**
 * The onboarding step machine.
 *
 * Pure, and deliberately so: this is the one flow in the app that a person
 * might meet while having a panic attack, and every claim made about it — that
 * the crisis exit is on every step, that skipping everything still lands
 * somewhere functional, that it can be walked backwards without losing an
 * answer — is a claim that ought to be checkable in Node in a millisecond
 * rather than by tapping through a simulator eleven times.
 *
 * THERE ARE TEN SCREENS, NOT ELEVEN. `systems/11-onboarding.md` counts eleven
 * steps and the eleventh is Home — the app itself, not a step. B3, the founder
 * note, is cut (D-019) and the IDs are NOT renumbered: b4 stays b4, because
 * every reference into `designs/extracted/` would otherwise break.
 *
 * See the note in `plans/13-onboarding-walkthrough.md`.
 */
import { dayKey } from '../time';

/** In flow order. The `b*` names match `designs/extracted/` exactly. */
export const ONBOARDING_STEPS = [
  'welcome',
  'language',
  'why',
  'when',
  'helped',
  'breath',
  'howWasThat',
  'reveal',
  'notifications',
  'name',
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number];

/**
 * Where the hairline sits on each step, straight out of the design files.
 *
 * NOT `index / total`. See the long note in `ui/ProgressHairline.tsx`: these
 * are hand-placed so that position can be sensed but not counted, and the run
 * never reaches 1 so the last screen is not a finish line. `null` means no
 * hairline at all — b1 has none ("position starts once the asking does") and
 * b7 has none because a progress bar during a breath is the exact thing the
 * app-wide ban exists to prevent.
 *
 * The gap between 0.18 and 0.38 is where the founder note used to be.
 */
export const STEP_PROGRESS: Readonly<Record<OnboardingStepId, number | null>> = {
  welcome: null,
  language: 0.18,
  why: 0.38,
  when: 0.48,
  helped: 0.58,
  breath: null,
  howWasThat: 0.72,
  reveal: 0.84,
  notifications: 0.92,
  name: 0.99,
};

/**
 * Steps that ask for nothing, and so have nothing to skip.
 *
 * Everything else carries a visible Skip of equal weight to Continue. Note
 * that `breath` IS skippable even though it is the aha moment — an app that
 * makes you breathe before it will let you past has misunderstood itself.
 */
export const UNSKIPPABLE: readonly OnboardingStepId[] = ['welcome', 'reveal'];

export interface OnboardingState {
  /** The steps this particular run will show, in order. */
  readonly steps: readonly OnboardingStepId[];
  /** Position in `steps`. Equal to `steps.length` once the flow is done. */
  readonly index: number;
}

export interface OnboardingOptions {
  /**
   * How many languages the build ships with.
   *
   * One means the language step is dropped rather than shown: asking someone
   * to choose from a list of one is a screen that costs a tap and returns
   * nothing. English ships alone today, so today this step does not exist.
   */
  languageCount: number;
}

export function createOnboarding({ languageCount }: OnboardingOptions): OnboardingState {
  const steps = ONBOARDING_STEPS.filter(
    (step) => step !== 'language' || languageCount > 1,
  );

  return { steps, index: 0 };
}

/** The step being shown, or `null` when the flow has finished. */
export function currentStep(state: OnboardingState): OnboardingStepId | null {
  return state.steps[state.index] ?? null;
}

export function isFinished(state: OnboardingState): boolean {
  return state.index >= state.steps.length;
}

/**
 * Forward one step. From the last step this finishes the flow rather than
 * sticking, which is what makes `isFinished` the single completion signal —
 * skip and continue are the same transition here, because the difference
 * between them is what got stored, not where the person goes next.
 */
export function next(state: OnboardingState): OnboardingState {
  if (isFinished(state)) return state;
  return { ...state, index: state.index + 1 };
}

/** Back one step. Clamps at the first — there is nothing behind welcome. */
export function back(state: OnboardingState): OnboardingState {
  if (state.index <= 0) return state;
  return { ...state, index: state.index - 1 };
}

export function canGoBack(state: OnboardingState): boolean {
  return state.index > 0 && !isFinished(state);
}

/** Hairline position, or `null` where the design shows no hairline. */
export function progressFor(state: OnboardingState): number | null {
  const step = currentStep(state);
  return step === null ? null : STEP_PROGRESS[step];
}

export function isSkippable(step: OnboardingStepId): boolean {
  return !UNSKIPPABLE.includes(step);
}

/**
 * Whether to offer the rest of onboarding again to someone who left through
 * the crisis exit.
 *
 * Three conditions, and the third is the one that matters. Offer only if they
 * escaped, only if they have not already been offered, and NEVER ON THE SAME
 * DAY. Someone who hit "I need this now" was having the worst kind of moment;
 * meeting a setup prompt an hour later would be the app asking them to finish
 * a form about the panic attack they just had.
 *
 * Once declined it is permanent — the caller sets `reOffered` either way.
 *
 * Day keys rather than a 24-hour clock: "a later launch" means a different day
 * as the person lived it. Someone who escaped at 2am and opens the app at 9am
 * the same morning is still inside that night, and `dayKey` says so.
 */
export function shouldReOfferOnboarding(
  prefs: {
    onboardingEscaped: boolean;
    onboardingReOffered: boolean;
    onboardingCompletedAt: number | null;
  },
  now: Date = new Date(),
): boolean {
  if (!prefs.onboardingEscaped) return false;
  if (prefs.onboardingReOffered) return false;
  if (prefs.onboardingCompletedAt === null) return false;

  return dayKey(new Date(prefs.onboardingCompletedAt)) !== dayKey(now);
}
