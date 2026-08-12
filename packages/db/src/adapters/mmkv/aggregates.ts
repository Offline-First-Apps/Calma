import {
  type Streak,
  computeStreak,
  dayKey,
  weekKey,
} from '@calma/domain';

import {
  AGG_STREAK,
  IDX_JOURNAL_DAYS,
  IDX_WINDOW_COMPLETED,
  aggWeek,
} from '../../keys';
import type { KeyValueStore } from '../../kv';
import type { BreathingRepo } from '../../ports/breathing.repo';
import type { JournalRepo } from '../../ports/journal.repo';
import type { WorryRepo } from '../../ports/worry.repo';
import { addToIndex, readIndex } from './indexes';

/**
 * Aggregates, recomputed on write rather than on read.
 *
 * The Progress tab then renders instantly from two keys instead of thirty
 * index reads, and the cost lands at the moment someone finishes something —
 * where a few milliseconds are invisible.
 */

export interface WeekAggregate {
  sessions: number;
  totalMinutes: number;
  worriesProcessed: number;
  worriesReleased: number;
  journalEntries: number;
  /** `null` when nobody rated. Never zero-as-a-stand-in (D-007). */
  avgPreSuds: number | null;
  improvedCount: number;
}

export const EMPTY_WEEK: WeekAggregate = {
  sessions: 0,
  totalMinutes: 0,
  worriesProcessed: 0,
  worriesReleased: 0,
  journalEntries: 0,
  avgPreSuds: null,
  improvedCount: 0,
};

export function readWeekAggregate(
  store: KeyValueStore,
  week: string,
): WeekAggregate {
  const raw = store.getString(aggWeek(week));
  if (raw === undefined) return { ...EMPTY_WEEK };

  try {
    return { ...EMPTY_WEEK, ...(JSON.parse(raw) as Partial<WeekAggregate>) };
  } catch {
    return { ...EMPTY_WEEK };
  }
}

export function readStreak(store: KeyValueStore): Streak {
  const raw = store.getString(AGG_STREAK);
  if (raw === undefined) {
    return { current: 0, longest: 0, lastQualifyingDay: null };
  }

  try {
    return JSON.parse(raw) as Streak;
  } catch {
    return { current: 0, longest: 0, lastQualifyingDay: null };
  }
}

/** Records that a worry window was carried through to the end. */
export function markWorryWindowCompleted(
  store: KeyValueStore,
  day: string,
): void {
  addToIndex(store, IDX_WINDOW_COMPLETED, day);
}

export function completedWindowDays(store: KeyValueStore): string[] {
  return readIndex(store, IDX_WINDOW_COMPLETED);
}

/** The days on which something happened that the streak counts. */
export async function qualifyingDays(
  store: KeyValueStore,
  journal: JournalRepo,
): Promise<string[]> {
  const days = readIndex(store, IDX_JOURNAL_DAYS);

  const saved: string[] = [];
  for (const day of days) {
    const week = weekKey(dayKeyToLocalDate(day));
    const entries = await journal.listByWeek(week);
    const onDay = entries.some(
      (entry) => dayKey(new Date(entry.createdAt)) === day,
    );
    if (onDay) saved.push(day);
  }

  return [...saved, ...completedWindowDays(store)];
}

export interface RecomputeDeps {
  worry: WorryRepo;
  journal: JournalRepo;
  breathing: BreathingRepo;
}

/** Rebuilds one week's aggregate from the records themselves. */
export async function recomputeWeek(
  store: KeyValueStore,
  week: string,
  deps: RecomputeDeps,
): Promise<WeekAggregate> {
  const days = daysInWeek(week);

  const stats = await deps.breathing.statsForDays(days);

  let worriesProcessed = 0;
  let worriesReleased = 0;
  for (const day of days) {
    for (const worry of await deps.worry.listByDay(day)) {
      if (worry.status === 'processed') worriesProcessed += 1;
      if (worry.status === 'released') worriesReleased += 1;
    }
  }

  const entries = await deps.journal.listByWeek(week);

  const aggregate: WeekAggregate = {
    sessions: stats.sessions,
    totalMinutes: Math.round(stats.totalSeconds / 60),
    worriesProcessed,
    worriesReleased,
    journalEntries: entries.length,
    avgPreSuds: stats.averagePreSuds,
    improvedCount: stats.improvedCount,
  };

  store.set(aggWeek(week), JSON.stringify(aggregate));
  return aggregate;
}

/** Rebuilds the streak from every qualifying day on record. */
export async function recomputeStreak(
  store: KeyValueStore,
  journal: JournalRepo,
  today: Date = new Date(),
): Promise<Streak> {
  const streak = computeStreak(
    await qualifyingDays(store, journal),
    dayKey(today),
  );

  store.set(AGG_STREAK, JSON.stringify(streak));
  return streak;
}

/** The seven local day keys of an ISO week. */
export function daysInWeek(week: string): string[] {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) throw new TypeError(`not a week key: "${week}"`);

  const year = Number(match[1]);
  const number = Number(match[2]);

  // 4 January is always in week 1; walk back to its Monday, then forward.
  const jan4 = new Date(year, 0, 4, 12);
  const isoWeekday = (jan4.getDay() + 6) % 7;
  const week1Monday = new Date(year, 0, 4 - isoWeekday, 12);

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(week1Monday);
    date.setDate(date.getDate() + (number - 1) * 7 + offset);
    return dayKey(date);
  });
}

function dayKeyToLocalDate(day: string): Date {
  const [year, month, date] = day.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(year, month - 1, date, 12);
}
