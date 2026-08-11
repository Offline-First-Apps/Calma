import { afterAll, describe, expect, it } from 'vitest';

import { dayKey, isoWeek, weekKey } from './time';

/**
 * Node applies `TZ` on the next Date operation, which lets these tests pin a
 * timezone that actually observes DST instead of hoping the CI machine does.
 * Declared locally because `@calma/domain` deliberately compiles with no
 * ambient type packages at all.
 */
declare const process: { env: Record<string, string | undefined> };

const originalTz = process.env.TZ;

/**
 * Assigning `undefined` would set the *string* `'undefined'`, which Node reads
 * as an invalid zone and silently treats as UTC — quietly changing the meaning
 * of every test that follows.
 */
function restoreTimeZone(): void {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
}

function inTimeZone<T>(tz: string, fn: () => T): T {
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    restoreTimeZone();
  }
}

afterAll(restoreTimeZone);

describe('dayKey', () => {
  it('formats a local date, zero-padded', () => {
    expect(dayKey(new Date(2026, 0, 5, 9, 30))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 10, 30, 9, 30))).toBe('2026-11-30');
  });

  it('holds the day at both of its edges', () => {
    expect(dayKey(new Date(2026, 0, 5, 0, 0, 0))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 0, 5, 23, 59, 59))).toBe('2026-01-05');
  });

  it('follows the local calendar, not UTC', () => {
    // 20:00 in New York is already tomorrow in UTC. It is not tomorrow here.
    inTimeZone('America/New_York', () => {
      expect(dayKey(new Date(2026, 0, 5, 20, 0))).toBe('2026-01-05');
    });
    // And the mirror case: 08:00 in Auckland is still yesterday in UTC.
    inTimeZone('Pacific/Auckland', () => {
      expect(dayKey(new Date(2026, 0, 6, 8, 0))).toBe('2026-01-06');
    });
  });

  it('crosses new year with the local calendar', () => {
    expect(dayKey(new Date(2025, 11, 31, 23, 59))).toBe('2025-12-31');
    expect(dayKey(new Date(2026, 0, 1, 0, 1))).toBe('2026-01-01');
  });

  it('handles the 23-hour day when the clocks go forward', () => {
    inTimeZone('America/New_York', () => {
      // DST begins 2026-03-08 at 02:00 local.
      const beforeJump = new Date(2026, 2, 8, 1, 30);
      expect(dayKey(beforeJump)).toBe('2026-03-08');
      expect(dayKey(new Date(2026, 2, 8, 3, 30))).toBe('2026-03-08');

      // Adding a literal 24 hours lands at 01:30 on the 9th, because the day
      // was only 23 hours long. Epoch division would answer the 8th.
      const plus24h = new Date(beforeJump.getTime() + 24 * 60 * 60 * 1000);
      expect(plus24h.getHours()).toBe(2);
      expect(dayKey(plus24h)).toBe('2026-03-09');
    });
  });

  it('handles the 25-hour day when the clocks go back', () => {
    inTimeZone('America/New_York', () => {
      // DST ends 2026-11-01 at 02:00 local; 01:30 happens twice.
      const firstPass = new Date(2026, 10, 1, 1, 30);
      expect(dayKey(firstPass)).toBe('2026-11-01');
      const secondPass = new Date(firstPass.getTime() + 60 * 60 * 1000);
      expect(secondPass.getHours()).toBe(1);
      expect(dayKey(secondPass)).toBe('2026-11-01');
      expect(dayKey(new Date(2026, 10, 1, 23, 0))).toBe('2026-11-01');
    });
  });

  it('is stable across a southern-hemisphere transition too', () => {
    inTimeZone('Australia/Sydney', () => {
      expect(dayKey(new Date(2026, 3, 5, 2, 30))).toBe('2026-04-05');
      expect(dayKey(new Date(2026, 9, 4, 3, 30))).toBe('2026-10-04');
    });
  });
});

describe('weekKey', () => {
  it('starts weeks on Monday', () => {
    // Mon 5 Jan 2026 opens week 2; the Sunday before closes week 1.
    expect(weekKey(new Date(2026, 0, 4))).toBe('2026-W01');
    expect(weekKey(new Date(2026, 0, 5))).toBe('2026-W02');
    expect(weekKey(new Date(2026, 0, 11))).toBe('2026-W02');
    expect(weekKey(new Date(2026, 0, 12))).toBe('2026-W03');
  });

  it('zero-pads the week number', () => {
    expect(weekKey(new Date(2026, 0, 1))).toBe('2026-W01');
    expect(weekKey(new Date(2026, 8, 1))).toBe('2026-W36');
  });

  it('puts late December into the next year when the week is', () => {
    // Mon 29 Dec 2025 is the first day of ISO week 2026-W01.
    expect(weekKey(new Date(2025, 11, 28))).toBe('2025-W52');
    expect(weekKey(new Date(2025, 11, 29))).toBe('2026-W01');
    expect(weekKey(new Date(2025, 11, 31))).toBe('2026-W01');
    expect(weekKey(new Date(2026, 0, 1))).toBe('2026-W01');
  });

  it('puts early January into the previous year when the week is', () => {
    // 2026 starts on a Thursday, so it is a 53-week year and spills into 2027.
    expect(weekKey(new Date(2027, 0, 1))).toBe('2026-W53');
    expect(weekKey(new Date(2027, 0, 3))).toBe('2026-W53');
    expect(weekKey(new Date(2027, 0, 4))).toBe('2027-W01');
  });

  it('always puts 4 January in week 1', () => {
    for (const year of [2024, 2025, 2026, 2027, 2028, 2029, 2030]) {
      expect(weekKey(new Date(year, 0, 4))).toBe(`${year}-W01`);
    }
  });

  it('always puts 29 December in a week of 52 or 53', () => {
    for (const year of [2024, 2025, 2026, 2027, 2028]) {
      const { week } = isoWeek(new Date(year, 11, 29));
      expect(week === 1 || week === 52 || week === 53).toBe(true);
    }
  });

  it('gives a 53-week count only to years that have one', () => {
    // A year has 53 ISO weeks iff it starts on a Thursday, or is a leap year
    // starting on a Wednesday. 2026 (Thu) and 2020 (leap, Wed) qualify.
    expect(isoWeek(new Date(2026, 11, 31)).week).toBe(53);
    expect(isoWeek(new Date(2020, 11, 31)).week).toBe(53);
    expect(isoWeek(new Date(2025, 11, 28)).week).toBe(52);
  });

  it('does not shift a week because of a DST transition', () => {
    inTimeZone('America/New_York', () => {
      // Mon 2 Mar – Sun 8 Mar 2026 is one week; the clocks change inside it.
      expect(weekKey(new Date(2026, 2, 2))).toBe('2026-W10');
      expect(weekKey(new Date(2026, 2, 8, 3, 30))).toBe('2026-W10');
      expect(weekKey(new Date(2026, 2, 9))).toBe('2026-W11');

      // And the November transition.
      expect(weekKey(new Date(2026, 9, 26))).toBe('2026-W44');
      expect(weekKey(new Date(2026, 10, 1, 1, 30))).toBe('2026-W44');
      expect(weekKey(new Date(2026, 10, 2))).toBe('2026-W45');
    });
  });

  it('follows the local calendar, not UTC', () => {
    inTimeZone('America/New_York', () => {
      // Sunday 22:00 in New York is Monday in UTC. The week has not turned.
      expect(weekKey(new Date(2026, 0, 4, 22, 0))).toBe('2026-W01');
    });
  });
});
