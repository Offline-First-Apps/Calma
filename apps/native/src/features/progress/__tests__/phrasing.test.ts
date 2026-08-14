import { EMPTY_WEEK, type WeekAggregate } from '@calma/db';
import { EMPTY_STREAK, type Streak } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import {
  describeBreathing,
  describeStreak,
  describeWorries,
  describeWriting,
  hasAnything,
  isNight,
  quietWeekNote,
  roundMinutes,
  weekOpener,
} from '../phrasing';

const week = (over: Partial<WeekAggregate> = {}): WeekAggregate => ({
  ...EMPTY_WEEK,
  ...over,
});

const streak = (current: number): Streak => ({
  ...EMPTY_STREAK,
  current,
  longest: Math.max(current, 6),
});

describe('roundMinutes', () => {
  it('keeps small numbers exact, because four and seven minutes differ', () => {
    expect(roundMinutes(4)).toEqual({ value: 4, approximate: false });
    expect(roundMinutes(9)).toEqual({ value: 9, approximate: false });
  });

  it('rounds to the nearest five above ten', () => {
    expect(roundMinutes(23)).toEqual({ value: 25, approximate: true });
    expect(roundMinutes(18)).toEqual({ value: 20, approximate: true });
  });

  it('does not say "about" when the number landed exactly', () => {
    expect(roundMinutes(20)).toEqual({ value: 20, approximate: false });
    expect(roundMinutes(45)).toEqual({ value: 45, approximate: false });
  });

  it('never returns a negative or a fractional minute', () => {
    expect(roundMinutes(0).value).toBe(0);
    expect(roundMinutes(-5).value).toBe(0);
    expect(Number.isInteger(roundMinutes(23).value)).toBe(true);
  });
});

describe('isNight', () => {
  it('counts the 3am session the product exists for', () => {
    expect(isNight(new Date(2026, 7, 13, 3, 0))).toBe(true);
    expect(isNight(new Date(2026, 7, 13, 4, 59))).toBe(true);
  });

  it('starts after the worry window rather than at midnight', () => {
    expect(isNight(new Date(2026, 7, 13, 21, 0))).toBe(true);
    expect(isNight(new Date(2026, 7, 13, 23, 30))).toBe(true);
    expect(isNight(new Date(2026, 7, 13, 20, 59))).toBe(false);
  });

  it('is false across the working day', () => {
    expect(isNight(new Date(2026, 7, 13, 5, 0))).toBe(false);
    expect(isNight(new Date(2026, 7, 13, 14, 0))).toBe(false);
  });
});

describe('weekOpener', () => {
  it('drops the night clause entirely when there is nothing to say', () => {
    expect(weekOpener(4, 0)).toEqual({
      key: 'week.opener',
      params: { count: 4 },
    });
  });

  it('carries both counts when some were at night', () => {
    expect(weekOpener(4, 2)).toEqual({
      key: 'week.openerNight',
      params: { count: 4, night: 2 },
    });
  });

  it('says nothing at all for a week with no sessions', () => {
    expect(weekOpener(0, 0)).toBeNull();
  });
});

/**
 * The rule the whole file exists for. If any of these start returning a
 * phrase, h1 becomes a grid of noughts — a list of things you did not do.
 */
describe('never a zero', () => {
  it('returns null from every tile on an empty week', () => {
    const empty = week();
    expect(describeBreathing(empty)).toBeNull();
    expect(describeWorries(empty)).toBeNull();
    expect(describeWriting(empty)).toBeNull();
    expect(describeStreak(EMPTY_STREAK)).toBeNull();
  });

  it('returns null for a streak that has just broken', () => {
    expect(describeStreak({ current: 0, longest: 31, lastQualifyingDay: '2026-07-01' })).toBeNull();
  });
});

describe('describeBreathing', () => {
  it('says "about" only when it rounded', () => {
    expect(describeBreathing(week({ sessions: 4, totalMinutes: 23 }))).toEqual({
      key: 'tiles.breathingApprox',
      params: { count: 25 },
    });
    expect(describeBreathing(week({ sessions: 4, totalMinutes: 20 }))).toEqual({
      key: 'tiles.breathing',
      params: { count: 20 },
    });
  });

  /**
   * A forty-second session is a real session. Rounding it to "0 minutes" would
   * be the app telling someone the thing they did did not count.
   */
  it('never renders a session as zero minutes', () => {
    const phrase = describeBreathing(week({ sessions: 1, totalMinutes: 0 }));
    expect(phrase).toEqual({ key: 'tiles.breathingBrief' });
  });
});

describe('describeWorries', () => {
  it('counts processed and released together — both were looked at', () => {
    expect(
      describeWorries(week({ worriesProcessed: 1, worriesReleased: 2 })),
    ).toEqual({ key: 'tiles.worries', params: { count: 3 } });
  });

  it('does not split the plan/let-go tally, which belongs to h3', () => {
    const phrase = describeWorries(week({ worriesProcessed: 1, worriesReleased: 2 }));
    expect(phrase?.params).not.toHaveProperty('released');
    expect(phrase?.params).not.toHaveProperty('processed');
  });
});

describe('describeStreak', () => {
  it('carries the current run and nothing else', () => {
    expect(describeStreak(streak(6))).toEqual({
      key: 'streak',
      params: { count: 6 },
    });
  });

  /** A personal best is a thing to fall short of. h3's caption forbids it. */
  it('never exposes the longest streak', () => {
    const phrase = describeStreak(streak(2));
    expect(phrase?.params).not.toHaveProperty('longest');
    expect(JSON.stringify(phrase)).not.toContain('6');
  });
});

describe('hasAnything', () => {
  it('is false only when the week and the streak are both silent', () => {
    expect(hasAnything(week(), EMPTY_STREAK)).toBe(false);
  });

  it('is true for a single session — one tile beats "nothing yet"', () => {
    expect(hasAnything(week({ sessions: 1 }), EMPTY_STREAK)).toBe(true);
  });

  it('is true for a live streak in a week with nothing else logged yet', () => {
    expect(hasAnything(week(), streak(3))).toBe(true);
  });
});

describe('quietWeekNote', () => {
  it('reassures on a quiet week', () => {
    expect(quietWeekNote(week({ sessions: 1 }))).toEqual({ key: 'week.quiet' });
  });

  it('says nothing on a busy week, because there is nothing to reassure', () => {
    expect(quietWeekNote(week({ sessions: 4, journalEntries: 2 }))).toBeNull();
  });

  /** An empty week gets the empty state, not a consolation line. */
  it('says nothing on an empty week', () => {
    expect(quietWeekNote(week())).toBeNull();
  });
});
