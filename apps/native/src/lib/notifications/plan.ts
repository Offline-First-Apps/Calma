import type { Tier } from '@calma/domain';

import {
  CATALOGUE,
  type ChannelId,
  type NotificationId,
} from './catalogue';

/**
 * What should be scheduled, given the current state of everything.
 *
 * PURE, AND IT IS THE WHOLE FEATURE. Every rule in
 * `systems/06-notifications.md` that could go wrong at 2am lives here rather
 * than inside `expo-notifications` call sites: quiet hours, the zero
 * suppression, the tier split, the derived reminder time. A rule that can only
 * be checked by scheduling a real notification and waiting is a rule that
 * stops being checked.
 *
 * The native half (`schedule.ts`) does exactly two things: cancel everything,
 * then hand this list to the OS. There is no other scheduling path, because
 * incremental scheduling drifts — and a drifted notification in this app means
 * one arriving at a bad time.
 */

export interface PlannedNotification {
  id: NotificationId;
  channel: ChannelId;
  /** The `notifications` i18n key for the body. */
  bodyKey: string;
  /** The only interpolation any body gets. `null` when the body takes none. */
  count: number | null;
  /** Local wall-clock hour and minute. Never an instant. See the DST note. */
  hour: number;
  minute: number;
  /** `daily`, `weekly` on `weekday`, or a single fire one day ahead. */
  repeat: 'daily' | 'weekly' | 'once-tomorrow';
  /** 1 = Sunday, matching `expo-notifications`. Only set for `weekly`. */
  weekday?: number;
}

export interface PlanInput {
  tier: Tier;
  /** `HH:mm`, the worry window's start. */
  worryWindowTime: string;
  /** Worries waiting. Zero means the reminder is not scheduled at all. */
  pendingWorries: number;
  /** Current streak length. The nudge needs >= 2. */
  streak: number;
  /** Whether today already counts, in which case the nudge is not scheduled. */
  qualifiedToday: boolean;
  /** False when permission was never granted, or was revoked. */
  permitted: boolean;
}

/**
 * QUIET HOURS: 22:00 TO 07:00, AND NOTHING GETS AN EXEMPTION.
 *
 * Not a preference, not overridable, and applied after every other rule. If
 * someone sets their worry window to 23:00 the reminder is silently skipped
 * and the window itself still works, opened from the app. A notification at
 * 2am is the exact thing this product exists to prevent, and the one place
 * that rule can be enforced for every notification at once is here.
 */
export const QUIET_FROM_HOUR = 22;
export const QUIET_UNTIL_HOUR = 7;

export function isQuietHour(hour: number): boolean {
  return hour >= QUIET_FROM_HOUR || hour < QUIET_UNTIL_HOUR;
}

/** How far ahead of the window the reminder lands. */
export const REMINDER_LEAD_MINUTES = 10;

/** 20:00, and Sunday 18:00. Both inside waking hours by construction. */
const STREAK_NUDGE_HOUR = 20;
const CHECKIN_HOUR = 18;
const CHECKIN_WEEKDAY = 1; // Sunday, in expo-notifications' 1-based scheme.

/** The minimum streak worth mentioning. One day is not a run. */
export const STREAK_NUDGE_MINIMUM = 2;

interface Clock {
  hour: number;
  minute: number;
}

/** `HH:mm` minus whole minutes, wrapping backwards past midnight. */
export function minutesBefore(hhmm: string, minutes: number): Clock {
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  const total = (h * 60 + m - minutes + 24 * 60) % (24 * 60);
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

function parse(hhmm: string): Clock {
  const [hour, minute] = hhmm.split(':').map(Number) as [number, number];
  return { hour, minute };
}

/**
 * The complete schedule, from current state.
 *
 * Returns `[]` for anything that should not be scheduled rather than
 * scheduling something suppressed — there is no "disabled notification" state
 * to get wrong, and cancelling everything before applying this list means the
 * OS ends up with exactly what this function returns.
 */
export function planNotifications(input: PlanInput): PlannedNotification[] {
  // No permission, no schedule. Everything else in the app still works: the
  // worry window is opened by hand from the Worries tab.
  if (!input.permitted) return [];

  const planned: PlannedNotification[] = [];

  const windowStart = parse(input.worryWindowTime);
  const reminder = minutesBefore(input.worryWindowTime, REMINDER_LEAD_MINUTES);

  /*
   * ZERO IS NOT SCHEDULED, IT IS ABSENT.
   *
   * "Your worry window opens soon. You have 0 things waiting." is a
   * notification whose only content is that there was nothing to tell you.
   * `systems/06` says so explicitly, and it is also the difference between a
   * note from a friend and an app finding a reason to buzz.
   */
  if (input.pendingWorries > 0) {
    planned.push({
      id: 'worry-window-soon',
      ...entry('worry-window-soon'),
      count: input.pendingWorries,
      hour: reminder.hour,
      minute: reminder.minute,
      repeat: 'daily',
    });
  }

  planned.push({
    id: 'worry-window-open',
    ...entry('worry-window-open'),
    count: null,
    hour: windowStart.hour,
    minute: windowStart.minute,
    repeat: 'daily',
  });

  if (input.tier === 'plus') {
    /*
     * The nudge is scheduled ONE DAY AHEAD and cancelled the moment the day
     * qualifies — never a fixed repeat, which would fire on days somebody
     * already showed up. And it is never sent when a streak BREAKS: this is
     * scheduled only while the streak is alive, so the day it ends is the day
     * nothing arrives. That silence is the design.
     */
    if (input.streak >= STREAK_NUDGE_MINIMUM && !input.qualifiedToday) {
      planned.push({
        id: 'journal-streak-nudge',
        ...entry('journal-streak-nudge'),
        count: input.streak,
        hour: STREAK_NUDGE_HOUR,
        minute: 0,
        repeat: 'once-tomorrow',
      });
    }

    planned.push({
      id: 'weekly-checkin',
      ...entry('weekly-checkin'),
      count: null,
      hour: CHECKIN_HOUR,
      minute: 0,
      repeat: 'weekly',
      weekday: CHECKIN_WEEKDAY,
    });
  }

  // Applied last, to everything, with no exceptions.
  return planned.filter((notification) => !isQuietHour(notification.hour));
}

function entry(id: NotificationId): { channel: ChannelId; bodyKey: string } {
  const { channel, bodyKey } = CATALOGUE[id];
  return { channel, bodyKey };
}
