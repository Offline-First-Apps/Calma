import type { BreathingSession } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import { barFractions, buildWeek } from '../week';

const DAYS = [
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
];

function session(
  startedAt: Date,
  durationSec: number,
): BreathingSession {
  return {
    id: `s-${startedAt.getTime()}`,
    pattern: 'physiological-sigh',
    entryPoint: 'breathe-tab',
    startedAt: startedAt.getTime(),
    durationSec,
    cyclesCompleted: 3,
    preSuds: null,
    postFeeling: null,
    completed: true,
  };
}

function byDay(
  entries: Record<string, BreathingSession[]>,
): Map<string, BreathingSession[]> {
  return new Map(Object.entries(entries));
}

describe('buildWeek', () => {
  it('returns one bar per day, in the order given', () => {
    const week = buildWeek(DAYS, byDay({}));
    expect(week.days.map((d) => d.day)).toEqual(DAYS);
  });

  it('sums the seconds actually breathed, not the sessions started', () => {
    const week = buildWeek(
      DAYS,
      byDay({
        '2026-08-12': [
          session(new Date(2026, 7, 12, 9, 0), 240),
          session(new Date(2026, 7, 12, 14, 0), 60),
        ],
      }),
    );

    const wed = week.days.find((d) => d.day === '2026-08-12');
    expect(wed).toEqual({ day: '2026-08-12', sessions: 2, seconds: 300 });
  });

  it('counts sessions that started at night, across midnight', () => {
    const week = buildWeek(
      DAYS,
      byDay({
        '2026-08-10': [session(new Date(2026, 7, 10, 22, 30), 120)],
        '2026-08-13': [session(new Date(2026, 7, 13, 3, 10), 90)],
        '2026-08-14': [session(new Date(2026, 7, 14, 13, 0), 90)],
      }),
    );

    expect(week.atNight).toBe(2);
  });
});

describe('barFractions', () => {
  it('scales to the week\'s own tallest day, never to a target', () => {
    const week = buildWeek(
      DAYS,
      byDay({
        '2026-08-10': [session(new Date(2026, 7, 10, 9, 0), 120)],
        '2026-08-12': [session(new Date(2026, 7, 12, 9, 0), 240)],
      }),
    );

    const fractions = barFractions(week);
    expect(fractions[0]).toBe(0.5);
    expect(fractions[2]).toBe(1);
  });

  /**
   * The point of scaling to self. A quiet week must not render as a flat line
   * just because a busier one exists in the person's history.
   */
  it('gives a four-minute week the same shape as a forty-minute week', () => {
    const quiet = barFractions(
      buildWeek(DAYS, byDay({
        '2026-08-10': [session(new Date(2026, 7, 10, 9, 0), 60)],
        '2026-08-12': [session(new Date(2026, 7, 12, 9, 0), 180)],
      })),
    );
    const busy = barFractions(
      buildWeek(DAYS, byDay({
        '2026-08-10': [session(new Date(2026, 7, 10, 9, 0), 600)],
        '2026-08-12': [session(new Date(2026, 7, 12, 9, 0), 1800)],
      })),
    );

    expect(quiet).toEqual(busy);
  });

  it('is all zeroes for a week with nothing in it, and does not divide by zero', () => {
    const fractions = barFractions(buildWeek(DAYS, byDay({})));
    expect(fractions).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(fractions.every(Number.isFinite)).toBe(true);
  });
});
