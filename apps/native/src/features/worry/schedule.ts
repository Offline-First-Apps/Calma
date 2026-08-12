import { dayKey, shiftDayKey } from '@calma/domain';

/**
 * When the worry window opens, and whether it is open now.
 *
 * THE RULE: THE WINDOW IS A WALL-CLOCK TIME, NOT AN INSTANT.
 *
 * `worryWindowTime` is `'19:00'` — seven in the evening, wherever the person
 * is, whatever the clocks did last night. It is never stored with an offset
 * and never converted to UTC, because both of those turn "evening" into a
 * fixed number of milliseconds and evening is not a duration.
 *
 * Everything below therefore goes through local calendar fields, the same way
 * `dayKey` does. `new Date(y, m, d, hh, mm)` asks the platform for the instant
 * at which the local clock reads that time, which is the question we actually
 * have. Adding 24 hours to yesterday's answer is a different question, and on
 * two days a year it gets a different answer — an hour early in spring, an
 * hour late in autumn.
 *
 * DST, concretely. On the spring-forward morning 02:30 does not exist; on the
 * autumn morning it exists twice. A worry window is never scheduled at 02:30,
 * but a person can set one there, so the behaviour is pinned by test rather
 * than left to chance: the platform resolves a skipped time forward and an
 * ambiguous one to the first occurrence, and the window still opens once.
 *
 * TIMEZONE CHANGES. Nothing is cached across calls. Every question is
 * answered from `now` and the current zone, so stepping off a plane
 * recomputes the next window rather than replaying or skipping one. There is
 * no stored "next window at" instant that could disagree with the clock —
 * that absence is the design, not an omission.
 */

/** `'HH:mm'`, 24-hour, local wall clock. */
export type TimeOfDay = string;

export interface WindowSpec {
  /** `Prefs.worryWindowTime`. */
  time: TimeOfDay;
  /** `Prefs.worryWindowMinutes`. How long it stays "open" for. */
  minutes: number;
}

function parse(time: TimeOfDay): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/** The instant at which the local clock reads `time` on the given day key. */
export function windowOpensOn(dayKeyValue: string, time: TimeOfDay): Date {
  const [year, month, day] = dayKeyValue.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  const { hours, minutes } = parse(time);

  // Local calendar fields, deliberately. See the note at the top of the file.
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/** Today's opening, whether or not it has happened yet. */
export function todaysWindow(now: Date, spec: WindowSpec): Date {
  return windowOpensOn(dayKey(now), spec.time);
}

/**
 * Whether the window has opened today.
 *
 * Note there is no closing time in this predicate. `minutes` sizes the
 * *session*, not a deadline: once the window has opened it stays open for the
 * rest of the day, and the copy never says "missed" (D-008). A person who
 * gets to it at 11pm has not failed at 8pm.
 */
export function hasOpened(now: Date, spec: WindowSpec): boolean {
  return now.getTime() >= todaysWindow(now, spec).getTime();
}

/**
 * The next opening from `now` — today's if it is still ahead, else tomorrow's.
 *
 * Tomorrow is `shiftDayKey`, not `+ 24h`. That is the whole DST fix in one
 * line: the day key moves by a calendar day and the time is re-resolved
 * against it, so a 23-hour day produces a 23-hour gap and the window still
 * lands at 19:00.
 */
export function nextWindow(now: Date, spec: WindowSpec): Date {
  const today = todaysWindow(now, spec);
  if (now.getTime() < today.getTime()) return today;

  return windowOpensOn(shiftDayKey(dayKey(now), 1), spec.time);
}

/** Milliseconds until the next opening. Never negative. */
export function msUntilNextWindow(now: Date, spec: WindowSpec): number {
  return Math.max(0, nextWindow(now, spec).getTime() - now.getTime());
}

/**
 * What the Worries tab should offer.
 *
 * Two states rather than three: waiting, or openable. There is no "closed
 * again" and no "expired", because a window that could be missed would make
 * this a chore with a deadline, which is the specific thing worry
 * postponement is supposed to relieve.
 */
export type WindowAvailability = 'waiting' | 'open';

export function availability(now: Date, spec: WindowSpec): WindowAvailability {
  return hasOpened(now, spec) ? 'open' : 'waiting';
}

/*
 * Formatting the time for display is deliberately NOT here. It lives with the
 * other Intl formatters in `@calma/i18n` (`formatWindowTime`), because 12h
 * versus 24h is a property of the locale and every rule about that belongs in
 * one file (systems/10-i18n.md § Formatting).
 */
