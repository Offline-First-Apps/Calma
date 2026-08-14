import { completedWindowDays } from '@calma/db';
import type { BreathingSession } from '@calma/domain';
import { useEffect, useState } from 'react';

import { useStorage } from '@/src/lib/repositories';

import {
  type MonthBar,
  type MonthPoint,
  type SudsPoint,
  bandMonths,
  sudsPoints,
} from './history';

/** How many months h5's upper chart shows. The design draws six. */
export const HISTORY_MONTHS = 6;

export interface History {
  months: MonthPoint[];
  monthBars: MonthBar[];
  suds: SudsPoint[];
  ready: boolean;
}

/**
 * h5's data.
 *
 * READS DAY INDEXES, NOT RECORDS. `listDays()` returns the day keys breathing
 * has ever touched, and the journal and window indexes are the same shape, so
 * "how often you came here" costs three index reads rather than a scan of
 * every session in the person's history. The dots need the real sessions, but
 * only the most recent handful, so that read is bounded too.
 *
 * The alternative — walking every record to build monthly totals — is the kind
 * of thing that is instant with a month of data and janky with a year, on the
 * one screen a person opens when they are already unsure whether any of this
 * is working.
 */
export function useHistory(when: Date = new Date()): History {
  const { repositories, stores } = useStorage();
  const [state, setState] = useState<History>({
    months: [],
    monthBars: [],
    suds: [],
    ready: false,
  });

  useEffect(() => {
    let alive = true;

    void (async () => {
      const breathDays = await repositories.breathing.listDays();
      const windowDays = completedWindowDays(stores.data);

      const active = new Set([...breathDays, ...windowDays]);
      const months = monthsEndingAt(when, HISTORY_MONTHS, active, when);

      // Only the tail is needed, and only the days that have sessions on them.
      const recent: BreathingSession[] = [];
      for (const day of breathDays.slice(-14).reverse()) {
        recent.push(...(await repositories.breathing.listByDay(day)));
        if (recent.length >= 24) break;
      }

      if (!alive) return;
      setState({
        months,
        monthBars: bandMonths(months),
        suds: sudsPoints(recent),
        ready: true,
      });
    })();

    return () => {
      alive = false;
    };
  }, [repositories, stores, when]);

  return state;
}

/**
 * The last N calendar months, with the active-day count for each.
 *
 * `possibleDays` is capped at today for the current month, so the month in
 * progress is not scored against days that have not happened. Without it, the
 * first of the month always renders as the quietest bar in the chart — a
 * person's history appearing to collapse overnight, every month, forever.
 */
export function monthsEndingAt(
  end: Date,
  count: number,
  activeDays: ReadonlySet<string>,
  today: Date,
): MonthPoint[] {
  const months: MonthPoint[] = [];

  for (let back = count - 1; back >= 0; back--) {
    const cursor = new Date(end.getFullYear(), end.getMonth() - back, 1);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const inMonth = new Date(year, month + 1, 0).getDate();
    const isCurrent =
      year === today.getFullYear() && month === today.getMonth();

    let active = 0;
    for (let day = 1; day <= inMonth; day++) {
      const key = `${year}-${pad(month + 1)}-${pad(day)}`;
      if (activeDays.has(key)) active += 1;
    }

    months.push({
      year,
      month,
      activeDays: active,
      possibleDays: isCurrent ? today.getDate() : inMonth,
    });
  }

  return months;
}

const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));
