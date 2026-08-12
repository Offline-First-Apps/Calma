/**
 * Day and week keys.
 *
 * Both are computed from the device's *current* timezone at call time, from
 * local calendar fields — never from epoch arithmetic. A day is 23 or 25 hours
 * long twice a year, and a person who breathes at 00:30 on the night the
 * clocks change has still done it today.
 *
 * Nothing here stores an offset. Travelling may shorten or lengthen a period;
 * that is accepted (systems/05-entitlements.md § Limit accounting).
 */

const pad2 = (n: number): string => (n < 10 ? `0${n}` : String(n));

/** Milliseconds in a day. Safe here only because it is applied to UTC noon. */
const DAY_MS = 86_400_000;

/**
 * Local calendar date as `YYYY-MM-DD`.
 *
 * @example dayKey(new Date(2026, 0, 5, 23, 59)) // '2026-01-05'
 */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Projects a local calendar date onto the same date at UTC midnight, so that
 * week arithmetic can be done in whole days without a DST offset creeping in.
 */
function localDateAsUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

/** Monday = 0 … Sunday = 6, from a UTC-projected date. */
function isoWeekday(utc: Date): number {
  return (utc.getUTCDay() + 6) % 7;
}

/**
 * ISO-8601 week-numbering year and week for a local date.
 *
 * The week runs Monday to Sunday, and belongs to the year containing its
 * Thursday. That is why the first days of January can belong to the previous
 * year's final week, and the last days of December to the next year's first.
 */
export function isoWeek(date: Date): { year: number; week: number } {
  const thursday = localDateAsUtc(date);
  thursday.setUTCDate(thursday.getUTCDate() - isoWeekday(thursday) + 3);

  const year = thursday.getUTCFullYear();

  // 4 January is always in week 1, by definition.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Monday = new Date(Date.UTC(year, 0, 4 - isoWeekday(jan4)));

  const week =
    Math.round((thursday.getTime() - week1Monday.getTime()) / DAY_MS / 7) + 1;

  return { year, week };
}

/**
 * A day key moved by whole days.
 *
 * Goes back through local calendar fields rather than adding milliseconds, so
 * a 23- or 25-hour day cannot shift the answer.
 *
 * @example shiftDayKey('2026-03-01', -1) // '2026-02-28'
 */
export function shiftDayKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  // Midday, so the shift cannot land on a skipped or repeated hour.
  const date = new Date(year, month - 1, day + days, 12);
  return dayKey(date);
}

/**
 * ISO week key as `YYYY-Www`, Monday-start.
 *
 * @example weekKey(new Date(2025, 11, 29)) // '2026-W01' — Monday of week 1
 * @example weekKey(new Date(2027, 0, 3))   // '2026-W53' — the long year's tail
 */
export function weekKey(date: Date): string {
  const { year, week } = isoWeek(date);
  return `${year}-W${pad2(week)}`;
}
