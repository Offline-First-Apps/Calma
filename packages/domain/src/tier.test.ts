import { describe, expect, it } from 'vitest';

import {
  countCapturedToday,
  countSavedThisWeek,
  isAtJournalLimit,
  isAtWorryLimit,
  isWorryWindowLengthAllowed,
  journalEntriesRemaining,
  limitsFor,
  resolveWorryWindowMinutes,
  worriesRemaining,
} from './tier';

const at = (y: number, m: number, d: number, h = 12): number =>
  new Date(y, m, d, h).getTime();

describe('limitsFor', () => {
  it('gives free 3 worries a day and 2 journal entries a week', () => {
    expect(limitsFor('free').worriesPerDay).toBe(3);
    expect(limitsFor('free').journalEntriesPerWeek).toBe(2);
  });

  it('gives plus no counted limits at all', () => {
    expect(limitsFor('plus').worriesPerDay).toBe(Number.POSITIVE_INFINITY);
    expect(limitsFor('plus').journalEntriesPerWeek).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it('fixes the free worry window at 15 minutes', () => {
    expect(limitsFor('free').worryWindowMinutes).toEqual([15]);
    expect(limitsFor('plus').worryWindowMinutes).toEqual([15, 20, 30]);
  });
});

describe('isAtWorryLimit', () => {
  it('allows the third capture and stops the fourth', () => {
    expect(isAtWorryLimit('free', 0)).toBe(false);
    expect(isAtWorryLimit('free', 2)).toBe(false);
    expect(isAtWorryLimit('free', 3)).toBe(true);
    expect(isAtWorryLimit('free', 4)).toBe(true);
  });

  it('never stops a plus subscriber', () => {
    expect(isAtWorryLimit('plus', 3)).toBe(false);
    expect(isAtWorryLimit('plus', 10_000)).toBe(false);
  });
});

describe('isAtJournalLimit', () => {
  it('allows two entries and stops the third', () => {
    expect(isAtJournalLimit('free', 0)).toBe(false);
    expect(isAtJournalLimit('free', 1)).toBe(false);
    expect(isAtJournalLimit('free', 2)).toBe(true);
    expect(isAtJournalLimit('free', 3)).toBe(true);
  });

  it('never stops a plus subscriber', () => {
    expect(isAtJournalLimit('plus', 2)).toBe(false);
    expect(isAtJournalLimit('plus', 500)).toBe(false);
  });
});

describe('remaining allowances', () => {
  it('counts down and stops at zero', () => {
    expect(worriesRemaining('free', 0)).toBe(3);
    expect(worriesRemaining('free', 2)).toBe(1);
    expect(worriesRemaining('free', 3)).toBe(0);
    expect(journalEntriesRemaining('free', 1)).toBe(1);
    expect(journalEntriesRemaining('free', 2)).toBe(0);
  });

  it('never goes negative for someone who has lapsed from plus', () => {
    // Ten worries captured on Plus, then the subscription ends the same day.
    expect(worriesRemaining('free', 10)).toBe(0);
    expect(journalEntriesRemaining('free', 9)).toBe(0);
  });

  it('is infinite on plus', () => {
    expect(worriesRemaining('plus', 40)).toBe(Number.POSITIVE_INFINITY);
    expect(journalEntriesRemaining('plus', 40)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

describe('countCapturedToday', () => {
  const now = new Date(2026, 0, 5, 21, 0); // Monday evening

  it('counts only today', () => {
    const captures = [
      at(2026, 0, 5, 8),
      at(2026, 0, 5, 13),
      at(2026, 0, 4, 23), // yesterday
      at(2026, 0, 6, 1), // tomorrow
    ];
    expect(countCapturedToday(captures, now)).toBe(2);
  });

  it('includes both edges of the local day', () => {
    const captures = [at(2026, 0, 5, 0), at(2026, 0, 5, 23)];
    expect(countCapturedToday(captures, now)).toBe(2);
  });

  it('rolls over at local midnight', () => {
    const captures = [at(2026, 0, 5, 8), at(2026, 0, 5, 20)];
    expect(isAtWorryLimit('free', countCapturedToday(captures, now))).toBe(
      false,
    );

    const withThird = [...captures, at(2026, 0, 5, 22)];
    expect(isAtWorryLimit('free', countCapturedToday(withThird, now))).toBe(
      true,
    );

    // Same three captures, seen from the next morning: the day is clean.
    const tomorrow = new Date(2026, 0, 6, 9, 0);
    expect(countCapturedToday(withThird, tomorrow)).toBe(0);
    expect(isAtWorryLimit('free', countCapturedToday(withThird, tomorrow))).toBe(
      false,
    );
  });

  it('is empty when nothing has been captured', () => {
    expect(countCapturedToday([], now)).toBe(0);
  });
});

describe('countSavedThisWeek', () => {
  // Thursday of ISO week 2026-W02 (Mon 5 Jan – Sun 11 Jan).
  const thursday = new Date(2026, 0, 8, 20, 0);

  it('counts Monday through Sunday', () => {
    const saves = [
      at(2026, 0, 5, 9), // Monday, this week
      at(2026, 0, 11, 22), // Sunday, still this week
      at(2026, 0, 4, 22), // Sunday of the week before
      at(2026, 0, 12, 1), // Monday of the week after
    ];
    expect(countSavedThisWeek(saves, thursday)).toBe(2);
  });

  it('rolls over on Monday, not Sunday', () => {
    const saves = [at(2026, 0, 8, 9), at(2026, 0, 9, 9)];
    expect(isAtJournalLimit('free', countSavedThisWeek(saves, thursday))).toBe(
      true,
    );

    // Sunday night: still the same week, still at the limit.
    const sunday = new Date(2026, 0, 11, 23, 30);
    expect(countSavedThisWeek(saves, sunday)).toBe(2);
    expect(isAtJournalLimit('free', countSavedThisWeek(saves, sunday))).toBe(
      true,
    );

    // Monday morning: a fresh allowance.
    const monday = new Date(2026, 0, 12, 7, 0);
    expect(countSavedThisWeek(saves, monday)).toBe(0);
    expect(isAtJournalLimit('free', countSavedThisWeek(saves, monday))).toBe(
      false,
    );
  });

  it('rolls over correctly across the new year', () => {
    // Mon 29 Dec 2025 opens ISO week 2026-W01, which runs into January.
    const newYearsDay = new Date(2026, 0, 1, 10, 0);
    const saves = [at(2025, 11, 29, 9), at(2025, 11, 31, 9)];
    expect(countSavedThisWeek(saves, newYearsDay)).toBe(2);
    expect(isAtJournalLimit('free', countSavedThisWeek(saves, newYearsDay)))
      .toBe(true);

    // The following Monday, 5 January, starts 2026-W02.
    const nextWeek = new Date(2026, 0, 5, 10, 0);
    expect(countSavedThisWeek(saves, nextWeek)).toBe(0);
  });
});

describe('worry window length', () => {
  it('offers only 15 minutes on free', () => {
    expect(isWorryWindowLengthAllowed('free', 15)).toBe(true);
    expect(isWorryWindowLengthAllowed('free', 20)).toBe(false);
    expect(isWorryWindowLengthAllowed('free', 30)).toBe(false);
  });

  it('offers all three on plus', () => {
    expect(isWorryWindowLengthAllowed('plus', 20)).toBe(true);
    expect(isWorryWindowLengthAllowed('plus', 30)).toBe(true);
  });

  it('falls back quietly when a stored preference outruns the tier', () => {
    expect(resolveWorryWindowMinutes('free', 30)).toBe(15);
    expect(resolveWorryWindowMinutes('free', 15)).toBe(15);
    expect(resolveWorryWindowMinutes('plus', 30)).toBe(30);
  });
});
