import type { OnboardingAnswers } from '../entities/prefs';

/**
 * What the three questions actually change.
 *
 * PERSONALISATION THAT CHANGES NOTHING IS EXTRACTION. Someone at 2am typing
 * their reasons into a phone is owed a mechanical consequence for it, and the
 * reveal screen (b9) then says out loud what each answer did. That screen is
 * only honest if this file is real, which is why the mapping is here — pure,
 * tested, and importable by a test that never boots a simulator — rather than
 * inside a component.
 *
 * Nothing here is a severity score. There is no total, no weighting, no
 * "profile". Three questions, three effects, all of them editable in Settings
 * afterwards: a person who mis-taps at 2am is not stuck with it.
 */

/** Option ids, matching the `onboarding:questions.*` translation keys. */
export const WHY_OPTIONS = ['night', 'panic', 'worry', 'tense'] as const;
export const WHEN_OPTIONS = ['night', 'morning', 'day', 'unpredictable'] as const;
export const HELPED_OPTIONS = ['breathing', 'writing', 'talking', 'nothing'] as const;

export type WhyOption = (typeof WHY_OPTIONS)[number];
export type WhenOption = (typeof WHEN_OPTIONS)[number];
export type HelpedOption = (typeof HELPED_OPTIONS)[number];

/**
 * The worry window each answer seeds, from `systems/11-onboarding.md`.
 *
 * Each is placed to sit *ahead of* the hard part rather than on top of it:
 * 20:00 parks the day's worries before bed, 08:00 catches them before the
 * morning builds, 18:00 closes the working day off.
 */
const WINDOW_FOR: Readonly<Record<WhenOption, string>> = {
  night: '20:00',
  morning: '08:00',
  day: '18:00',
  unpredictable: '19:00',
};

/**
 * Multi-select means answers collide, and the resolution has to be a rule
 * rather than an accident of array order.
 *
 * `night` first: an evening window serves someone whose mornings are also hard
 * (the worries are already parked by then), where the reverse is not true.
 * `day` before `morning` for the same reason — later collects more.
 * `unpredictable` is last and only wins alone: paired with anything specific
 * it is the less informative answer, and taking it over a real one would throw
 * away the thing the person actually told us.
 */
const WHEN_PRECEDENCE: readonly WhenOption[] = [
  'night',
  'day',
  'morning',
  'unpredictable',
];

/** The default when every question is skipped. Matches `defaultPrefs`. */
export const DEFAULT_WORRY_WINDOW = '19:00';

export function worryWindowFor(when: readonly string[]): string {
  const winner = WHEN_PRECEDENCE.find((option) => when.includes(option));
  return winner === undefined ? DEFAULT_WORRY_WINDOW : WINDOW_FOR[winner];
}

/**
 * Whether the reveal should say the window was a guess.
 *
 * True only when "it's hard to say" was the *only* thing chosen. The designer
 * flagged this in the b5 caption — it is "the answer that changes the reveal
 * copy later" — and the difference matters: telling someone their window is
 * set for 19:00 as though they had asked for it, when what they said was that
 * they did not know, is a small lie on a screen whose whole job is to be
 * specific.
 */
export function windowWasGuessed(when: readonly string[]): boolean {
  return WHEN_PRECEDENCE.slice(0, 3).every((option) => !when.includes(option));
}

/** What Home leads with. */
export type LeadTool = 'sigh' | 'breathing' | 'journal';

/**
 * Derived on read rather than stored.
 *
 * There is no `prefs.homeLeadTool`, on purpose: a second copy of something
 * already in `onboardingAnswers` is a second thing to keep in step, and
 * deriving it means editing the answer in Settings changes Home with no
 * migration and no write path to get wrong.
 *
 * `breathing` beats `writing` when both are chosen because it is the lower
 * effort of the two at the moment Home is being looked at. `nothing` yields
 * to anything else — it is not a preference, it is the absence of one — and
 * alone it leads with the sigh, the shortest thing the app can offer.
 */
export function leadToolFor(answers: OnboardingAnswers | null): LeadTool {
  if (answers === null) return 'sigh';
  if (answers.helped.includes('breathing')) return 'breathing';
  if (answers.helped.includes('writing')) return 'journal';
  return 'sigh';
}

/** Whether the reveal names the panic button explicitly (`systems/11`). */
export function shouldNamePanicButton(answers: OnboardingAnswers | null): boolean {
  return answers !== null && answers.why.includes('panic');
}

/**
 * The prefs patch a finished (or abandoned) onboarding writes.
 *
 * Every field has a working value for a run in which nothing was answered,
 * because a person who never completes onboarding must have a completely
 * functional app (D-014). Skipping is not a degraded state.
 */
export function applyAnswers(answers: OnboardingAnswers): {
  worryWindowTime: string;
  onboardingAnswers: OnboardingAnswers;
} {
  return {
    worryWindowTime: worryWindowFor(answers.when),
    // Stored verbatim. The mapping above is applied on the way in for the
    // things that are settings, and re-derived on read for the things that
    // are not -- so the answers stay the record of what the person said
    // rather than of what we concluded.
    onboardingAnswers: answers,
  };
}

export const EMPTY_ANSWERS: OnboardingAnswers = { why: [], when: [], helped: [] };
