import { type Stores, readStreak } from '@calma/db';
import { type Streak, dayKey } from '@calma/domain';
import { useEffect, useState } from 'react';

import { playSound } from '@/src/lib/audio';
import { useStorage } from '@/src/lib/repositories';

/**
 * h3's trigger. Plan 10 T04.
 *
 * *"Noticed, not applauded: no confetti, no takeover, no share prompt,
 * nothing blocked, once a day at most."*
 *
 * ONCE A DAY IS ENFORCED BY A STORED DAY KEY, NOT BY A FLAG.
 *
 * A boolean "already celebrated" needs something to clear it, and the thing
 * that clears it is a date comparison anyway — so the date is the state.
 * Storing the day it last fired means a cold start, a force-quit mid-window
 * and a second worry window on the same evening all get the same answer
 * without any reset path to forget to write.
 *
 * It fires only when the streak *reaches* a new day, which is why the check is
 * against the last day it fired rather than against the streak length: a
 * person who opens the app four times on a six-day streak sees this once, on
 * the first of those, and only if today is the day that extended it.
 */
const LAST_SHOWN = 'state:streakMomentShown';

export interface StreakMomentState {
  /** The streak to render, or `null` for "say nothing". */
  streak: Streak | null;
}

export function useStreakMoment(
  active: boolean,
  today: Date = new Date(),
): StreakMomentState {
  const { stores } = useStorage();
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    if (!active) return;

    const current = readStreak(stores.data);
    const day = dayKey(today);

    // Nothing to notice: no streak, or today is not the day it grew.
    if (current.current <= 0 || current.lastQualifyingDay !== day) return;
    if (stores.data.getString(LAST_SHOWN) === day) return;

    stores.data.set(LAST_SHOWN, day);
    setStreak(current);

    /*
     * "Two soft glass notes." The sound is the whole celebration -- there is
     * no haptic here despite plan 10 T04 offering one, because the moment
     * lands over a screen someone is reading rather than touching, and a
     * buzz from a screen you are not interacting with reads as a
     * notification. See the Note (session 14) in plans/10.
     */
    void playSound('streakAchieved');
  }, [active, stores, today]);

  return { streak };
}

/** Exported for the test, and so nothing else invents a second key. */
export const STREAK_MOMENT_KEY = LAST_SHOWN;

export function markStreakMomentShown(stores: Stores, day: string): void {
  stores.data.set(LAST_SHOWN, day);
}
