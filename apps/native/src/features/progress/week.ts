import type { BreathingSession } from '@calma/domain';

import { isNight } from './phrasing';

/**
 * The seven bars, and the night count that h1's opening sentence needs.
 *
 * Pure, and it takes sessions rather than a repository, so the whole of h1's
 * arithmetic can be tested in Node without a store. `apps/native/vitest.config`
 * runs with no renderer; anything with a decision in it that lives inside a
 * component is a decision that stops being checked.
 */

export interface DayBar {
  /** `YYYY-MM-DD`. */
  day: string;
  sessions: number;
  /** Total seconds breathed that day — the bar's height, not its count. */
  seconds: number;
}

export interface WeekShape {
  days: DayBar[];
  /** Sessions that started between 21:00 and 05:00. */
  atNight: number;
}

/**
 * BAR HEIGHT IS TIME, NOT SESSION COUNT.
 *
 * h1's card pairs the bars with "about twenty minutes", and h4's is captioned
 * "when you sat down to breathe" — both are about how long, not how many. It
 * also behaves better: counting sessions makes four abandoned ten-second
 * starts outrank one real ten-minute sit, which is the opposite of what the
 * chart is trying to show. `durationSec` is what actually happened, never what
 * was intended (`entities/breathing.ts`).
 */
export function buildWeek(
  days: readonly string[],
  sessionsByDay: ReadonlyMap<string, readonly BreathingSession[]>,
): WeekShape {
  let atNight = 0;

  const bars = days.map((day) => {
    const sessions = sessionsByDay.get(day) ?? [];
    let seconds = 0;

    for (const session of sessions) {
      seconds += session.durationSec;
      if (isNight(new Date(session.startedAt))) atNight += 1;
    }

    return { day, sessions: sessions.length, seconds };
  });

  return { days: bars, atNight };
}

/**
 * Bar heights as fractions of the week's own tallest day.
 *
 * SCALED TO THE PERSON, NOT TO A TARGET. There is no fixed ceiling anywhere in
 * this chart — a week whose best day was four minutes looks exactly like a
 * week whose best day was forty. That is the H-group caption's "no goals, no
 * rings" applied to the y-axis: an absolute scale would silently grade every
 * quiet week against a busy one the person had months ago.
 *
 * The cost is that heights are not comparable between weeks, which is
 * deliberate — "no comparison to last week" is the same caption's next clause.
 */
export function barFractions(week: WeekShape): number[] {
  const tallest = Math.max(...week.days.map((day) => day.seconds), 0);
  if (tallest <= 0) return week.days.map(() => 0);

  return week.days.map((day) => day.seconds / tallest);
}
