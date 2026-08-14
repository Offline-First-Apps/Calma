import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { Screen } from '@/src/ui/Screen';

import { StreakScreen } from './StreakNote';
import { useProgressWeek } from './useProgress';

/**
 * h2 on its own screen.
 *
 * NO DESIGN DRAWS THE WAY IN, so one was chosen: h1's "Showing up" tile. The
 * same situation as g7, where session 13 had to invent the search glyph beside
 * "Earlier" and recorded it in `plans/09`. Recorded here for the same reason —
 * the next person should find a decision, not a mystery.
 *
 * The tile was picked over a row on the Progress tab because h2 is the streak
 * *enlarged*, and enlarging the thing you tapped is the one navigation that
 * needs no label. See the Note (session 14) in `plans/10`.
 *
 * A streak that has ended while this screen is open closes it rather than
 * rendering an empty screen: h3's caption says that when there is no streak,
 * there is nothing to show at all.
 */
export function StreakRoute() {
  const router = useRouter();
  const { streak, ready } = useProgressWeek();

  useEffect(() => {
    if (ready && streak.current <= 0) router.back();
  }, [ready, streak.current, router]);

  return <Screen>{ready ? <StreakScreen streak={streak} /> : null}</Screen>;
}
