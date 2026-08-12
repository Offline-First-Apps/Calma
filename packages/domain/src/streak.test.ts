import { describe, expect, it } from 'vitest';

import { EMPTY_STREAK, computeStreak, hasQualifiedToday } from './streak';
import { shiftDayKey } from './time';

const TODAY = '2026-08-12';

describe('shiftDayKey', () => {
  it('moves across months and years', () => {
    expect(shiftDayKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDayKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDayKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('handles a leap day', () => {
    expect(shiftDayKey('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('is unaffected by a DST transition', () => {
    // 2026-03-08 is a 23-hour day in New York; the calendar does not care.
    expect(shiftDayKey('2026-03-08', 1)).toBe('2026-03-09');
    expect(shiftDayKey('2026-11-01', -1)).toBe('2026-10-31');
  });
});

describe('computeStreak', () => {
  it('is empty when nothing has qualified', () => {
    expect(computeStreak([], TODAY)).toEqual(EMPTY_STREAK);
  });

  it('counts a run ending today', () => {
    const days = ['2026-08-10', '2026-08-11', '2026-08-12'];
    expect(computeStreak(days, TODAY)).toEqual({
      current: 3,
      longest: 3,
      lastQualifyingDay: '2026-08-12',
    });
  });

  it('keeps a streak alive that reaches yesterday', () => {
    // Today has not happened yet. Ending the streak at breakfast would be a
    // punishment for not having done anything before 9am.
    const days = ['2026-08-10', '2026-08-11'];
    expect(computeStreak(days, TODAY).current).toBe(2);
  });

  it('breaks after one full missed day', () => {
    const days = ['2026-08-08', '2026-08-09'];
    expect(computeStreak(days, TODAY).current).toBe(0);
  });

  it('remembers the longest run after a break', () => {
    const days = [
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-11',
      '2026-08-12',
    ];
    expect(computeStreak(days, TODAY)).toEqual({
      current: 2,
      longest: 4,
      lastQualifyingDay: '2026-08-12',
    });
  });

  it('counts a day once however many times it qualified', () => {
    // A journal entry and a completed window on the same day is one day.
    const days = ['2026-08-12', '2026-08-12', '2026-08-11'];
    expect(computeStreak(days, TODAY).current).toBe(2);
  });

  it('does not care what order the days arrive in', () => {
    const shuffled = ['2026-08-12', '2026-08-10', '2026-08-11'];
    expect(computeStreak(shuffled, TODAY).current).toBe(3);
  });

  it('counts a single day as one', () => {
    expect(computeStreak([TODAY], TODAY)).toEqual({
      current: 1,
      longest: 1,
      lastQualifyingDay: TODAY,
    });
  });

  it('survives a timezone shift that repeats or skips a local day', () => {
    // Someone flies west and lives the same date twice, or east and skips
    // one. Neither should invent or destroy a streak: the run either side is
    // contiguous by calendar date, which is all we count.
    const westward = ['2026-08-10', '2026-08-11', '2026-08-11', '2026-08-12'];
    expect(computeStreak(westward, TODAY).current).toBe(3);

    // Eastward: the traveller genuinely has no 11th. The streak breaks, and
    // the longest run still records what happened before it.
    const eastward = ['2026-08-08', '2026-08-09', '2026-08-10', '2026-08-12'];
    const streak = computeStreak(eastward, TODAY);
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(3);
  });

  it('crosses a month boundary', () => {
    const days = ['2026-07-31', '2026-08-01'];
    expect(computeStreak(days, '2026-08-01').current).toBe(2);
  });
});

describe('hasQualifiedToday', () => {
  it('knows whether today already counts', () => {
    expect(hasQualifiedToday(['2026-08-12'], TODAY)).toBe(true);
    expect(hasQualifiedToday(['2026-08-11'], TODAY)).toBe(false);
  });
});
