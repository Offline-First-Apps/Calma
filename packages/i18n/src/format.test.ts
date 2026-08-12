import { describe, expect, it } from 'vitest';

import {
  dayKeyToDate,
  daysBetweenKeys,
  formatCount,
  formatDate,
  formatRelativeDays,
  formatTime,
  formatTimeOfDay,
  formatWeekday,
  looksLikeStorageKey,
} from './format';
import { assertIntl, checkIntl } from './intl';

/** Intl inserts a narrow no-break space before AM/PM in recent ICU. */
const flat = (s: string): string => s.replace(/ | /g, ' ');

describe('Intl availability', () => {
  it('is present and carrying locale data', () => {
    const report = checkIntl();
    expect(report.missing).toEqual([]);
    expect(report.hasLocaleData).toBe(true);
    expect(report.ok).toBe(true);
  });

  it('reports every missing constructor when Intl is absent', () => {
    const report = checkIntl(null);
    expect(report.ok).toBe(false);
    expect(report.missing).toEqual([
      'DateTimeFormat',
      'RelativeTimeFormat',
      'NumberFormat',
    ]);
  });

  it('catches an Intl that exists but carries no locale data', () => {
    // The dangerous case: everything is present, so a truthiness check passes,
    // but every locale formats identically to English.
    const stub = {
      DateTimeFormat: function () {
        return { format: () => 'January' };
      },
      RelativeTimeFormat: function () {
        return { format: () => '' };
      },
      NumberFormat: function () {
        return { format: () => '' };
      },
    } as unknown as typeof globalThis.Intl;

    const report = checkIntl(stub);
    expect(report.missing).toEqual([]);
    expect(report.hasLocaleData).toBe(false);
    expect(report.ok).toBe(false);
  });

  it('throws in dev and stays quiet in production', () => {
    expect(() => assertIntl(true, null)).toThrow();
    expect(assertIntl(false, null).ok).toBe(false);
    expect(() => assertIntl(true)).not.toThrow();
  });
});

describe('formatTimeOfDay', () => {
  it('takes 12h versus 24h from the locale, not a format string', () => {
    expect(flat(formatTimeOfDay('19:00', 'en-US'))).toBe('7:00 PM');
    expect(formatTimeOfDay('19:00', 'de-DE')).toBe('19:00');
    expect(formatTimeOfDay('19:00', 'en-GB')).toBe('19:00');
  });

  it('handles both ends of the day', () => {
    expect(flat(formatTimeOfDay('00:00', 'en-US'))).toBe('12:00 AM');
    expect(flat(formatTimeOfDay('23:59', 'en-US'))).toBe('11:59 PM');
  });

  it('rejects anything that is not HH:mm', () => {
    expect(() => formatTimeOfDay('7pm', 'en-US')).toThrow();
    expect(() => formatTimeOfDay('24:00', 'en-US')).toThrow();
    expect(() => formatTimeOfDay('', 'en-US')).toThrow();
  });
});

describe('storage keys are not display strings', () => {
  it('recognises both key formats', () => {
    expect(looksLikeStorageKey('2026-01-15')).toBe(true);
    expect(looksLikeStorageKey('2026-W03')).toBe(true);
    expect(looksLikeStorageKey('15 January 2026')).toBe(false);
    expect(looksLikeStorageKey('Thursday')).toBe(false);
  });

  it('refuses to format a day key as if it were a date', () => {
    // The whole point: a dayKey reaching a display component should be a
    // loud failure in a test, not a wrong-looking date on someone's screen.
    expect(() => formatDate('2026-01-15', 'en-GB')).toThrow(/storage key/);
    expect(() => formatWeekday('2026-01-15', 'en-GB')).toThrow(/storage key/);
  });

  it('refuses to format a week key too', () => {
    expect(() => formatDate('2026-W03', 'en-GB')).toThrow(/storage key/);
  });

  it('offers a sanctioned way through', () => {
    const date = dayKeyToDate('2026-01-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(15);
    // Midday, so no timezone shift can slide the date either way.
    expect(date.getHours()).toBe(12);
    expect(formatWeekday(date, 'en-GB')).toBe('Thursday');
  });

  it('rejects a malformed day key', () => {
    expect(() => dayKeyToDate('2026-1-5')).toThrow();
    expect(() => dayKeyToDate('2026-W03')).toThrow();
  });
});

describe('formatDate and formatWeekday', () => {
  const date = new Date(2026, 0, 15, 12);

  it('follows the locale for order and language', () => {
    expect(formatDate(date, 'en-GB')).toBe('15 January 2026');
    expect(formatDate(date, 'en-US')).toBe('January 15, 2026');
    expect(formatDate(date, 'de-DE')).toBe('15. Januar 2026');
  });

  it('names the weekday in the locale', () => {
    expect(formatWeekday(date, 'en-GB')).toBe('Thursday');
    expect(formatWeekday(date, 'de-DE')).toBe('Donnerstag');
  });
});

describe('formatTime', () => {
  it('renders a moment for the locale', () => {
    const at = new Date(2026, 0, 15, 19, 5);
    expect(flat(formatTime(at, 'en-US'))).toBe('7:05 PM');
    expect(formatTime(at, 'de-DE')).toBe('19:05');
  });
});

describe('formatRelativeDays', () => {
  it('uses the word a person would use', () => {
    expect(formatRelativeDays(-1, 'en')).toBe('yesterday');
    expect(formatRelativeDays(0, 'en')).toBe('today');
    expect(formatRelativeDays(-3, 'en')).toBe('3 days ago');
  });

  it('translates', () => {
    expect(formatRelativeDays(-1, 'de')).toBe('gestern');
  });
});

describe('daysBetweenKeys', () => {
  it('counts whole days', () => {
    expect(daysBetweenKeys('2026-01-15', '2026-01-15')).toBe(0);
    expect(daysBetweenKeys('2026-01-14', '2026-01-15')).toBe(-1);
    expect(daysBetweenKeys('2026-01-12', '2026-01-15')).toBe(-3);
  });

  it('counts across a month and a year boundary', () => {
    expect(daysBetweenKeys('2025-12-31', '2026-01-01')).toBe(-1);
    expect(daysBetweenKeys('2026-01-31', '2026-02-01')).toBe(-1);
  });
});

describe('formatCount', () => {
  it('groups digits the way the locale does', () => {
    expect(formatCount(1024, 'en-US')).toBe('1,024');
    expect(formatCount(1024, 'de-DE')).toBe('1.024');
  });
});
