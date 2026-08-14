import type { WeekAggregate } from '@calma/db';
import type { Streak } from '@calma/domain';

/**
 * Numbers turned into the way a person would say them.
 *
 * h5's caption is the whole specification: *"Someone recounting your week back
 * to you kindly — 'four times' and 'about twenty minutes', never 4 and
 * 20:15."* The H-group caption adds the constraint that makes it hard:
 * *"Sentences instead of numbers wherever a sentence will do, sage only for
 * things that went well, no goals, no rings, no comparisons, and never a
 * zero."*
 *
 * TWO RULES SHAPE EVERY FUNCTION HERE.
 *
 * 1. **Never a zero.** Every describe* function returns `null` rather than a
 *    phrase for nothing. A zero is a thing you did not do, and a grid of them
 *    is a list of failures — which is the one thing this app promised never to
 *    show. Callers render nothing at all, not an empty tile.
 *
 * 2. **These return keys, not strings.** Durations are i18next plural keys and
 *    not string maths (`systems/10-i18n.md` § Formatting), and a module that
 *    built English sentences here would have to be rewritten to add a
 *    language. The rounding is the logic; the wording is the locale's.
 *
 * It is a `.ts` file beside its components because a rule that can only be
 * checked by mounting a component tree is a rule that stops being checked.
 */

export interface Phrase {
  /** An i18next key within the `progress` namespace. */
  key: string;
  params?: Record<string, string | number>;
}

/**
 * Minutes, rounded the way someone recounting their week would round.
 *
 * Under ten minutes keeps its number — the difference between four and seven
 * minutes is one a person feels. Above that it goes to the nearest five,
 * because nobody has ever thought "I breathed for twenty-three minutes".
 *
 * `approximate` is false only on an exact landing, so "About twenty minutes"
 * does not appear over a genuine twenty.
 */
export function roundMinutes(total: number): {
  value: number;
  approximate: boolean;
} {
  if (total <= 0) return { value: 0, approximate: false };
  if (total < 10) return { value: total, approximate: false };

  const rounded = Math.round(total / 5) * 5;
  return { value: rounded, approximate: rounded !== total };
}

/**
 * NIGHT IS 21:00 TO 05:00, AND IT IS NOT A GUESS.
 *
 * Onboarding's `worryWindowFor` seeds a 20:00 window for someone who answered
 * "late at night", on the reasoning that the window should sit *ahead of* the
 * hard part. Night proper therefore starts after it. The upper bound is 05:00
 * rather than midnight because "twice at night" has to be able to include the
 * 3am session that the whole product exists for — a calendar-day boundary
 * would file that under the wrong day and quietly undercount the worst nights.
 */
export const NIGHT_FROM_HOUR = 21;
export const NIGHT_UNTIL_HOUR = 5;

export function isNight(at: Date): boolean {
  const hour = at.getHours();
  return hour >= NIGHT_FROM_HOUR || hour < NIGHT_UNTIL_HOUR;
}

/**
 * h1's opening sentence. "Four times this week, twice at night."
 *
 * The night clause is dropped entirely when nothing happened at night, rather
 * than rendered as "none at night" — a clause that only ever appears when it
 * has something to say.
 */
export function weekOpener(sessions: number, atNight: number): Phrase | null {
  if (sessions <= 0) return null;

  return atNight > 0
    ? { key: 'week.openerNight', params: { count: sessions, night: atNight } }
    : { key: 'week.opener', params: { count: sessions } };
}

/** h1's "Breathing" tile. "About twenty minutes". */
export function describeBreathing(week: WeekAggregate): Phrase | null {
  if (week.sessions <= 0) return null;

  const { value, approximate } = roundMinutes(week.totalMinutes);

  // A session shorter than half a minute rounds to zero, and "0 minutes" would
  // be the app telling someone the thing they did did not count. It did.
  if (value <= 0) return { key: 'tiles.breathingBrief' };

  return {
    key: approximate ? 'tiles.breathingApprox' : 'tiles.breathing',
    params: { count: value },
  };
}

/**
 * h1's "Worries" tile. "Three, all looked at".
 *
 * Processed and released are both *looked at* — the design says "all looked
 * at" over a week where three were handled, and it does not break them into a
 * plan/let-go split. That split belongs to h3, in the moment, where it is
 * about one evening and not a tally.
 */
export function describeWorries(week: WeekAggregate): Phrase | null {
  const total = week.worriesProcessed + week.worriesReleased;
  if (total <= 0) return null;

  return { key: 'tiles.worries', params: { count: total } };
}

/** h1's "Writing" tile. "Two entries". */
export function describeWriting(week: WeekAggregate): Phrase | null {
  if (week.journalEntries <= 0) return null;

  return { key: 'tiles.writing', params: { count: week.journalEntries } };
}

/**
 * h1's "Showing up" tile, and h2.
 *
 * `null` at zero is not a nicety. h3's caption: *"when there's no streak this
 * screen shows nothing at all"* — no "0 days", no "start one today", no dimmed
 * placeholder waiting to be filled. There is also deliberately no reference to
 * `streak.longest`: a personal best is a thing to fall short of.
 */
export function describeStreak(streak: Streak): Phrase | null {
  if (streak.current <= 0) return null;

  return { key: 'streak', params: { count: streak.current } };
}

/**
 * Whether the week has anything at all to say.
 *
 * Drives h1's empty state. Note it asks about *content*, not about time: a
 * week with one session and nothing else is not empty, and gets the real
 * screen with one tile on it rather than "we'll start keeping track".
 */
export function hasAnything(week: WeekAggregate, streak: Streak): boolean {
  return (
    week.sessions > 0 ||
    week.worriesProcessed > 0 ||
    week.worriesReleased > 0 ||
    week.journalEntries > 0 ||
    streak.current > 0
  );
}

/**
 * h4's closing line, and the reason it is not conditional on doing well.
 *
 * *"A quiet week is a fine week."* It shows on a quiet week and says so
 * plainly; on a busy one there is nothing to reassure anybody about, so it is
 * absent rather than swapped for praise. The threshold is deliberately low —
 * this is not a grade, it is permission.
 */
export const QUIET_WEEK_AT_OR_BELOW = 2;

export function quietWeekNote(week: WeekAggregate): Phrase | null {
  const total =
    week.sessions +
    week.worriesProcessed +
    week.worriesReleased +
    week.journalEntries;

  if (total === 0 || total > QUIET_WEEK_AT_OR_BELOW) return null;

  return { key: 'week.quiet' };
}
