# 08 — Worry Postponement

The largest feature: frictionless capture, a scheduled window, and guided triage.

**Branch:** `feat/worry-postponement`
**Depends on:** 02, 03, 04, 05
**Reference:** D-008, `systems/07-copy-and-tone.md`

---

## T01 — Build the worry store

- [x] `f9f73bc`
- **Commit:** `feat(worry): add worry zustand store`
- **Depends on:** `03-storage-layer` T07
- **Touches:** `apps/native/src/features/worry/store.ts`
- **Done when:** the store hydrates pending worries at boot, exposes `pendingCount` and `capture`, and every write goes through `WorryRepo` rather than mutating state directly.

---

## T02 — Build the capture field

- [x] `f9f73bc`
- **Commit:** `feat(worry): build quick-capture input`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/worry/CaptureField.tsx`
- **Done when:** the field autofocuses, submits on return, clears instantly, accepts multi-line text, and stays usable with the keyboard up via `react-native-keyboard-controller`.

---

## T03 — Add the capture confirmation

- [x] `pending-T03`
- **Commit:** `feat(worry): add capture confirmation animation and feedback`
- **Depends on:** T02, `04-audio-haptics` T03
- **Touches:** `apps/native/src/features/worry/CaptureField.tsx`
- **Done when:** the text dissolves upward over 900ms, the pebble sound and `Light` haptic fire, "Got it. I'll hold onto this until {time}." appears, and **the worry text is never re-displayed**.


**Note (session 11):** T03 says "the text dissolves upward over 900ms" and
T16 says the field must accept the next worry instantly. Both cannot be
literally true — the input is cleared on the same tick as the submit, so
there is no text left to dissolve. Resolved in favour of T16 and of f3's
caption ("a ripple settling where it was"; the design file shows the card
holding rings and no words): the 900ms upward travel belongs to the ripple
and the confirmation sentence, rising into the space the text occupied.
Re-rendering the worry so it could be seen dissolving would put it back on
screen for most of a second, which f3 forbids. Reversible if the owner
prefers the literal reading.

---

## T04 — Build the Worries tab

- [x] `f9f73bc`
- **Commit:** `feat(worry): build worries tab screen`
- **Depends on:** T02
- **Touches:** `apps/native/src/app/(tabs)/worries.tsx`
- **Done when:** the tab shows the capture field, a pending **count only** (never previews), the countdown to the next window, and an "Open it now" affordance once the window time has passed.


**Note (session 11):** the six worry screens carry four different light-mode
grounds (#F6EDE3 on f1/f2/f3, #F4E8DD on f5/f7, #F5EADF on f6) and one
identical dark ground (#1A1D24). Dark agreeing exactly while light varies
non-monotonically through the flow reads as hand-tuning rather than intent.
Normalised to f1's #F6EDE3 as `--worry`, since that is the value the tab
itself uses. f4 is deliberately NOT folded in: its caption states an
intention the others do not share ("clay warms toward amber and the light
comes from above"), and it differs in dark too, so it keeps `--window-ground`.
Cheap to reverse — split into three names and the screens take them
individually.

---

## T05 — Add pending count pluralisation and empty state

- [x] `pending-T05`
- **Commit:** `feat(worry): add pending count pluralisation and empty state`
- **Depends on:** T04
- **Touches:** `packages/i18n/src/locales/en/worry.json`, `worries.tsx`
- **Done when:** the count uses ICU plural keys (`pending_one` / `pending_other`) rather than a ternary, so 1 renders as "1 thing waiting" and n as "n things waiting"; zero renders "Nothing waiting. That's a good place to be." with no count and no badge.


**Note (session 11):** two i18n changes beyond the todo. `windowIn`
("Your window opens in {{duration}}") was being passed a clock time by
`HomeScreen`, so it rendered "Your window opens in 7:00 PM"; f1 says "at", the
value was always a time, and only the key was wrong. Replaced by `windowAt`.
Added `formatWindowTime` to `@calma/i18n`, which drops the minutes on the
hour ("8 PM", not "8:00 PM") because ":00" in running prose reads like a
timetable. The design writes it lowercase, "8pm"; the case is left as Intl
produces it, since lowercasing would apply an English typographic habit to
every locale through a function that cannot tell a meridiem from a word that
needs its capital.

---

## T06 — Build the triage state machine

- [x] `f9f73bc`
- **Commit:** `feat(worry): add guided triage state machine`
- **Touches:** `packages/domain/src/worry/triage.ts`, `triage.test.ts`
- **Done when:** the machine walks a queue one worry at a time through ask → (action | release) → next → summary, is resumable from a cursor index, and is fully tested as a pure function.

---

## T07 — Persist window state for resumption

- [x] `pending-T07`
- **Commit:** `feat(worry): persist worry window state for resumption`
- **Depends on:** T06, `03-storage-layer` T07
- **Touches:** `apps/native/src/features/worry/store.ts`
- **Done when:** `state:worryWindow` records the queue and cursor, a cold boot mid-window resumes at the right worry, and leaving the window leaves remaining worries pending with no penalty or confirmation.

---

## T08 — Build the window screen shell

- [x] `f9f73bc`
- **Commit:** `feat(worry): build worry window screen shell`
- **Depends on:** T06, `05-app-shell` T04
- **Touches:** `apps/native/src/app/worry-window.tsx`
- **Done when:** it presents full-screen with no tab bar and no panic FAB, opens with "You saved this earlier. Let's look at it with fresh eyes.", and **new worries cannot be added while it's open**.

---

## T09 — Build the triage question step

- [x] `pending-T09`
- **Commit:** `feat(worry): build triage question step`
- **Depends on:** T08
- **Touches:** `apps/native/src/features/worry/TriageQuestion.tsx`
- **Done when:** one worry's full text is shown with "Is this something you can do something about?" and two equally weighted buttons, "Yes" and "Not really".

---

## T10 — Build the action step

- [x] `pending-T10`
- **Commit:** `feat(worry): build action capture step`
- **Depends on:** T09
- **Touches:** `apps/native/src/features/worry/TriageAction.tsx`
- **Done when:** "What's one small step?" with the hint "Doesn't have to be big." captures free text, the field can be submitted empty (the worry still counts as processed), and `markProcessed` is called with the action text.


**Note (session 11):** f6's caption gives the empty path its own affordance —
"an empty answer exits through 'Nothing comes to mind' without failing" —
where the todo only requires that the field can be submitted empty. Built to
the design: a second control under the primary button, same behaviour, its own
words. Both routes call the same handler; the difference is entirely in what
it feels like to take them.

---

## T11 — Build the release step

- [x] `pending-T11`
- **Commit:** `feat(worry): build release step with scatter animation`
- **Depends on:** T09
- **Touches:** `apps/native/src/features/worry/TriageRelease.tsx`
- **Done when:** "Then this one isn't yours to carry." is shown with a swipe-up gesture; the 1400ms scatter-and-drift animation plays with the leaves sound and a `Soft` haptic; `markReleased` hard-deletes the record.


**Note (session 11):** the release gesture is also exposed as an activatable
control via `onAccessibilityTap`. VoiceOver cannot swipe a card upward past a
threshold, and a release reachable only by hand would exclude exactly the
people most likely to be using a screen reader in the dark. The deliberate-
gesture requirement of T15 still holds for touch.

---

## T12 — Build the window summary

- [x] `f9f73bc`
- **Commit:** `feat(worry): build window summary with three variants`
- **Depends on:** T10, T11
- **Touches:** `apps/native/src/features/worry/WindowSummary.tsx`
- **Done when:** the mixed, all-released, and all-actioned copy variants each render correctly; the summary ends with "How does that feel?" and no scoring, grading, or comparison to previous days.

---

## T13 — Add window scheduling and carry-over

- [x] `f9f73bc`
- **Commit:** `feat(worry): add window scheduling and carry-over behaviour`
- **Depends on:** T07, `03-storage-layer` T06
- **Touches:** `apps/native/src/features/worry/schedule.ts`, `schedule.test.ts`
- **Done when:** the window derives from `worryWindowTime` and `worryWindowMinutes`; unprocessed worries roll forward indefinitely; the window is manually openable any time after its start; and no copy anywhere says "missed", "overdue", or "forgot".

---

## T14 — Add the timezone and DST edge handling

- [x] `pending-T14`
- **Commit:** `fix(worry): handle timezone and dst shifts in window scheduling`
- **Depends on:** T13
- **Touches:** `apps/native/src/features/worry/schedule.ts`, `schedule.test.ts`
- **Done when:** the window follows wall-clock time across a DST change, a timezone change recomputes the next window without duplicating or skipping it, and tests cover both directions.

---

## T15 — Add release confirmation safety

- [x] `pending-T15`
- **Commit:** `feat(worry): require deliberate gesture for release`
- **Depends on:** T11
- **Touches:** `TriageRelease.tsx`
- **Done when:** release requires a deliberate swipe past a threshold rather than a tap, an incomplete swipe springs back, and there is no undo — with the copy honest about that rather than implying reversibility.

---

## T16 — Make rapid repeat capture frictionless and idempotent

- [x] `pending-T16`
- **Commit:** `fix(worry): support rapid repeat capture and prevent duplicate submits`
- **Depends on:** T02, T03
- **Touches:** `apps/native/src/features/worry/CaptureField.tsx`
- **Done when:** the field accepts new input the **instant** the previous worry is submitted — the dissolve, the pebble, and the confirmation play over an already-live field rather than blocking it; four worries can be captured in under fifteen seconds without waiting once. Submit is idempotent for 600ms, so a lagging tap can never store the same worry twice and corrupt the pending count. A spiral produces several worries in a row, and a confirmation that's lovely once is a wall by the fourth (`plans/19-review-findings.md` R1, R5).

---

## T17 — Verify the full worry flow on both platforms

- [ ]
- **Commit:** `test(worry): verify capture and triage flows`
- **Depends on:** T01–T15
- **Touches:** `apps/native/src/features/worry/__tests__/*`
- **Done when:** tests cover capture → pending → window → both triage branches → summary, plus mid-window cold-boot resumption; and a test asserts worry text never appears in the pending list, the count, or any notification. Verified by hand on iOS and Android.

**Note (session 11):** NOT DONE. `packages/domain/src/worry/triage.test.ts`
(24 assertions) and `apps/native/src/features/worry/schedule.test.ts` (DST in
both directions, month/year/leap rollover) are written but have never
executed — vitest has no linux rollup binary in the sandbox and `pnpm test`
has still never run anywhere. The capture → window → triage → summary
integration test and the "worry text never appears in the pending list, the
count, or any notification" assertion are not written at all. Verification by
hand on iOS and Android is outstanding.

