import { describe, expect, it } from 'vitest';

import {
  availability,
  hasOpened,
  msUntilNextWindow,
  nextWindow,
  todaysWindow,
  windowOpensOn,
  type WindowSpec,
} from './schedule';

/**
 * These tests read the machine's local timezone.
 *
 * The DST cases below are written for `TZ=Europe/London`, which is what CI
 * and the commit script set. In a zone with no DST they still pass — the
 * assertions are about the window landing on the same wall-clock time, which
 * is trivially true when the offset never moves — so they degrade to weaker
 * tests rather than failing ones. `describes DST` says so explicitly.
 */
const spec: WindowSpec = { time: '19:00', minutes: 15 };

/** Whether the local zone actually shifts across the given days. */
function zoneShifts(before: Date, after: Date): boolean {
  return before.getTimezoneOffset() !== after.getTimezoneOffset();
}

describe('windowOpensOn', () => {
  it('resolves a day key and a wall-clock time to a local instant', () => {
    const at = windowOpensOn('2026-03-14', '19:00');

    expect(at.getFullYear()).toBe(2026);
    expect(at.getMonth()).toBe(2);
    expect(at.getDate()).toBe(14);
    expect(at.getHours()).toBe(19);
    expect(at.getMinutes()).toBe(0);
  });

  it('handles midnight and the last minute of the day', () => {
    expect(windowOpensOn('2026-03-14', '00:00').getHours()).toBe(0);
    expect(windowOpensOn('2026-03-14', '23:59').getMinutes()).toBe(59);
  });
});

describe('hasOpened', () => {
  it('is false a minute before and true on the minute', () => {
    expect(hasOpened(new Date(2026, 2, 14, 18, 59), spec)).toBe(false);
    expect(hasOpened(new Date(2026, 2, 14, 19, 0), spec)).toBe(true);
  });

  it('stays open for the rest of the day', () => {
    // There is no closing time, deliberately. `minutes` sizes the session,
    // not a deadline — a window that could be missed would make this a chore
    // with a due date, which is the opposite of what it is for (D-008).
    expect(hasOpened(new Date(2026, 2, 14, 23, 58), spec)).toBe(true);
  });

  it('is closed again the next morning', () => {
    expect(hasOpened(new Date(2026, 2, 15, 7, 0), spec)).toBe(false);
  });
});

describe('nextWindow', () => {
  it('is today when today is still ahead', () => {
    const at = nextWindow(new Date(2026, 2, 14, 9, 0), spec);

    expect(at.getDate()).toBe(14);
    expect(at.getHours()).toBe(19);
  });

  it('is tomorrow once today has passed', () => {
    const at = nextWindow(new Date(2026, 2, 14, 20, 0), spec);

    expect(at.getDate()).toBe(15);
    expect(at.getHours()).toBe(19);
  });

  it('rolls over a month boundary', () => {
    const at = nextWindow(new Date(2026, 2, 31, 20, 0), spec);

    expect(at.getMonth()).toBe(3);
    expect(at.getDate()).toBe(1);
    expect(at.getHours()).toBe(19);
  });

  it('rolls over a year boundary', () => {
    const at = nextWindow(new Date(2026, 11, 31, 20, 0), spec);

    expect(at.getFullYear()).toBe(2027);
    expect(at.getMonth()).toBe(0);
    expect(at.getDate()).toBe(1);
  });

  it('crosses a leap day', () => {
    const at = nextWindow(new Date(2028, 1, 28, 20, 0), spec);

    expect(at.getMonth()).toBe(1);
    expect(at.getDate()).toBe(29);
  });

  it('never returns a negative wait', () => {
    expect(msUntilNextWindow(new Date(2026, 2, 14, 19, 0), spec)).toBeGreaterThan(0);
  });
});

describe('DST', () => {
  /**
   * The bug these exist to prevent is `+ 24 * 60 * 60 * 1000`.
   *
   * Adding a fixed day to yesterday's instant gives a window an hour early in
   * spring and an hour late in autumn. An hour early is the one that matters:
   * a notification and a window that arrive at 18:00 because the clocks moved
   * is the app being wrong about the evening, on the two days a year when
   * everyone is already slightly disoriented.
   */

  it('keeps the wall-clock time across spring forward', () => {
    // Europe/London: 2026-03-29, 01:00 -> 02:00.
    const before = new Date(2026, 2, 28, 20, 0);
    const at = nextWindow(before, spec);

    expect(at.getDate()).toBe(29);
    expect(at.getHours()).toBe(19);

    if (zoneShifts(before, at)) {
      // 23 hours of real time, not 24 — which is the point.
      expect(at.getTime() - windowOpensOn('2026-03-28', '19:00').getTime()).toBe(
        23 * 60 * 60 * 1000,
      );
    }
  });

  it('keeps the wall-clock time across autumn back', () => {
    // Europe/London: 2026-10-25, 02:00 -> 01:00.
    const before = new Date(2026, 9, 24, 20, 0);
    const at = nextWindow(before, spec);

    expect(at.getDate()).toBe(25);
    expect(at.getHours()).toBe(19);

    if (zoneShifts(before, at)) {
      expect(at.getTime() - windowOpensOn('2026-10-24', '19:00').getTime()).toBe(
        25 * 60 * 60 * 1000,
      );
    }
  });

  it('opens exactly once on the day the clocks go back', () => {
    // The 25th has two 01:30s. A window at 01:30 must still be one window.
    const early: WindowSpec = { time: '01:30', minutes: 15 };
    const at = todaysWindow(new Date(2026, 9, 25, 12, 0), early);

    expect(at.getDate()).toBe(25);
    expect(at.getHours()).toBe(1);
    expect(at.getMinutes()).toBe(30);
  });

  it('still resolves a window set inside the skipped hour', () => {
    // 2026-03-29 01:30 does not exist in Europe/London. The platform pushes
    // it forward rather than throwing; what matters is that the app gets a
    // real instant on the right date and does not schedule nothing at all.
    const skipped: WindowSpec = { time: '01:30', minutes: 15 };
    const at = todaysWindow(new Date(2026, 2, 29, 12, 0), skipped);

    expect(Number.isNaN(at.getTime())).toBe(false);
    expect(at.getDate()).toBe(29);
  });
});

describe('availability', () => {
  it('waits before and opens after', () => {
    expect(availability(new Date(2026, 2, 14, 12, 0), spec)).toBe('waiting');
    expect(availability(new Date(2026, 2, 14, 21, 0), spec)).toBe('open');
  });

  it('has no state that means missed', () => {
    // Typed as a two-member union on purpose. If a third state is ever added,
    // this is where the tone question gets asked: D-008 forbids "missed",
    // "overdue" and "forgot" anywhere in this feature.
    const states = new Set(
      [3, 9, 15, 19, 23].map((hour) =>
        availability(new Date(2026, 2, 14, hour, 0), spec),
      ),
    );

    expect([...states].sort()).toEqual(['open', 'waiting']);
  });
});
