# 09 — Journaling

Structured cognitive restructuring, offered after high-distress sessions. Never nagged.

**Branch:** `feat/journaling`
**Depends on:** 02, 03, 06
**Reference:** `systems/07-copy-and-tone.md`

---

## T01 — Build the journal store

- [x] `f9f73bc`
- **Commit:** `feat(journal): add journal zustand store`
- **Depends on:** `03-storage-layer` T08
- **Touches:** `apps/native/src/features/journal/store.ts`
- **Done when:** the store hydrates drafts and this-week's count at boot, and every write goes through `JournalRepo`.

---

## T02 — Build the entry editor shell

- [x] `f9f73bc`
- **Commit:** `feat(journal): build entry editor shell`
- **Depends on:** T01, `05-app-shell` T04
- **Touches:** `apps/native/src/app/journal/[id].tsx`, `apps/native/src/features/journal/EditorScreen.tsx`
- **Done when:** the editor opens for a new or existing entry, handles the keyboard without covering the active field, and scrolls the focused input into view on both platforms.

---

## T03 — Build the six template steps

- [x] `pending-T03`
- **Commit:** `feat(journal): build cognitive restructuring template steps`
- **Depends on:** T02
- **Touches:** `apps/native/src/features/journal/steps/*.tsx`
- **Done when:** situation, automatic thought, emotion + intensity, evidence for, evidence against, and balanced thought each render with their exact prompt copy, and every field can be left blank without blocking progress.


**Note (session 11):** built as a table (`steps.ts`) plus three renderers, not
as six files under `steps/*.tsx`. Five of the six differ only in prompt, hint
and target field; six near-identical components is five more places for a
`required` flag to appear later. The table has nowhere to put one. `EmotionStep`
and `ReRateStep` are real components because they genuinely differ.

---

## T04 — Add the emotion intensity control

- [x] `f9f73bc`
- **Commit:** `feat(journal): add emotion intensity control`
- **Depends on:** T03
- **Touches:** `apps/native/src/features/journal/steps/EmotionStep.tsx`
- **Done when:** a 0–10 control captures intensity alongside a free-text emotion name, with no fixed emotion list to choose from and no clinical labels.

---

## T05 — Add the re-rate step

- [x] `pending-T05`
- **Commit:** `feat(journal): add emotion re-rating step`
- **Depends on:** T04
- **Touches:** `apps/native/src/features/journal/steps/ReRateStep.tsx`
- **Done when:** "And now — how strong is it?" captures the after-intensity, the delta is shown neutrally without praise or disappointment, and no change or an increase is treated as an entirely normal outcome.

---

## T06 — Add continuous draft autosave

- [x] `f9f73bc`
- **Commit:** `feat(journal): add continuous draft autosave`
- **Depends on:** T03
- **Touches:** `apps/native/src/features/journal/useAutosave.ts`
- **Done when:** the entry saves **continuously while typing** (debounced, not on blur), plus on blur and on backgrounding; a force-quit mid-sentence loses at most the last few keystrokes; and a draft does not consume the weekly allowance. A half-written journal entry is the most emotionally costly thing this app holds — losing one would be worse than a crash, because a crash doesn't take anything with it (`plans/19-review-findings.md` R3).

---

## T07 — Add draft resumption

- [x] `0663a30`
- **Commit:** `feat(journal): add draft resumption`
- **Depends on:** T06
- **Touches:** `apps/native/src/features/journal/DraftList.tsx`
- **Done when:** unfinished drafts are listed with their date and situation snippet, resume at the first empty step, and can be discarded with a single honest confirmation.


**Note (session 13):** built as `DraftList.tsx` plus a `DraftCard` the Write
tab reuses, not as a drafts-only screen with its own card. g0 draws drafts
inline and g5 draws the same card full-screen; one component that appears in
both is the only way those two stay in agreement.

The discard control is a DIVERGENCE and worth reading before changing. g5
draws a list and no delete affordance at all, and this todo requires one
behind "a single honest confirmation". It is a long press that turns the card
itself into the question, with the same action published through
`accessibilityActions` because VoiceOver cannot long-press. Deliberately NOT
swipe-to-delete: a list of half-written thoughts is the last place in the app
to put a gesture that destroys something when a thumb slips. Deliberately not
a system `Alert` either -- an OS dialog is a modal in a foreign material, and
it is the one control style the designs never use.

The Write tab shows two drafts and its "Drafts" label navigates here. That
cutoff is not about tidiness: without it the archive gets pushed below the
fold by anyone who starts a lot of entries, which is the exact failure T12
forbids.

---

## T08 — Add save with confirmation

- [x] `0663a30`
- **Commit:** `feat(journal): add entry save with confirmation feedback`
- **Depends on:** T03, `04-audio-haptics` T03
- **Touches:** `apps/native/src/features/journal/EditorScreen.tsx`
- **Done when:** saving plays the pencil sound with a selection haptic, shows "Saved. That's yours.", and returns home — with no summary screen, no analysis, and no suggestion to write more.


**Note (session 13):** `SaveConfirmation.tsx`, rendered as a stage of the
editor rather than as a route -- a route would have to be navigated away from
and `dismissAll` would then have one more frame to get wrong.

It leaves on a 1600ms timer AND the whole screen is a target. A "Done" button
would make closing a notebook into one more thing to dismiss; a timer alone
would be a screen someone is stuck in if it ever fails to fire.

The warm rule is svg, not a `bg-accent` bar: amber in Calma is light rather
than paint, and a flat 8px band across the middle of a screen reads as a
status indicator. The dark mid-stop drops 0.55 -> 0.5 alongside the dimmer
base, which is the designs, not a rounding.

---

## T09 — Wire the post-session journaling offer

- [x] `0663a30`
- **Commit:** `feat(journal): wire post-session journaling offer`
- **Depends on:** T02, `06-breathing-engine` T13
- **Touches:** `apps/native/src/features/journal/JournalOffer.tsx`
- **Done when:** the offer appears only when `preSuds >= 7` or the post-check is "same" or "worse"; it uses the response-specific copy; "Not right now" dismisses permanently for that session; and it **never appears on the panic path**.


**Note (session 13):** `JournalOffer.tsx`, built from g1 -- a card in the
lower third with the orb still visible above at 40%, not the full-screen
heading-and-buttons the session stage rendered before.

`suds.post.writeAbout` ("Write about it") is now unused: g1's buttons are
"Let's write" and "Not right now", which are `journal:offerYes`/`offerNo`.
The key is left in `breathing.json` rather than deleted, because plan 18's
bundle test treats a missing key as a build error and removing it is a
separate, checkable change.

Three prompts, not two. "Worse" and "same" each have their own sentence; the
third case -- arrived at 7+ but came out better -- gets g1's own line, because
the "sometimes writing helps untangle things" copy contradicts someone who
has just said they feel better.

---

## T10 — Link entries to their originating session

- [x] `0663a30`
- **Commit:** `feat(journal): link entries to originating breathing session`
- **Depends on:** T09
- **Touches:** `apps/native/src/features/journal/store.ts`
- **Done when:** `linkedSessionId` is set when an entry originates from a session offer, and a deleted session leaves the entry intact with a null link rather than orphaning it.


**Note (session 13):** the draft is created in `SessionScreen` at the moment
"Let's write" is tapped, carrying the session id, rather than on the Write
tab. The entry therefore exists on disk before the editor mounts (the usual
guarantee) and the link is set at the one moment the app actually knows where
the entry came from. Inferring it later from timestamps would be a guess
dressed as a fact.

`SessionOutcome` grew a `sessionId`, `null` when the write failed. A link to a
session that was never stored is worse than no link: it is a claim the app
cannot honour later.

The unlink on delete is `JournalRepo.unlinkSession` plus
`deleteBreathingSession(repositories, id)` in `@calma/db`. It is a function
over the repositories rather than a method on `BreathingRepo`, because a
repository reaching into another repository is how a storage layer stops
being swappable. Order is unlink-then-delete: dying between the two costs a
link the entry can live without, and the other order leaves a dangling one.
**Nothing in the app deletes a session yet** -- this exists so that Settings'
"delete everything" and any per-session delete get it for free instead of
each remembering.

---

## T11 — Build the entry list

- [x] `0663a30`
- **Commit:** `feat(journal): build entry list with week grouping`
- **Depends on:** T08
- **Touches:** `apps/native/src/features/journal/EntryList.tsx`
- **Done when:** entries are grouped by day with the situation as the preview line, drafts are visually distinct without looking like errors, and the list is paginated 30 days at a time.


**Note (session 13):** `EntryList.tsx`, rendered inline under the Write tab's
"Earlier". g6 has no title and starts at the same 92px inset as g0's archive
section, so it reads as the Write tab scrolled down rather than as a separate
destination; giving it a route would have created a second archive.

The empty sentence now waits for the first page to come back. Until this
session the tab showed "Nothing written yet" unconditionally -- a screen
telling someone their writing does not exist.

"Show more" is a button, not infinite scroll. A list that keeps producing
more of your worst nights as you scroll is not something to hand someone at
3am.

DIVERGENCE: g6 writes "Two weeks ago" in words. No JavaScript `Intl` API
spells a number out, and a hand-written table of number words per locale is a
translation bug waiting to happen, so it renders "2 weeks ago". Past four
weeks it falls back to a plain date -- "nine weeks ago" is arithmetic about
someone's life rather than a memory of it.

The day labels are `describeDay` in `@calma/i18n` (pure, 15 assertions) plus
`useDayLabel`, which only picks a key. A locale can rephrase "Last Sunday"
without touching calendar logic, and calendar logic cannot be changed by
editing a translation.

---

## T12 — Build the Write tab

- [x] `f9f73bc`
- **Commit:** `feat(journal): build write tab`
- **Depends on:** T02, T07, T11, `05-app-shell` T03
- **Touches:** `apps/native/src/app/(tabs)/write.tsx`, `apps/native/src/features/journal/WriteScreen.tsx`
- **Done when:** the tab hosts starting a new entry, resuming drafts, and reading past entries; **starting to write is reachable in one tap and is the most prominent thing on the screen**; the archive never leads; and no entry count, quota, or target appears anywhere (D-015, `plans/19-review-findings.md` R7).


**Note (session 11):** g0 sets the "Draft" / "Earlier" section labels in IBM
Plex Mono. Calma ships two typefaces and adding a third for two labels would
be a third voice (D-017), so they use the sans `caption` variant with the
design's tracking. Also: the archive section is a placeholder sentence —
T11's paginated entry list is not built, so "Earlier" currently always shows
the empty-state copy even when saved entries exist.

---

## T13 — Guard against losing typed content

- [x] `0663a30`
- **Commit:** `fix(journal): never clear typed content on error or limit`
- **Depends on:** T06, T08
- **Touches:** `apps/native/src/features/journal/EditorScreen.tsx`
- **Done when:** a failed save, a hit weekly limit, a paywall, or any navigation leaves the person's text on screen and retained as a draft; a test asserts no code path clears the editor without an explicit discard; and save is idempotent for 600ms so a lagging tap cannot create a duplicate entry or burn two weekly allowances at once (`plans/19-review-findings.md` R1, R3).


**Note (session 13):** `__tests__/retention.test.ts`, which reads the source
rather than rendering. "No code path clears the editor without an explicit
discard" is a claim about every path including the ones a future commit adds;
a render test only ever shows that the paths it happened to try were fine.
Same shape and same reasoning as `onboarding/__tests__/guards.test.ts`.

Eleven assertions, and each one was made to fail once deliberately before
being kept -- inserting `update({ situation: '' })` into `onSave` and an
import of `JournalOffer` into `PanicEnding` both went red, and both went green
again when reverted.

It also carries the panic-path guard, which is plan 07's rule rather than
plan 09's: `PanicSession` and `PanicEnding` must not import `JournalOffer`,
`shouldOfferJournaling`, or anything under `journal/`. Session 12 removed the
mechanism that had quietly put an offer there; this keeps it removed.

---

## T14 — Build entry search

- [x] `0663a30`
- **Commit:** `feat(journal): build entry search`
- **Depends on:** T11, `03-storage-layer` T08
- **Touches:** `apps/native/src/features/journal/SearchScreen.tsx`
- **Done when:** search runs a debounced case-insensitive scan across all fields, returns newest-first with the matched term highlighted, and completes in under 100ms with 500 seeded entries. Gated for free tier in plan 11.


**Note (session 13):** `SearchScreen.tsx` from g7, at `/journal/search`.

DIVERGENCE, and the only one that adds UI the designs do not draw: g7 exists
and nothing shows the way in. A glyph sits to the right of the "Earlier"
label -- there is no header bar on the Write tab, and "Earlier" is the only
place on that screen where looking backwards is what someone is doing. A
glyph rather than a labelled button so it cannot start competing with "Start
writing" for attention (T12's rule).

Still a linear scan, deliberately: an inverted index of someone's journal is a
second copy of the most sensitive text on the device, in a shape that makes
it easy to read out of order (systems/02-data-layer.md).

The 220ms debounce carries a generation counter, so a slow scan cannot land
on top of the results of a later, faster one. `splitOnMatch` takes the
matched text from the original string rather than from the query, so
searching "priya" highlights "Priya" as the person wrote it.

**Not gated.** T10 of plan 11 gates search for free tier; the owner's
session-13 decision was to build ungated and add the gate with the rest of
plan 11.

UNVERIFIED: "completes in under 100ms with 500 seeded entries" needs a device
and 500 records. Left unticked in spirit -- the SHA below is for the screen,
not for that clause.
