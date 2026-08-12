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
 * ---------------------------------------------------------------------------
 * THIS IS A STUB, ON PURPOSE, AND IT IS THE HONEST KIND.
 *
 * `plans/12-notifications.md` is not built and `expo-notifications` is not a
 * dependency yet. Rather than have onboarding import a package that does not
 * exist, or fake a granted permission it never asked for, this returns
 * `false` — "we did not get permission" — which is true, and which every
 * caller already has to handle because a real user can decline.
 *
 * The consequence is contained and visible: someone who taps "Yes, remind me"
 * today gets their preference recorded and no notifications, because there is
 * no notification system to schedule against. Nothing silently half-works.
 *
 * Plan 12 T02 replaces the body of `requestNotificationPermission` and
 * nothing else. Onboarding does not change.
 * ---------------------------------------------------------------------------
 */

export type PermissionOutcome = 'granted' | 'denied' | 'unavailable';

/**
 * Fires the OS dialog and reports what happened.
 *
 * MUST ONLY BE CALLED AFTER AN EXPLICIT YES on the pre-prompt. There is no
 * guard in here that can enforce that — a guard would have to know what
 * screen it was called from — so it is a rule about call sites, and
 * `features/onboarding/steps/Notifications.tsx` is currently the only one.
 */
export async function requestNotificationPermission(): Promise<PermissionOutcome> {
  // Plan 12 T02: replace with expo-notifications' requestPermissionsAsync.
  return 'unavailable';
}
