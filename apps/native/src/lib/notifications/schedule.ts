import {
  SchedulableTriggerInputTypes,
  cancelAllScheduledNotificationsAsync,
  scheduleNotificationAsync,
} from 'expo-notifications';
import type { TFunction } from 'i18next';

import { createChannels } from './channels';
import { hasNotificationPermission } from './permission';
import { type PlanInput, type PlannedNotification, planNotifications } from './plan';

/**
 * `rescheduleAll` — the ONLY scheduling path in the app.
 *
 * It cancels everything and rebuilds from current state. Incremental
 * scheduling drifts, and a drifted notification here means one arriving at a
 * bad time — which for this product is the failure that matters most.
 *
 * `systems/06` lists when it runs: the window time changes, the duration
 * changes, the tier changes, the pending count changes, permission is
 * granted, the timezone shifts, or the app boots. All of those are call sites;
 * none of them needs to know what is currently scheduled, because the answer
 * is always "cancel it and take this list instead".
 *
 * The decisions all live in `plan.ts`, which is pure and tested. This file
 * does two things the OS needs and nothing else.
 */

export interface RescheduleDeps extends PlanInput {
  /** i18next's `t`, bound to the `notifications` namespace by the caller. */
  t: TFunction;
}

export async function rescheduleAll(deps: RescheduleDeps): Promise<void> {
  // Channels first: Android silently drops a notification whose channel does
  // not exist yet, and boot is the only moment ordering is guaranteed.
  await createChannels();

  // Always cancel, even when the plan turns out to be empty. A revoked
  // permission or a downgrade has to remove what is already scheduled, and
  // that is the case an early return would break.
  await cancelAllScheduledNotificationsAsync();

  // Read live rather than trusting the caller's snapshot: permission can be
  // revoked in system settings while the app is backgrounded.
  const permitted = deps.permitted && (await hasNotificationPermission());

  for (const notification of planNotifications({ ...deps, permitted })) {
    await scheduleNotificationAsync({
      content: {
        // Always "Calma". Never the feature, never the count, never a name.
        title: deps.t('title'),
        body: body(deps.t, notification),
        // No badge, anywhere. See the note in `permission.ts`.
        badge: undefined,
      },
      trigger: triggerFor(notification),
    });
  }
}

/** Cancels everything. Used by "delete everything" (plan 14 T11). */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await cancelAllScheduledNotificationsAsync();
  } catch {
    // A deletion must never fail because the notification layer is unhappy.
  }
}

/**
 * The body, with a count and nothing else.
 *
 * `count` is a number by construction — `PlannedNotification.count` is
 * `number | null` — which is the mechanism that keeps a worry off a lock
 * screen. i18next handles the plural form from the same value.
 */
function body(t: TFunction, notification: PlannedNotification): string {
  return notification.count === null
    ? t(notification.bodyKey)
    : t(notification.bodyKey, { count: notification.count });
}

function triggerFor(notification: PlannedNotification) {
  const { hour, minute, channel } = notification;

  if (notification.repeat === 'weekly') {
    return {
      type: SchedulableTriggerInputTypes.WEEKLY as const,
      weekday: notification.weekday ?? 1,
      hour,
      minute,
      channelId: channel,
    };
  }

  if (notification.repeat === 'once-tomorrow') {
    /*
     * A DATE trigger, computed one day ahead.
     *
     * The streak nudge is the one notification that must not repeat: a daily
     * trigger would fire on days somebody already showed up, which turns a
     * gentle note into nagging. It is re-planned on every reschedule instead,
     * and `planNotifications` drops it the moment the day qualifies.
     */
    const at = new Date();
    at.setDate(at.getDate() + 1);
    at.setHours(hour, minute, 0, 0);

    return {
      type: SchedulableTriggerInputTypes.DATE as const,
      date: at,
      channelId: channel,
    };
  }

  /*
   * DAILY, with an hour and a minute rather than an instant.
   *
   * That is what makes a 19:00 window stay at 19:00 across a DST shift: the
   * OS calendar trigger follows wall-clock time. Scheduling an epoch here
   * would move every window by an hour, twice a year, in opposite directions.
   */
  return {
    type: SchedulableTriggerInputTypes.DAILY as const,
    hour,
    minute,
    channelId: channel,
  };
}
