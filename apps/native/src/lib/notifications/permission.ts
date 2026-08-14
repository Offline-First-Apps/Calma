import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications';

/**
 * The notification permission, and the one rule about it.
 *
 * A PERMISSION CAN ONLY BE SPENT ONCE. On both platforms, a denied prompt is
 * final: the app cannot ask again, and the only remaining route is a sentence
 * asking the person to go into Settings, which almost nobody does. So the
 * OS dialog is fired exactly once, only after an explicit yes on a screen that
 * has already shown the real notification (b10). A "no thanks" must never
 * reach the OS at all — declining our screen costs nothing and can be changed
 * later; declining the OS costs the capability permanently.
 *
 * `prefs.notificationsAsked` records that we have asked and survives a
 * permission change, so the pre-prompt cannot reappear.
 *
 * REMOTE NOTIFICATIONS ARE NEVER REGISTERED. There is no
 * `getExpoPushTokenAsync` anywhere in this app and there must never be: a push
 * token is a device identifier, and rule 1 is that no data leaves the phone.
 * `notifications.test.ts` asserts its absence across the whole source tree.
 */

export type PermissionOutcome = 'granted' | 'denied' | 'unavailable';

/**
 * Fires the OS dialog and reports what happened.
 *
 * MUST ONLY BE CALLED AFTER AN EXPLICIT YES on the pre-prompt. There is no
 * guard in here that can enforce that — a guard would have to know what
 * screen it was called from — so it is a rule about call sites, and
 * `features/onboarding/steps/Notifications.tsx` is currently the only one.
 * `guards.test.ts` asserts that it stays the only one.
 */
export async function requestNotificationPermission(): Promise<PermissionOutcome> {
  try {
    const existing = await getPermissionsAsync();

    // Already answered. Asking again is a no-op on iOS and a second dialog on
    // some Android versions, so it is short-circuited rather than attempted.
    if (existing.granted) return 'granted';
    if (!existing.canAskAgain) return 'denied';

    const result = await requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowSound: true,
        // No badge. A number on the app icon is a standing demand for
        // attention that nobody agreed to, and `systems/06` rules out badges
        // in the same breath as it rules out re-engagement.
        allowBadge: false,
      },
    });

    return result.granted ? 'granted' : 'denied';
  } catch {
    // A simulator without a notification service, or a stripped build. Not an
    // error worth showing anybody: everything else in the app still works.
    return 'unavailable';
  }
}

/** Whether we may schedule. Read on every reschedule; never cached. */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    return (await getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
