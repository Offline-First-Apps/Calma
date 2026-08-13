import { describe, expect, it } from 'vitest';

import { describeDay, partOfDay } from './format';

/**
 * `describeDay` decides how a journal entry is dated, on three screens.
 *
 * The failure it guards against is not a wrong string -- it is a boundary
 * that quietly slides, so an entry written last night says "6 days ago" and
 * someone concludes the app has lost track of their week.
 */

const LOCALE = 'en-GB';

/** A local-time date. Constructed field-by-field so no UTC parsing sneaks in. */
function at(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour);
}

describe('partOfDay', () => {
  it.each([
    [0, 'night'],
    [4, 'night'],
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [16, 'afternoon'],
    [17, 'evening'],
    [20, 'evening'],
    [21, 'night'],
    [23, 'night'],
  ] as const)('%i:00 is %s', (hour, expected) => {
    expect(partOfDay(at(2026, 2, 13, hour))).toBe(expected);
  });

  it('calls 3am night, not morning', () => {
    // The hour this app exists for. "This morning" would be wrong in the one
    // case it matters most.
    expect(partOfDay(at(2026, 2, 13, 3))).toBe('night');
  });
});

describe('describeDay', () => {
  const now = at(2026, 2, 13, 15); // Friday 13 February 2026, 3pm

  it('describes a moment earlier today by part of day', () => {
    expect(describeDay(at(2026, 2, 13, 9), LOCALE, now)).toEqual({
      kind: 'today',
      partOfDay: 'morning',
    });
  });

  it('treats a moment later today as today rather than the future', () => {
    // Clock skew and a same-second write must not produce "in 0 days".
    expect(describeDay(at(2026, 2, 13, 22), LOCALE, now).kind).toBe('today');
  });

  it('names yesterday without a weekday', () => {
    expect(describeDay(at(2026, 2, 12, 21), LOCALE, now)).toEqual({
      kind: 'yesterday',
    });
  });

  it('uses the weekday inside the last six days', () => {
    expect(describeDay(at(2026, 2, 8, 22), LOCALE, now)).toEqual({
      kind: 'thisWeek',
      weekday: 'Sunday',
      partOfDay: 'night',
    });
  });

  it('holds the weekday form right up to the sixth day', () => {
    // Six days back is still "Saturday afternoon". The boundary is worth
    // pinning from both sides: it is the one people slide by accident.
    expect(describeDay(at(2026, 2, 7, 12), LOCALE, now)).toEqual({
      kind: 'thisWeek',
      weekday: 'Saturday',
      partOfDay: 'afternoon',
    });
  });

  it('crosses to "last <weekday>" at seven days', () => {
    expect(describeDay(at(2026, 2, 6, 12), LOCALE, now)).toEqual({
      kind: 'lastWeek',
      weekday: 'Friday',
    });
  });

  it('counts whole weeks from a fortnight out', () => {
    expect(describeDay(at(2026, 1, 30, 12), LOCALE, now)).toEqual({
      kind: 'weeksAgo',
      weeks: 2,
    });
  });

  it('falls back to a plain date past four weeks', () => {
    // "Nine weeks ago" is arithmetic about someone's life. A date is kinder
    // and more useful at that distance.
    expect(describeDay(at(2025, 11, 4, 12), LOCALE, now)).toEqual({
      kind: 'date',
      date: '4 November 2025',
    });
  });

  it('counts calendar days, not elapsed hours', () => {
    // 23:30 to 00:30 is one hour and two days. An entry written just before
    // midnight must not still say "today" the following afternoon.
    const lateLastNight = at(2026, 2, 12, 23);
    const thisMorning = at(2026, 2, 13, 0);
    expect(describeDay(lateLastNight, LOCALE, thisMorning).kind).toBe('yesterday');
  });
});
