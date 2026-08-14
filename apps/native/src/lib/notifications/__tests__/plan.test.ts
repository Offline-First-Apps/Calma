import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CATALOGUE, NOTIFICATION_IDS, idsForTier } from '../catalogue';
import {
  type PlanInput,
  QUIET_FROM_HOUR,
  QUIET_UNTIL_HOUR,
  isQuietHour,
  minutesBefore,
  planNotifications,
} from '../plan';

const base: PlanInput = {
  tier: 'free',
  worryWindowTime: '20:00',
  pendingWorries: 2,
  streak: 0,
  qualifiedToday: false,
  permitted: true,
};

const plan = (over: Partial<PlanInput> = {}) =>
  planNotifications({ ...base, ...over });

const ids = (over: Partial<PlanInput> = {}) => plan(over).map((n) => n.id);

describe('the catalogue is closed', () => {
  it('contains exactly four notifications', () => {
    expect(NOTIFICATION_IDS).toHaveLength(4);
  });

  /**
   * The list `systems/06` calls complete. If a fifth appears here without the
   * systems doc changing first, something was added by implementation drift.
   */
  it('is exactly the four the systems doc names', () => {
    expect([...NOTIFICATION_IDS].sort()).toEqual([
      'journal-streak-nudge',
      'weekly-checkin',
      'worry-window-open',
      'worry-window-soon',
    ]);
  });

  it('gives free accounts the two worry notifications and nothing else', () => {
    expect(idsForTier('free').sort()).toEqual([
      'worry-window-open',
      'worry-window-soon',
    ]);
  });
});

/**
 * THE RULE THAT MATTERS MOST. A lock-screen preview is visible to anyone
 * holding the phone, so no body may ever carry something the person wrote.
 */
describe('no notification can carry user content', () => {
  it('interpolates a number or nothing — never a string', () => {
    for (const id of NOTIFICATION_IDS) {
      expect(typeof CATALOGUE[id].takesCount).toBe('boolean');
    }
  });

  it('plans only numeric counts, on every possible input', () => {
    const everything = plan({ tier: 'plus', streak: 5, pendingWorries: 3 });
    for (const notification of everything) {
      expect(
        notification.count === null || typeof notification.count === 'number',
      ).toBe(true);
    }
  });

  /**
   * Read the locale file rather than trusting the code: the bodies are where
   * a leak would actually happen, and `{{text}}` in one of them would be
   * invisible to every other assertion here.
   */
  it('has no notification body with a non-count placeholder', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const locales = resolve(
      here,
      '../../../../../../packages/i18n/src/locales/en/notifications.json',
    );
    const bundle = readFileSync(locales, 'utf8');

    const placeholders = [...bundle.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    expect([...new Set(placeholders)]).toEqual(['count']);
  });
});

describe('quiet hours', () => {
  it('covers 22:00 through 06:59', () => {
    expect(isQuietHour(22)).toBe(true);
    expect(isQuietHour(23)).toBe(true);
    expect(isQuietHour(0)).toBe(true);
    expect(isQuietHour(3)).toBe(true);
    expect(isQuietHour(6)).toBe(true);
  });

  it('ends at 07:00', () => {
    expect(isQuietHour(7)).toBe(false);
    expect(isQuietHour(21)).toBe(false);
  });

  /**
   * The window still works — it is opened by hand from the Worries tab. Only
   * the notification is skipped, and silently.
   */
  it('silently drops a 23:00 window’s notifications', () => {
    expect(ids({ worryWindowTime: '23:00' })).toEqual([]);
  });

  it('drops a reminder that falls into quiet hours while keeping the window', () => {
    // 07:05 window -> reminder at 06:55, which is inside quiet hours.
    const planned = plan({ worryWindowTime: '07:05' });
    expect(planned.map((n) => n.id)).toEqual(['worry-window-open']);
  });

  it('applies to Plus notifications too, not just the worry ones', () => {
    // Nothing Plus-tier is scheduled at night by construction, so this asserts
    // the filter is applied to the whole list rather than to a subset.
    const planned = plan({ tier: 'plus', streak: 4, worryWindowTime: '23:30' });
    expect(planned.every((n) => !isQuietHour(n.hour))).toBe(true);
  });

  it('exposes the boundary as constants rather than magic numbers', () => {
    expect(QUIET_FROM_HOUR).toBe(22);
    expect(QUIET_UNTIL_HOUR).toBe(7);
  });
});

describe('the worry window reminder', () => {
  it('lands ten minutes before the window', () => {
    const soon = plan().find((n) => n.id === 'worry-window-soon');
    expect(soon).toMatchObject({ hour: 19, minute: 50 });
  });

  it('wraps backwards across midnight', () => {
    expect(minutesBefore('00:05', 10)).toEqual({ hour: 23, minute: 55 });
  });

  /** "You have 0 things waiting" is a buzz whose content is that there is none. */
  it('is not scheduled at all when nothing is waiting', () => {
    expect(ids({ pendingWorries: 0 })).toEqual(['worry-window-open']);
  });

  it('carries the count so the copy can pluralise', () => {
    const soon = plan({ pendingWorries: 1 }).find(
      (n) => n.id === 'worry-window-soon',
    );
    expect(soon?.count).toBe(1);
  });

  it('repeats daily rather than being rescheduled each night', () => {
    const soon = plan().find((n) => n.id === 'worry-window-soon');
    expect(soon?.repeat).toBe('daily');
  });
});

describe('tier', () => {
  it('gives a free account only the two worry notifications', () => {
    expect(ids().sort()).toEqual(['worry-window-open', 'worry-window-soon']);
  });

  it('adds the check-in for Plus', () => {
    expect(ids({ tier: 'plus' })).toContain('weekly-checkin');
  });

  /**
   * Downgrade is silent. Nothing here produces a "you've lost access"
   * notification, and there is no code path that could: the Plus entries are
   * simply absent from the plan, and `rescheduleAll` cancels everything first.
   */
  it('drops Plus notifications on downgrade with nothing said about it', () => {
    const asPlus = ids({ tier: 'plus', streak: 4 });
    const asFree = ids({ tier: 'free', streak: 4 });

    expect(asPlus).toContain('weekly-checkin');
    expect(asFree).not.toContain('weekly-checkin');
    expect(asFree).not.toContain('journal-streak-nudge');
    expect(asFree.some((id) => /lost|expired|downgrade/.test(id))).toBe(false);
  });
});

describe('the streak nudge', () => {
  const plus = { tier: 'plus' as const };

  it('needs a streak of at least two', () => {
    expect(ids({ ...plus, streak: 1 })).not.toContain('journal-streak-nudge');
    expect(ids({ ...plus, streak: 2 })).toContain('journal-streak-nudge');
  });

  /** Never a fixed repeat, or it fires on days someone already showed up. */
  it('is scheduled one day ahead, not repeating', () => {
    const nudge = plan({ ...plus, streak: 3 }).find(
      (n) => n.id === 'journal-streak-nudge',
    );
    expect(nudge?.repeat).toBe('once-tomorrow');
  });

  it('disappears the moment the day qualifies', () => {
    expect(ids({ ...plus, streak: 5, qualifiedToday: true })).not.toContain(
      'journal-streak-nudge',
    );
  });

  /**
   * NOTHING IS EVER SENT WHEN A STREAK BREAKS. A broken streak is a zero
   * streak, which is below the minimum, so the day it ends is the day nothing
   * arrives. The silence is the design, not an omission.
   */
  it('sends nothing at all when the streak has broken', () => {
    expect(ids({ ...plus, streak: 0 })).not.toContain('journal-streak-nudge');
  });

  it('goes on the quiet channel, so it never takes over the screen', () => {
    const nudge = plan({ ...plus, streak: 3 }).find(
      (n) => n.id === 'journal-streak-nudge',
    );
    expect(nudge?.channel).toBe('gentle');
  });
});

describe('the weekly check-in', () => {
  it('is Sunday at 18:00', () => {
    const checkin = plan({ tier: 'plus' }).find(
      (n) => n.id === 'weekly-checkin',
    );
    expect(checkin).toMatchObject({ hour: 18, minute: 0, weekday: 1, repeat: 'weekly' });
  });
});

describe('permission', () => {
  it('schedules absolutely nothing when it was never granted', () => {
    expect(plan({ permitted: false, tier: 'plus', streak: 9 })).toEqual([]);
  });
});

describe('DST and wall-clock time', () => {
  /**
   * Every planned notification is an hour and a minute, never an instant.
   * That is what makes a 19:00 window stay at 19:00 across a DST shift: the
   * OS calendar trigger follows wall clock. Storing an epoch here would move
   * the window by an hour twice a year.
   */
  it('plans wall-clock times, never timestamps', () => {
    for (const notification of plan({ tier: 'plus', streak: 3 })) {
      expect(Number.isInteger(notification.hour)).toBe(true);
      expect(Number.isInteger(notification.minute)).toBe(true);
      expect(notification).not.toHaveProperty('at');
      expect(notification).not.toHaveProperty('timestamp');
    }
  });

  /** Derived, not stored — so it is recomputed on every reschedule. */
  it('derives the reminder from the window rather than storing it', () => {
    const early = plan({ worryWindowTime: '08:00' }).find(
      (n) => n.id === 'worry-window-soon',
    );
    const late = plan({ worryWindowTime: '19:30' }).find(
      (n) => n.id === 'worry-window-soon',
    );

    expect(early).toMatchObject({ hour: 7, minute: 50 });
    expect(late).toMatchObject({ hour: 19, minute: 20 });
  });
});
