# Screens — what exists, screen by screen

**58 screens designed. 57 built, 1 cut, 0 not started.
0 verified — nothing has ever rendered.**

As of end of session 15. Every designed screen now exists in code.

This file is the answer to "is X done?". It talks in **screens**, not features,
because a feature being "done" is not a thing anyone can look at. Designs are
at `designs/extracted/{id}-{name}-{light|dark}.html`; briefs are in
`plans/17-screens.md`.

### What the marks mean

| Mark | Meaning |
|---|---|
| **Built** | Every element on the screen exists in code, built from its design file. **Never rendered.** |
| **Partial** | Something renders, but it is not the designed screen — a stub, a placeholder, or a reused screen standing in. **There are none left.** |
| **Cut** | Deliberately removed by a recorded decision. Not a gap. |
| **—** | Not started. No component exists. |

**"Built" does not mean "working".** No screen in this table has been seen by
a human being. Read every "Built" as "written, and the next person to open the
app is the first to find out".

---

## A · Boot — 2 of 2 built

| Screen | Status | Where |
|---|---|---|
| a1 splash | **Built** | `app.json` → expo-splash-screen plugin. Config, not a component |
| a2 degraded boot | **Built** | `src/components/BootError.tsx` |

## B · Onboarding — 10 of 10 live screens built, 1 cut

Plan 13 is 15/15.

| Screen | Status | Where |
|---|---|---|
| b1 welcome | **Built** | `steps/Welcome.tsx` |
| b2 language | **Built, unreachable** | `steps/Language.tsx`. Dropped from the flow while only English ships. Plan 18 T13 makes it appear |
| b3 founder note | **Cut** | D-019. Not a gap — design IDs were not renumbered |
| b4 what brings you here | **Built** | `steps/Question.tsx` |
| b5 when is it hardest | **Built** | `steps/Question.tsx` |
| b6 has anything helped | **Built** | `steps/Question.tsx` |
| b7 first breath | **Built** | `steps/FirstBreath.tsx`. A real session that persists |
| b8 how was that | **Built** | `steps/HowWasThat.tsx` |
| b9 here's your Calma | **Built** | `steps/YourCalma.tsx` |
| b10 notifications | **Built on a stub** | `steps/Notifications.tsx`. `permission.ts` returns `'unavailable'`; plan 12 T02 replaces one function body |
| b11 name | **Built** | `steps/Name.tsx` |

## C · Home — 1 of 1 built

| Screen | Status | Where |
|---|---|---|
| c1 home | **Built** | `src/features/home/HomeScreen.tsx` |

## D · Breathing — 7 of 7 built

| Screen | Status | Where |
|---|---|---|
| d1 pattern picker | **Built** | `app/(tabs)/breathe.tsx`. The custom row is live as of session 13 |
| d2 pre-session intensity | **Built** | `features/breathing/SudsSlider.tsx` |
| d3 breathing session | **Built** | `features/breathing/SessionScreen.tsx` |
| d4 stop confirmation | **Built** | inside `SessionScreen.tsx` |
| d5 extension offer | **Built** | inside `SessionScreen.tsx` |
| d6 post-session check | **Built** | `features/breathing/FeelingPicker.tsx` |
| d7 custom rhythm | **Built** | `features/breathing/CustomRatio.tsx` at `/custom-rhythm`. New in session 13 |

> d7 is **ungated**: free users reach it. The owner's session-13 decision was
> to build the screen and add the tier check with the rest of plan 11.

> d7's orb runs its own ambient loop rather than following the ratio being
> edited, which its caption asks for. Doing it properly means rescheduling a
> timeline on a settled value; the naive version restarts the animation on
> every tap. See `plans/11` T11.

## E · Panic — 4 of 4 built

**Plan 07 is 7 of 8 todos.** T08 needs a device on both platforms.

| Screen | Status | Where |
|---|---|---|
| e1 calm button tapped | **Built** | `src/components/PanicFab.tsx`. Two concentric rings on press-in, at 136/72 and 200/72 |
| e2 panic session | **Built** | `features/breathing/PanicSession.tsx` |
| e3 panic exit | **Built** | the `PanicExit` control inside `PanicSession.tsx`. Present from the first second, never confirms |
| e4 panic ending | **Built** | `features/breathing/PanicEnding.tsx` |

> **Session 12's panic work is still uncommitted.** `commit-session-12.ps1`
> has never been run. Run it before `commit-session-13.ps1`.

> `panic.m4a` is still `null` in the manifest — the delivered file is
> inaudible on a phone speaker (~31 Hz fundamental). `playSound('panic')` is
> wired and is a silent no-op until it is regenerated. **Plan 07 T03 cannot be
> ticked yet.**

> The orb still uses the standard amber on the panic screens. e2/e3 specify
> their own dimmer stops. Highest-value small task left in this block.

> A test in `features/journal/__tests__/retention.test.ts` asserts that
> neither panic screen can reach the journaling offer. Keep it passing.

## F · Worry — 8 of 8 built

Plan 08 T01–T16.

| Screen | Status | Where |
|---|---|---|
| f1 worries tab | **Built** | `features/worry/WorriesScreen.tsx` |
| f2 capture | **Built** | `features/worry/CaptureField.tsx` |
| f3 capture confirmation | **Built** | `CaptureField.tsx` + `Ripple.tsx` |
| f4 window intro | **Built** | `features/worry/WorryWindowScreen.tsx` |
| f5 triage question | **Built** | `features/worry/TriageQuestion.tsx` |
| f6 action step | **Built** | `features/worry/TriageAction.tsx` |
| f7 release step | **Built** | `features/worry/TriageRelease.tsx` |
| f8 window summary | **Built** | `features/worry/WindowSummary.tsx` |

## G · Journal — 8 of 8 built

**Plan 09 is 14/14 as of session 13.** Five of these are new.

| Screen | Status | Where |
|---|---|---|
| g0 write tab | **Built** | `features/journal/WriteScreen.tsx`. "Earlier" now renders the real archive |
| g1 journaling offer | **Built** | `features/journal/JournalOffer.tsx`, rendered by `SessionScreen`'s offer stage |
| g2 entry editor | **Built** | `features/journal/EditorScreen.tsx` |
| g3 re-rating | **Built** | the `reRate` step inside `EditorScreen.tsx` |
| g4 save confirmation | **Built** | `features/journal/SaveConfirmation.tsx` |
| g5 drafts | **Built** | `features/journal/DraftList.tsx` at `/journal/drafts`. `DraftCard` is shared with g0 |
| g6 entry list | **Built** | `features/journal/EntryList.tsx`, inline under g0's "Earlier" |
| g7 search your writing | **Built** | `features/journal/SearchScreen.tsx` at `/journal/search` |

> **g0's "Earlier" was showing "Nothing written yet" even when entries
> existed** — a screen telling someone their writing does not exist. Fixed in
> session 13.

> g5's discard is a long press, not a swipe and not a system alert. g7's
> entrance is a search glyph beside "Earlier" — g7 exists and no design draws
> the way in. Both recorded in `plans/09`.

> g7 is **ungated**. Plan 11 T10 gates search for free tier and is not built.

## H · Progress — 5 of 5 built

Plan 10 is 8 of 10. T08 is recommended for cutting; T10 needs a device.

| Screen | Status | Where |
|---|---|---|
| h1 progress tab | **Built** | `features/progress/ProgressScreen.tsx`. The placeholder is gone |
| h2 streak | **Built** | `features/progress/StreakNote.tsx` at `/progress/streak` |
| h3 streak moment | **Built** | `StreakNote.tsx`, rendered by `WorryWindowScreen` over f8 |
| h4 week summary | **Built** | `features/progress/WeekSummaryScreen.tsx` at `/progress/week` |
| h5 history & trends | **Built** | `features/progress/HistoryView.tsx`, the "Longer" segment |

**This is the block that proves onboarding's B7 breath actually persisted** —
and it is now the fastest way to check it. Breathe once, open Progress: if the
week card is empty, b7 did not write.

> **No design draws the way into h2.** The "Showing up" tile opens it —
> chosen because h2 is the streak enlarged, and enlarging what you tapped
> needs no label. Same situation as g7 in session 13; recorded in `plans/10`.

> h5's bands put **sage outside f6 for the first time**. The designs win on
> appearance and the H-group caption asks for it by name ("sage only for
> things that went well"). The rule that survives: sage never means "correct"
> and never appears as a tick.

> **h3 fires on f8's summary and nowhere else**, capped to once a day by a
> stored day key. It ships the two glass notes and **no haptic** — see the
> Note (session 14) in `plans/10` T04.

## I · Plus — 2 of 2 built

**Plan 11 is 8 of 13.**

| Screen | Status | Where |
|---|---|---|
| i1 plus offer | **Built** | `features/entitlement/PlansScreen.tsx` |
| i2 plus active | **Built** | `features/entitlement/PlusActiveScreen.tsx` |

Both live at `/paywall`, chosen by tier — one destination, two states.

> **With no RevenueCat keys, i1 shows no prices and no paywall ever appears.**
> That is the designed behaviour (`systems/05-entitlements.md`: SDK failure
> yields free tier with paywalls suppressed), not a bug.

> **i1 shows three price rows, not the one the design draws.** Design and
> systems doc disagreed; the owner resolved it in favour of the systems doc's
> "lifetime is offered and is not buried". Recorded in `plans/11` T13.

> **i2 drops the "Payment method" and "Receipts" rows.** Anonymous-mode
> RevenueCat means the app can never see a card number or a receipt list.
> "Stop Plus" deep-links to the platform subscription page.

## J · Settings — 4 of 4 built

Plan 14 is 6 of 11. T02 is blocked on i18n; T05, T08, T09 and T11 are open.

| Screen | Status | Where |
|---|---|---|
| j1 settings | **Built** | `features/settings/SettingsScreen.tsx` at `/settings` |
| j2 privacy & data | **Built** | `features/settings/PrivacyScreen.tsx` at `/settings/privacy` |
| j3 crisis resources | **Built** | `features/settings/CrisisScreen.tsx` at `/settings/crisis` |
| j4 delete everything | **Built** | `features/settings/DeleteSheet.tsx`, inside j2 |

> **Reachable from Home** as of session 16, via a drawn 24px mark in the
> top-right. c1 draws no affordance, so the control is invented; `plans/14`
> T01's "Done when" asked for Home, so the placement is the plan's.

> Erase clears all three MMKV instances, **destroys the SecureStore key**, and
> calls a notification-cancel that is an honest stub until plan 12. Order is
> asserted: cancel, clear, then the key — the other order leaves an encrypted
> blob nobody can open. Sixteen assertions.

> Two rows on j2 are **drawn and inert**: iCloud backup and export. Both need
> machinery that does not exist, and a toggle that silently does nothing is
> worse than an absence.

## K · States — 6 of 6 built

**Each is wired into the screen that owns it**, not just written. A state
component nobody renders is a state that has not been handled.

| Screen | Status | Where |
|---|---|---|
| k1 empty state | **Built** | `features/states/EmptyPage.tsx`, rendered by `EntryList` |
| k2 offline | **Built** | `features/states/OfflineNote.tsx`, at the top of Home |
| k3 session interrupted | **Built** | `features/states/SessionInterrupted.tsx`, on `SessionScreen`'s AppState change |
| k4 locked | **Built** | `features/states/LockedScreen.tsx`, gated by `settings/LockGate.tsx` on the Write tab |
| k5 notification | **Copy built** | `notifications.json`. Delivery is plan 12's |
| k6 returning | **Built** | `features/states/ReturningScreen.tsx`, replacing Home for one launch |

> **k4 is the most important screen in this block.** Its caption: "breathing
> is reachable without authenticating, and it's the primary button". Rule 3
> cannot survive a lock that gates everything. The amber button bypasses the
> lock; "Unlock" is the quiet link. Getting that the usual way round would be
> the worst decision available in this app.

> **k4's trigger landed in session 16.** j1's "Lock with Face ID" row,
> `expo-local-authentication`, and `LockGate` on the Write tab — the writing
> and nothing else. `lock.ts` holds the allowlist and `lock.test.ts` asserts
> that `/panic`, `/session/*`, `/(tabs)/breathe` and `/settings/crisis` stay
> reachable while locked, so rule 3 is enforced rather than promised.

> k6 fires at **21 days**, not a month — three weeks is already past the point
> where someone wonders whether their writing survived. Six months and three
> weeks get the identical screen.

---

# Handover — every screen is built. What is left is not screens.

58 designed, 57 built, 1 cut, and **0 seen by a human being**. That second
number has not moved in fifteen sessions and it is now the only number worth
moving.

### 1. Run the app

`pnpm install && pnpm check-types && pnpm lint && pnpm test` all pass, and
`npx expo export --platform android` produces a bundle. None of that is
evidence that a screen looks right. Session 14's audit found four deviations
in H after a careful build, and session 15 found four more in K — both times
by opening the design file, and both times in work that had just been called
done. A device will find things neither audit could.

### 2. Connect the things that exist and are not called

None of these is a screen; all of them are a screen not doing its job.

- ~~Nothing links to `/settings`~~ — done, session 16.
- ~~k4 has no trigger~~ — done, session 16.
- **`usePaywallHold` is called by nothing.** Five one-line additions and plan
  11 T12's guarantee becomes real. The test is already written.
- **`useLimit` is called by nothing.** Plan 11 T08, T09, T10.
- **`deleteBreathingSession` is called by nothing**, three sessions on.
- **Four j1 rows lead to screens that do not exist**: `/settings/name`,
  `/settings/answers`, `/settings/window`, `/settings/appearance`. Plan 14
  T02, T03 (partly), T04 and T06's theme half.

### 3. Plan 12, notifications

The last unbuilt feature. `permission.ts` is a stub that returns
`'unavailable'`, b10 is built on top of it, k5's copy is written, and the
worry-window reminder is the only thing Calma ever sends. It is also what
unblocks the last of plan 14 T07 and T11.

### 4. The remaining plan-14 rows

T02 (language, blocked on i18n T13), T05 (breathing pattern), T08 (onboarding
answers), T09 (Plus section), T11 (the SecureStore key and notification
cancellation that "erase everything" still does not do).
