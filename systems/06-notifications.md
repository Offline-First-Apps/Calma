# Notifications

All local. `expo-notifications`, no push tokens, no remote capability, no server. The app never registers for remote notifications at all.

**Governing principle:** a notification from Calma should feel like a friend leaving a note, not an app demanding attention. If in doubt, don't send it.

---

## Catalogue

| Id | Tier | When | Body |
|---|---|---|---|
| `worry-window-soon` | Free | 10 min before the window | "Your worry window opens soon. You have {n} things waiting." |
| `worry-window-open` | Free | At window start | "Your window's open whenever you're ready." |
| `journal-streak-nudge` | Plus | 20:00 on a day with no qualifying activity, only if streak ≥ 2 | "You've shown up {n} days running. There's time yet today." |
| `weekly-checkin` | Plus | Sunday 18:00 | "How was your week? There's space here if you want it." |

That is the complete list. There are no re-engagement notifications, no "we miss you", no streak-loss alerts, no promotional notifications, ever.

### Pluralisation

`worry-window-soon` must handle `n === 1` — "You have 1 thing waiting." A grammatical slip here reads as carelessness in a moment that's meant to feel personal. If `n === 0`, the notification is **not scheduled at all**.

---

## Permission flow

We do **not** ask at first launch. That's the moment someone is deciding whether to trust the app.

The prompt appears in exactly one place: **when the user sets their worry window time for the first time.** At that point the reason is obvious and self-evident.

Copy shown *before* the OS dialog:

> "Want a nudge 10 minutes before your window? That's the only thing we'll send."

Buttons: **"Yes, remind me"** / **"No thanks"**.

**Rules.**
- If declined, everything still works. The worry window is opened manually from the Worries tab.
- We ask **once**. Never again. A "Notifications" row in Settings deep-links to system settings for anyone who changes their mind.
- `prefs.notificationsAsked` records that we've asked, and survives permission changes.

---

## Scheduling

### Android channels

Required. Created at boot, before any scheduling.

| Channel | Importance | Sound | Vibration |
|---|---|---|---|
| `worry-window` | `DEFAULT` | default | yes, gentle |
| `gentle` | `LOW` | none | none |

`LOW` for streak and check-in notifications means no heads-up interruption. Those are notes to find later, not interruptions.

### Triggers

- `worry-window-soon` / `worry-window-open` — daily repeating `CALENDAR` trigger at derived times.
- `journal-streak-nudge` — scheduled one day ahead each night, **cancelled the moment the day qualifies**. Never a fixed repeat, or it would fire on days the user already showed up.
- `weekly-checkin` — weekly repeating.

### Rescheduling triggers

The full schedule is rebuilt whenever any of these happen: worry window time changes, window duration changes, tier changes, pending worry count changes, permission is granted, DST shifts, timezone changes, or the app boots.

A `rescheduleAll()` function that cancels everything and re-schedules from current state is the only supported path. Incremental scheduling drifts, and drifted notifications in this app mean a notification arriving at a bad time.

### DST

`CALENDAR` triggers with `hour`/`minute` follow wall-clock time across DST, which is what we want — a 19:00 window stays at 19:00. But `worry-window-soon` is derived as `windowTime − 10min`, so it is recomputed on `rescheduleAll()` rather than stored.

---

## Content safety

**No notification ever contains worry text, journal text, or any user-written content.** Lock-screen previews are visible to anyone holding the phone. Counts only, never content — this mirrors the in-app rule that the pending-worry badge shows a number and never a preview.

Notification titles are always just **"Calma"**.

---

## Quiet hours

Nothing is scheduled between **22:00 and 07:00** local, regardless of settings. If a user sets their worry window to 23:00, the reminder is silently skipped — the window itself still works, opened from the app. A notification at 2am is the exact thing this app exists to prevent.

---

## Tier changes

On downgrade from Plus to free, `journal-streak-nudge` and `weekly-checkin` are cancelled and the window duration falls back to 15 minutes. This happens silently. No "you've lost access" notification.
