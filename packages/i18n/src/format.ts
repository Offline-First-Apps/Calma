/**
 * Every date, time and number a person sees goes through this file.
 *
 * Two rules it exists to enforce:
 *
 *   1. **12h versus 24h is a property of the locale, never a format string.**
 *      Hardcoding `HH:mm` is how an app shows 19:00 to someone whose phone has
 *      said 7:00 pm their whole life.
 *   2. **Storage keys are not display strings.** `dayKey()` and `weekKey()`
 *      return `YYYY-MM-DD` and `YYYY-Www` for indexes. Rendering one is how a
 *      storage format ends up on screen in the wrong calendar, so the
 *      formatters here reject them outright.
 *
 * Durations are deliberately absent. "4 minutes" is an i18next plural key, not
 * string maths (systems/10-i18n.md § Formatting).
 */

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_KEY = /^\d{4}-W\d{2}$/;
const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Whether a string is one of `@calma/domain`'s storage keys. */
export function looksLikeStorageKey(value: string): boolean {
  return DAY_KEY.test(value) || WEEK_KEY.test(value);
}

function rejectStorageKey(value: string): void {
  if (looksLikeStorageKey(value)) {
    throw new TypeError(
      `"${value}" is a storage key, not a date. Parse it with dayKeyToDate() ` +
        'before formatting it for display.',
    );
  }
}

/**
 * The sanctioned way to get from a stored day key to something formattable.
 * Midday local time, so a timezone shift cannot slide the date either way.
 */
export function dayKeyToDate(dayKey: string): Date {
  const match = DAY_KEY.exec(dayKey);
  if (!match) throw new TypeError(`not a day key: "${dayKey}"`);

  const [year, month, day] = dayKey.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(year, month - 1, day, 12);
}

/**
 * A wall-clock `HH:mm` preference rendered for the locale.
 *
 * @example formatTimeOfDay('19:00', 'en-US') // '7:00 PM'
 * @example formatTimeOfDay('19:00', 'de-DE') // '19:00'
 */
export function formatTimeOfDay(time: string, locale: string): string {
  const match = TIME_OF_DAY.exec(time);
  if (!match) throw new TypeError(`not a time of day: "${time}"`);

  const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * The worry window's time, as it appears in a sentence.
 *
 * Differs from `formatTimeOfDay` in one way: a window on the hour drops its
 * minutes. "Your window opens at 7 PM" is how the sentence is spoken, and
 * f1's design writes it "8pm" — ":00" in running prose reads like a timetable.
 * A window at 19:30 keeps its minutes, because there it is carrying meaning.
 *
 * The case is left exactly as `Intl` produces it. f1 and f3 render "8pm"
 * lowercase, and lowercasing here would be an English typographic habit
 * applied to every locale in the app by a function that cannot tell whether
 * the letters it is touching are a meridiem, a script with no case, or a word
 * that needs its capital. That divergence is recorded in `plans/08` T05.
 *
 * @example formatWindowTime('20:00', 'en-US') // '8 PM'
 * @example formatWindowTime('20:30', 'en-US') // '8:30 PM'
 * @example formatWindowTime('20:00', 'de-DE') // '20 Uhr'
 */
export function formatWindowTime(time: string, locale: string): string {
  const match = TIME_OF_DAY.exec(time);
  if (!match) throw new TypeError(`not a time of day: "${time}"`);

  const minutes = Number(match[2]);
  const date = new Date(2000, 0, 1, Number(match[1]), minutes);

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: minutes === 0 ? undefined : '2-digit',
  }).format(date);
}

/** A moment's clock time, for "until 7:00 pm". */
export function formatTime(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
}

/** "15 January 2026", for entry headers. */
export function formatDate(value: Date | string, locale: string): string {
  if (typeof value === 'string') rejectStorageKey(value);
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** "Thursday", for the journal list. */
export function formatWeekday(value: Date | string, locale: string): string {
  if (typeof value === 'string') rejectStorageKey(value);
  const date = typeof value === 'string' ? new Date(value) : value;

  return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
}

/**
 * "3 days ago", "yesterday", "today".
 *
 * `numeric: 'auto'` is what produces "yesterday" instead of "1 day ago" — the
 * word a person would actually use.
 */
export function formatRelativeDays(days: number, locale: string): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    days,
    'day',
  );
}

/** Whole days from one day key to another. Negative means in the past. */
export function daysBetweenKeys(from: string, to: string): number {
  const a = dayKeyToDate(from);
  const b = dayKeyToDate(to);
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/** "1,024". Grouping separators are a locale property too. */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/* ------------------------------------------------------------------ *
 * Days, as days
 * ------------------------------------------------------------------ */

/**
 * "Friday night", "Last Sunday", "Two weeks ago".
 *
 * G5, G6 and G7 all label entries this way, and g6's caption says why:
 * "Days feel like days -- 'Tuesday evening', not a timestamp." A journal is
 * not a log. Someone scrolling their own writing is looking for the night
 * they remember, not for 2026-02-13T21:44:10Z, and a precise timestamp on a
 * bad evening reads back like evidence.
 *
 * WHY THIS RETURNS A DESCRIPTOR RATHER THAN A STRING.
 *
 * The phrasing is translatable copy and belongs in `journal.json`, but the
 * *branching* -- which of the six shapes applies -- is calendar logic that
 * has to be identical in every locale and testable in Node. Returning
 * `{ kind, ... }` keeps the two apart: this function never concatenates a
 * sentence, and the JSON never decides what "last week" means.
 *
 * The one thing it does render is the weekday name, because that is
 * `Intl.DateTimeFormat`'s job and no translation file should be carrying a
 * list of weekdays.
 */
export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type DayLabel =
  | { kind: 'today'; partOfDay: PartOfDay }
  | { kind: 'yesterday' }
  | { kind: 'thisWeek'; weekday: string; partOfDay: PartOfDay }
  | { kind: 'lastWeek'; weekday: string }
  | { kind: 'weeksAgo'; weeks: number }
  | { kind: 'date'; date: string };

/**
 * Boundaries chosen so the word matches what someone would say, not what a
 * clock would: 9pm is "tonight" and 5am is still "night", because at 3am
 * nobody describes the thing they just wrote as having happened "this
 * morning".
 */
export function partOfDay(value: Date): PartOfDay {
  const hour = value.getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/** Whole days between two moments, by calendar day and not by elapsed hours. */
function calendarDaysApart(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * How a moment should be described, relative to now.
 *
 * Past four weeks it becomes a plain date. "Nine weeks ago" is arithmetic
 * about someone's life rather than a memory of it, and by that distance a
 * date is the more useful of the two anyway.
 */
export function describeDay(
  value: Date,
  locale: string,
  now: Date = new Date(),
): DayLabel {
  const days = calendarDaysApart(value, now);

  if (days <= 0) return { kind: 'today', partOfDay: partOfDay(value) };
  if (days === 1) return { kind: 'yesterday' };

  const weekday = formatWeekday(value, locale);

  // Within the last six days it is still "Friday night" -- close enough that
  // the weekday alone locates it.
  if (days < 7) return { kind: 'thisWeek', weekday, partOfDay: partOfDay(value) };
  if (days < 14) return { kind: 'lastWeek', weekday };
  if (days < 28) return { kind: 'weeksAgo', weeks: Math.floor(days / 7) };

  return { kind: 'date', date: formatDate(value, locale) };
}
