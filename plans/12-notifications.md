# 12 — Notifications

Four local notifications, total. No push, no re-engagement, no guilt.

**Branch:** `feat/notifications`
**Depends on:** 08, 10, 11
**Reference:** `systems/06-notifications.md`

---

## T01 — Install expo-notifications and create Android channels

- [ ]
- **Commit:** `feat(notify): install expo-notifications and create android channels`
- **Touches:** `apps/native/package.json`, `apps/native/src/lib/notifications/channels.ts`, `app.json`
- **Done when:** the `worry-window` (DEFAULT) and `gentle` (LOW) channels are created at boot before any scheduling, and the app **never registers for remote notifications** — verified by the absence of any push token call.

---

## T02 — Build the permission request flow

- [ ]
- **Commit:** `feat(notify): add contextual permission request`
- **Depends on:** T01
- **Touches:** `apps/native/src/lib/notifications/permission.ts`
- **Done when:** permission is requested only when the worry window time is first set, is preceded by the pre-prompt copy, is asked **once ever** (tracked by `prefs.notificationsAsked`), and declining leaves everything else working.

---

## T03 — Build the notification catalogue

- [ ]
- **Commit:** `feat(notify): add notification catalogue`
- **Depends on:** T01
- **Touches:** `apps/native/src/lib/notifications/catalogue.ts`
- **Done when:** all four notifications are defined with their exact copy, channel, and tier; the title is always "Calma"; and a test asserts no body template can interpolate worry or journal text.

---

## T04 — Implement `rescheduleAll`

- [ ]
- **Commit:** `feat(notify): implement full reschedule from current state`
- **Depends on:** T03
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** `rescheduleAll()` cancels everything and rebuilds from current prefs, tier, and pending count; it is the only scheduling path; and it is triggered by window-time change, duration change, tier change, pending-count change, permission grant, and boot.

---

## T05 — Wire the worry window notifications

- [ ]
- **Commit:** `feat(notify): wire worry window reminders`
- **Depends on:** T04, `08-worry-postponement` T13
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** `worry-window-soon` fires 10 minutes before with a correct count, is **not scheduled at all** when the count is zero, pluralises "1 thing" correctly, and `worry-window-open` fires at the start.

---

## T06 — Add quiet hours enforcement

- [ ]
- **Commit:** `feat(notify): enforce 22:00-07:00 quiet hours`
- **Depends on:** T04
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`, `schedule.test.ts`
- **Done when:** nothing is ever scheduled between 22:00 and 07:00 local; a window set at 23:00 silently skips its reminder while the window itself still works; and tests cover a window straddling midnight.

---

## T07 — Wire the streak nudge

- [ ]
- **Commit:** `feat(notify): wire journal streak nudge`
- **Depends on:** T04, `10-progress-dashboard` T03
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** the nudge is scheduled one day ahead at 20:00 only for Plus users with a streak ≥ 2, is cancelled the moment the day qualifies, and **no notification is ever sent when a streak breaks**.

---

## T08 — Wire the weekly check-in and tier downgrade

- [ ]
- **Commit:** `feat(notify): wire weekly check-in and handle tier downgrade`
- **Depends on:** T04, `11-entitlements-paywall` T02
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** the Sunday 18:00 check-in is scheduled for Plus only; downgrading silently cancels Plus notifications and reverts window duration to 15 minutes with no "you've lost access" message.

---

## T09 — Handle DST, timezone changes, and verify on device

- [ ]
- **Commit:** `test(notify): verify scheduling across dst and timezone changes`
- **Depends on:** T04–T08
- **Touches:** `apps/native/src/lib/notifications/schedule.test.ts`
- **Done when:** a window keeps its wall-clock time across DST; a timezone change reschedules without duplicating or skipping; and delivery is confirmed by hand on a real iOS device and a real Android device, including with the app force-quit.
