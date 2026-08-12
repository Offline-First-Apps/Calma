import { shiftDayKey } from './time';

/**
 * The streak.
 *
 * A day qualifies if someone **saved a journal entry** or **completed a worry
 * window**. Breathing alone does not count — not because it matters less, but
 * because it is the one thing you can do in ten seconds without engaging, and
 * a streak that can be farmed stops meaning anything.
 *
 * A streak breaks after one full missed calendar day. Nothing anywhere in the
 * product tells someone they lost one (systems/02-data-layer.md § Streak rule).
 */

export interface Streak {
  current: number;
  longest: number;
  lastQualifyingDay: string | null;
}

export const EMPTY_STREAK: Streak = {
  current: 0,
  longest: 0,
  lastQualifyingDay: null,
};

/**
 * @param qualifyingDays day keys, in any order, duplicates allowed — two
 * qualifying things on one day are still one day.
 * @param todayKey the local day key of "now".
 */
export function computeStreak(
  qualifyingDays: readonly string[],
  todayKey: string,
): Streak {
  const unique = [...new Set(qualifyingDays)].sort();
  if (unique.length === 0) return EMPTY_STREAK;

  let longest = 1;
  let run = 1;

  for (let i = 1; i < unique.length; i++) {
    const previous = unique[i - 1] as string;
    const day = unique[i] as string;

    run = shiftDayKey(previous, 1) === day ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const present = new Set(unique);
  const lastQualifyingDay = unique.at(-1) ?? null;

  // Today has not happened yet, so a streak is still alive if it reaches
  // yesterday. Anything older has been broken by a full missed day.
  let cursor = present.has(todayKey)
    ? todayKey
    : present.has(shiftDayKey(todayKey, -1))
      ? shiftDayKey(todayKey, -1)
      : null;

  let current = 0;
  while (cursor !== null && present.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  return { current, longest, lastQualifyingDay };
}

/** Whether today already counts, so nothing needs nudging. */
export function hasQualifiedToday(
  qualifyingDays: readonly string[],
  todayKey: string,
): boolean {
  return qualifyingDays.includes(todayKey);
}
