import { limitsFor, type Tier, type WorryWindowMinutes } from '@calma/domain';

import { addMinutes } from './windowRange';

/**
 * Editing the worry window (plan 14 T04's picker).
 *
 * Pure, in a `.ts` file, and reusing `addMinutes` from `windowRange.ts` rather
 * than doing clock arithmetic twice — the row that displays the window and the
 * screen that sets it must agree about what midnight does, and the cheapest way
 * to guarantee that is one function.
 */

/** The three lengths, in the order the screen offers them. */
export const WINDOW_DURATIONS: readonly WorryWindowMinutes[] = [15, 20, 30];

/** Hours move by one, minutes by five. Nobody needs a window at 8:07. */
export const HOUR_STEP = 60;
export const MINUTE_STEP = 5;

/**
 * The time `delta` minutes from `hhmm`, wrapping at midnight.
 *
 * WRAPPING RATHER THAN CLAMPING. Somebody whose worst hour is 1am has to be
 * able to reach it by pressing down from midnight, and a stepper that stops at
 * 00:00 tells them their window is not a real option. `addMinutes` already
 * wraps in both directions.
 */
export function stepWindowTime(hhmm: string, delta: number): string {
  return addMinutes(hhmm, delta);
}

/**
 * Whether a length can actually be chosen.
 *
 * 20 and 30 are Plus (`limitsFor`), and the same clause that governs the
 * custom rhythm governs this: on a build where nothing can be purchased,
 * `suppressed` makes everything available. Refusing a length on a build with
 * no RevenueCat key would be a block nobody could pay to remove, which is the
 * one thing systems/05 rules out.
 *
 * FREE IS NOT SHORT-CHANGED BY THIS. 15 minutes is a whole worry window and
 * the feature works completely on it; what Plus buys is a longer one, not a
 * working one.
 */
export function mayUseDuration(
  tier: Tier,
  minutes: WorryWindowMinutes,
  suppressed: boolean,
): boolean {
  if (suppressed) return true;
  return limitsFor(tier).worryWindowMinutes.includes(minutes);
}
