import {
  EMPTY_WEEK,
  type Repositories,
  type Stores,
  type WeekAggregate,
  daysInWeek,
  readStreak,
  readWeekAggregate,
} from '@calma/db';
import { EMPTY_STREAK, type Streak, weekKey } from '@calma/domain';
import { useCallback, useEffect, useState } from 'react';

import { useStorage } from '@/src/lib/repositories';

import { type WeekShape, buildWeek } from './week';

/**
 * Everything h1 and h4 render, read once per focus.
 *
 * NOT A ZUSTAND STORE, and plan 10 T01 says it should be. See the
 * `Note (session 14)` in that plan: a store is for state two screens must
 * agree about, and there is exactly one reader here. Adding one would mean a
 * second copy of numbers that already live in the aggregate cache, plus an
 * invalidation path to get wrong every time a worry is released — the bug
 * being invited is a Progress tab that quietly shows last week's numbers.
 *
 * The aggregates are recomputed on write, so reading them here is two MMKV
 * gets and no arithmetic (`packages/db/.../aggregates.ts`). The seven days of
 * sessions are seven more. That is cheap enough to do on every focus, and
 * doing it on every focus is what makes the screen incapable of being stale.
 */

export interface ProgressWeek {
  aggregate: WeekAggregate;
  streak: Streak;
  shape: WeekShape;
  /** False until the first read lands. Renders nothing, never a zero. */
  ready: boolean;
}

const EMPTY_SHAPE: WeekShape = { days: [], atNight: 0 };

export function useProgressWeek(when: Date = new Date()): ProgressWeek {
  const { repositories, stores } = useStorage();
  const [state, setState] = useState<ProgressWeek>({
    aggregate: EMPTY_WEEK,
    streak: EMPTY_STREAK,
    shape: EMPTY_SHAPE,
    ready: false,
  });

  const week = weekKey(when);

  const read = useCallback(
    async (alive: () => boolean) => {
      const next = await readProgressWeek(repositories, stores, week);
      if (alive()) setState(next);
    },
    [repositories, stores, week],
  );

  useEffect(() => {
    let alive = true;
    void read(() => alive);
    return () => {
      alive = false;
    };
  }, [read]);

  return state;
}

/**
 * The read itself, separated so it can be called without a component.
 *
 * `listByDay` per day rather than one range query because that is the shape
 * `BreathingRepo` offers, and seven index reads against MMKV are not worth a
 * new port method. If a year view ever needs 365 of these, that is the moment
 * to add one — not before.
 */
export async function readProgressWeek(
  repositories: Repositories,
  stores: Stores,
  week: string,
): Promise<ProgressWeek> {
  const days = daysInWeek(week);

  const sessionsByDay = new Map(
    await Promise.all(
      days.map(
        async (day) => [day, await repositories.breathing.listByDay(day)] as const,
      ),
    ),
  );

  return {
    aggregate: readWeekAggregate(stores.data, week),
    streak: readStreak(stores.data),
    shape: buildWeek(days, sessionsByDay),
    ready: true,
  };
}
