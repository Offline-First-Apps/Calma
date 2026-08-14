import { shiftDayKey } from '@calma/domain';

/**
 * k6's boundary, with no dependencies at all.
 *
 * SEPARATE FROM `useReturning.ts` BECAUSE THAT FILE IMPORTS THE REPOSITORY
 * CONTEXT, which imports React. `apps/native/vitest.config.ts` runs pure Node
 * with no renderer, so a rule living beside a hook is a rule that cannot be
 * tested — the same trap `dotColour` fell into earlier in this session, and
 * the reason the repo's standing advice is to put anything with a decision in
 * it in a module of its own.
 *
 * THE THRESHOLD IS 21 DAYS, and it is a judgement call. The screen is called
 * "returning after a month", but a month is too long to be the boundary: three
 * weeks is already past the point where someone wonders whether their writing
 * survived, which is the fear the screen answers. Below three weeks a greeting
 * like this reads as the app noticing a gap that was not one.
 */
export const RETURNING_AFTER_DAYS = 21;

/**
 * @param lastSeen the stored day key, or `undefined` on a first launch —
 * which onboarding owns and this must never claim.
 */
export function isReturning(
  lastSeen: string | undefined,
  todayKey: string,
  afterDays: number = RETURNING_AFTER_DAYS,
): boolean {
  if (lastSeen === undefined) return false;
  return lastSeen < shiftDayKey(todayKey, -afterDays);
}
