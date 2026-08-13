# Screens — what exists, screen by screen

**58 screens designed. 42 built, 1 cut, 15 not started.
0 verified — nothing has ever rendered.**

As of end of session 13.

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

## H · Progress — 0 of 5

`app/(tabs)/progress.tsx` is a one-line placeholder. Plan 10 is 0 of 10.

| Screen | Status |
|---|---|
| h1 progress tab | — |
| h2 streak | — |
| h3 streak moment | — |
| h4 week summary | — |
| h5 history & trends | — |

**This is the block that proves onboarding's B7 breath actually persisted.**

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

## J · Settings — 0 of 4

Plan 14 is 0 of 11. Nothing exists — there is no settings route at all.

| Screen | Status |
|---|---|
| j1 settings | — |
| j2 privacy & data | — |
| j3 crisis resources | — |
| j4 delete everything | — |

**Everything onboarding collects — name, language, worry window, breathing
preference, notifications — is currently uneditable.** It is also where plan
11 T04's restore row belongs, and the only home for `deleteBreathingSession`,
which session 13 built and nothing calls.

## K · States — 0 of 6

| Screen | Status |
|---|---|
| k1 empty state | — |
| k2 offline | — |
| k3 session interrupted | — |
| k4 locked | — |
| k5 notification | — (a notification, not a screen; plan 12) |
| k6 returning after a month | — |

---

# Handover — the 15 screens still to build

In the order I would take them, and why.

### ~~1. Finish E · Panic~~ — done, session 12 (plan 07, 7/8)

### ~~2. Finish G · Journal~~ — done, session 13 (plan 09, 14/14)

### ~~3. I · Plus and d7~~ — done, session 13 (plan 11, 8/13)

### 1. Wire what session 13 left unconnected — 0 screens

Not a screen job, and it is first because it is small and it closes a loop
that is otherwise easy to forget exists.

- `usePaywallHold` is called by nothing. Five one-line additions —
  `CaptureField`, `SessionScreen`, `PanicSession`, `WorryWindowScreen`,
  `EditorScreen` — and plan 11 T12's guarantee becomes real rather than
  merely correct. The test is already written.
- `useLimit` is called by nothing. Plan 11 T08, T09 and T10 are those call
  sites.

### 2. H · Progress — 5 screens, plan 10 (0/10)

Replaces a placeholder tab, and it is the screen that shows whether B7's
onboarding breath was actually written. Mostly reads aggregates
`packages/db` already computes, so it is more screen work than logic.

Watch the tone rules hard here: no scoring, no comparison to previous weeks,
no chart that implies a target. h3 (streak moment) is the single most likely
screen in the app to accidentally congratulate someone.

### 3. J · Settings — 4 screens, plan 14 (0/11)

Every answer onboarding collects is meant to be editable and none of it is.
Also the only home for "erase everything", which a privacy-first app is weak
without, and for j3 crisis resources — and for plan 11 T04's restore row,
which cannot be finished until this exists.

No new plumbing needed: prefs, the repositories and `deleteBreathingSession`
all exist.

### 4. K · States — 6 screens

Cheapest per screen and the easiest to defer, but k3 (session interrupted)
matters more than the others — it is what someone sees when a call arrives
mid-breath.

### Before any of it

**Run the app.** 42 screens are marked Built and not one has rendered. The
first run will find things this table cannot, and building 15 more on top of
42 unverified ones compounds whatever is wrong at the bottom.

`commit-session-12.ps1` → `commit-session-13.ps1` → `pnpm install` →
`pnpm check-types` → `pnpm test` → `pnpm --filter native android`. See
`00-START-HERE.md`; note that `check-types` and `eslint` both hung with no
output in session 13, which is the first thing to establish.
