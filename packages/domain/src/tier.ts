import type { WorryWindowMinutes } from './entities/prefs';
import { dayKey, weekKey } from './time';

/**
 * What each tier allows.
 *
 * The governing rule, from systems/05-entitlements.md: no hard blocks, and
 * never a paywall between someone and calm. Panic, paced breathing and the
 * physiological sigh are unlimited forever — they do not appear here at all,
 * because there is nothing to count. What Plus buys is depth and memory.
 *
 * Nothing in this file decides what the *interface* does at a limit. Reaching
 * one is never a disabled button; the action is attempted and a gentle card
 * follows. These functions only answer the question of fact.
 */

export type Tier = 'free' | 'plus';

export interface TierLimits {
  /** Captures allowed per local calendar day. */
  worriesPerDay: number;
  /** Saved entries allowed per ISO week. Drafts do not count. */
  journalEntriesPerWeek: number;
  /** Selectable worry window lengths, in minutes. */
  worryWindowMinutes: readonly WorryWindowMinutes[];
}

const FREE: TierLimits = {
  worriesPerDay: 3,
  journalEntriesPerWeek: 2,
  worryWindowMinutes: [15],
};

const PLUS: TierLimits = {
  worriesPerDay: Number.POSITIVE_INFINITY,
  journalEntriesPerWeek: Number.POSITIVE_INFINITY,
  worryWindowMinutes: [15, 20, 30],
};

export function limitsFor(tier: Tier): TierLimits {
  return tier === 'plus' ? PLUS : FREE;
}

/**
 * @param capturedToday captures already made today, from the day index.
 */
export function isAtWorryLimit(tier: Tier, capturedToday: number): boolean {
  return capturedToday >= limitsFor(tier).worriesPerDay;
}

/**
 * @param savedThisWeek entries saved this ISO week. Drafts are not counted.
 */
export function isAtJournalLimit(tier: Tier, savedThisWeek: number): boolean {
  return savedThisWeek >= limitsFor(tier).journalEntriesPerWeek;
}

/**
 * How many captures remain today. `Infinity` on Plus.
 *
 * Never negative: a lapsed Plus user who captured ten worries this morning is
 * at their limit, not eleven in debt. An allowance already granted is never
 * clawed back (systems/05-entitlements.md § Limit accounting).
 */
export function worriesRemaining(tier: Tier, capturedToday: number): number {
  return Math.max(0, limitsFor(tier).worriesPerDay - capturedToday);
}

/** How many journal entries remain this week. `Infinity` on Plus. */
export function journalEntriesRemaining(
  tier: Tier,
  savedThisWeek: number,
): number {
  return Math.max(0, limitsFor(tier).journalEntriesPerWeek - savedThisWeek);
}

/**
 * Counts captures that fall on the same local day as `now`.
 *
 * The period boundary lives here rather than in the repository so that "what
 * counts as today" has exactly one definition. Timezone travel may shorten or
 * lengthen the period; that is accepted.
 */
export function countCapturedToday(
  capturedAt: readonly number[],
  now: Date,
): number {
  const today = dayKey(now);
  let count = 0;
  for (const at of capturedAt) if (dayKey(new Date(at)) === today) count += 1;
  return count;
}

/** Counts saves that fall in the same ISO week as `now`. */
export function countSavedThisWeek(
  savedAt: readonly number[],
  now: Date,
): number {
  const thisWeek = weekKey(now);
  let count = 0;
  for (const at of savedAt) if (weekKey(new Date(at)) === thisWeek) count += 1;
  return count;
}

/** Whether a worry window length is offered on this tier. */
export function isWorryWindowLengthAllowed(
  tier: Tier,
  minutes: WorryWindowMinutes,
): boolean {
  return limitsFor(tier).worryWindowMinutes.includes(minutes);
}

/**
 * The window length to actually use.
 *
 * A Plus subscriber who lapses keeps a stored preference of 20 or 30 minutes.
 * Rather than treat that as invalid state, we quietly fall back to the length
 * their tier offers.
 */
export function resolveWorryWindowMinutes(
  tier: Tier,
  preferred: WorryWindowMinutes,
): WorryWindowMinutes {
  const allowed = limitsFor(tier).worryWindowMinutes;
  return allowed.includes(preferred) ? preferred : (allowed[0] ?? 15);
}
