# 12 — Notifications

Four local notifications, total. No push, no re-engagement, no guilt.

**Branch:** `feat/notifications`
**Depends on:** 08, 10, 11
**Reference:** `systems/06-notifications.md`

---

## T01 — Install expo-notifications and create Android channels

- [x] `pending-T01`
- **Commit:** `feat(notify): install expo-notifications and create android channels`
- **Touches:** `apps/native/package.json`, `apps/native/src/lib/notifications/channels.ts`, `app.json`
- **Done when:** the `worry-window` (DEFAULT) and `gentle` (LOW) channels are created at boot before any scheduling, and the app **never registers for remote notifications** — verified by the absence of any push token call.

---

## T02 — Build the permission request flow

- [x] `pending-T02`
- **Note (session 17):** the prompt fires from b10 and nowhere else, which is
  where onboarding already put it — `systems/06` says "when the worry window
  time is first set", and onboarding sets it. Settings' row records the
  preference and never reaches the OS. `guards.test.ts` asserts the caller
  stays singular. **The Settings deep-link to system settings is not wired.**
- **Commit:** `feat(notify): add contextual permission request`
- **Depends on:** T01
- **Touches:** `apps/native/src/lib/notifications/permission.ts`
- **Done when:** permission is requested only when the worry window time is first set, is preceded by the pre-prompt copy, is asked **once ever** (tracked by `prefs.notificationsAsked`), and declining leaves everything else working.

---

## T03 — Build the notification catalogue

- [x] `pending-T03`
- **Commit:** `feat(notify): add notification catalogue`
- **Depends on:** T01
- **Touches:** `apps/native/src/lib/notifications/catalogue.ts`
- **Done when:** all four notifications are defined with their exact copy, channel, and tier; the title is always "Calma"; and a test asserts no body template can interpolate worry or journal text.

---

## T04 — Implement `rescheduleAll`

- [x] `pending-T04`
- **Commit:** `feat(notify): implement full reschedule from current state`
- **Depends on:** T03
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** `rescheduleAll()` cancels everything and rebuilds from current prefs, tier, and pending count; it is the only scheduling path; and it is triggered by window-time change, duration change, tier change, pending-count change, permission grant, and boot.

---

## T05 — Wire the worry window notifications

- [x] `pending-T05`
- **Commit:** `feat(notify): wire worry window reminders`
- **Depends on:** T04, `08-worry-postponement` T13
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** `worry-window-soon` fires 10 minutes before with a correct count, is **not scheduled at all** when the count is zero, pluralises "1 thing" correctly, and `worry-window-open` fires at the start.

---

## T06 — Add quiet hours enforcement

- [x] `pending-T06`
- **Note (session 17):** enforced in `plan.ts` as a filter applied to the
  whole list last, so it cannot be bypassed by adding a notification later.
  Six assertions, including a 23:00 window (everything dropped) and a 07:05
  window (reminder dropped at 06:55, window kept).
- **Commit:** `feat(notify): enforce 22:00-07:00 quiet hours`
- **Depends on:** T04
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`, `schedule.test.ts`
- **Done when:** nothing is ever scheduled between 22:00 and 07:00 local; a window set at 23:00 silently skips its reminder while the window itself still works; and tests cover a window straddling midnight.

---

## T07 — Wire the streak nudge

- [x] `pending-T07`
- **Commit:** `feat(notify): wire journal streak nudge`
- **Depends on:** T04, `10-progress-dashboard` T03
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** the nudge is scheduled one day ahead at 20:00 only for Plus users with a streak ≥ 2, is cancelled the moment the day qualifies, and **no notification is ever sent when a streak breaks**.

---

## T08 — Wire the weekly check-in and tier downgrade

- [x] `pending-T08`
- **Commit:** `feat(notify): wire weekly check-in and handle tier downgrade`
- **Depends on:** T04, `11-entitlements-paywall` T02
- **Touches:** `apps/native/src/lib/notifications/schedule.ts`
- **Done when:** the Sunday 18:00 check-in is scheduled for Plus only; downgrading silently cancels Plus notifications and reverts window duration to 15 minutes with no "you've lost access" message.

---

## T09 — Handle DST, timezone changes, and verify on device

- [ ]
- **Note (session 17):** DST is handled structurally rather than by
  arithmetic: every planned notification is an hour and a minute, never an
  instant, so the OS calendar trigger follows wall clock. A test asserts no
  planned notification carries a timestamp. **The device half cannot be
  ticked** — delivery on real iOS and Android hardware, including force-quit,
  needs hardware and a Mac.
- **Commit:** `test(notify): verify scheduling across dst and timezone changes`
- **Depends on:** T04–T08
- **Touches:** `apps/native/src/lib/notifications/schedule.test.ts`
- **Done when:** a window keeps its wall-clock time across DST; a timezone change reschedules without duplicating or skipping; and delivery is confirmed by hand on a real iOS device and a real Android device, including with the app force-quit.
