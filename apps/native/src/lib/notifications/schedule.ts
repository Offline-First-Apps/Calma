/**
 * Cancelling everything Calma has scheduled.
 *
 * A STUB, AND THE HONEST KIND — the same shape as `permission.ts`.
 *
 * Plan 12 is not built and nothing in the app schedules a notification yet,
 * so there is genuinely nothing to cancel and this correctly does nothing.
 * It exists as a real function rather than as a `TODO` at the call site
 * because "delete everything" needs somewhere to call, and a comment saying
 * "cancel notifications here one day" is exactly the kind of thing that is
 * still there three plans later.
 *
 * When plan 12 T02 lands, the body becomes
 * `Notifications.cancelAllScheduledNotificationsAsync()` and no call site
 * changes. `erase.ts` already awaits it and already swallows a failure, on
 * the rule that a scheduling problem must never block a deletion somebody
 * asked for.
 */
export async function cancelAllNotifications(): Promise<void> {
  // Plan 12 T02 replaces this body. Nothing schedules, so nothing cancels.
}
