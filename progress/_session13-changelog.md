# Session 13 — the G block finished, and the Plus block started

**Plan 09 is 14/14.** T07, T08, T09, T10, T11, T13, T14 — the seven that were
open. **Plan 11 is 8/13**: T01, T02, T05, T06, T07, T11, T12, T13. T03 and T04
are blocked on things that do not exist yet; T08, T09 and T10 are call sites
for a gate that is now built and not yet placed.

Eight screens: g5 drafts, g4 save confirmation, g6 entry list, g1 journaling
offer, g7 search, i1 plus offer, i2 plus active, d7 custom rhythm. Two of them
— g5 and i1 — were the "partial" rows in `03-screens-status.md` and are no
longer partial.

The owner was present and answered two rounds of questions. Their decisions
are collected at the bottom of this entry.

---

## The order, and why

Journal first, Plus second, on the owner's instruction. The reasoning is worth
recording: the journal block depends on nothing that does not exist, and the
Plus block depends on a RevenueCat project that has not been created. Stopping
halfway through journal-then-Plus leaves one complete feature; stopping
halfway through Plus-then-journal leaves two half-features.

That turned out to matter less than expected — both blocks landed — but the
Plus block did stop exactly where the missing dependency put it, which is the
part of the ordering that paid off.

---

## Plan 09 — the journal

### The Write tab was telling people their writing did not exist

`WriteScreen`'s "Earlier" section rendered `t('empty')` — "Nothing written
yet. There's space here when you want it." — unconditionally, because T11's
list was not built. Every saved entry in the app was invisible and the screen
said so in a sentence.

It is fixed, and the fix is worth naming as a shape rather than as a bug: a
placeholder that renders a *claim about the user's data* is not a placeholder,
it is a wrong answer in a friendly voice. `EntryList` now renders nothing
until the first page comes back, then either the entries or the empty
sentence.

### Days are described, not stamped

g5, g6 and g7 all date entries the way a person would — "Friday night", "Last
Sunday", "2 weeks ago". g6's caption is explicit: *"Days feel like days —
'Tuesday evening', not a timestamp."*

`describeDay` in `@calma/i18n` returns a **descriptor**, not a string. The
phrasing is translatable copy and belongs in `journal.json`; the branching is
calendar logic that has to be identical in every locale. Splitting them means
a translator can rephrase "Last Sunday" without touching calendar logic, and
calendar logic cannot be changed by editing a translation.

Two boundaries are pinned from both sides because they are the ones that
slide: six days back is still "Saturday afternoon", seven is "last Saturday".
**3am is night, not morning** — the hour this app exists for is the one case
where getting that word wrong matters most. Days are counted by calendar day
rather than by elapsed hours, so 23:50 and 00:10 are two days apart.

Past four weeks it becomes a plain date. "Nine weeks ago" is arithmetic about
someone's life rather than a memory of it.

### The discard control that the design does not draw

g5 draws a list of drafts and no delete affordance at all. T07 requires one,
"with a single honest confirmation". Resolved as a long press that turns the
card itself into the question, with the same action published through
`accessibilityActions` because VoiceOver cannot long-press.

Two things it deliberately is not:

- **Not swipe-to-delete.** A list of half-written thoughts is the last place
  in this app to put a gesture that destroys something when a thumb slips.
- **Not a system `Alert`.** An OS dialog is a modal in a foreign material, and
  it is the one control style the design set never uses anywhere.

The copy states what is lost in one sentence and does not warn: *"What you
wrote here won't be kept. Nothing else changes."* No "are you sure", no second
confirmation, no red.

### g1 is the session dimming, not a new screen

The offer stage existed in `SessionScreen` already, as a heading and two
buttons on a plain `Screen`. g1 is something else: a card in the lower third
with the orb still visible above it at 40% opacity. The caption calls it *"a
notebook slid across the table"*.

That difference is not decorative. When the session is still visible,
accepting is *continuing* and declining is simply the end of what was already
happening. A full-screen prompt makes "no" a thing you have to do rather than
a thing you can just not do.

**Three prompts, not two.** "Worse" and "same" have their own sentences
already. The third case — arrived at 7 or above but came out feeling better —
was falling through to the "same" copy, which says *"Sometimes writing helps
untangle things. Want to try?"* to someone who has just said they feel better.
It now gets g1's own line.

### The entry knows which session it came from

The draft is created in `SessionScreen` at the moment "Let's write" is tapped,
carrying the session id — not on the Write tab afterwards. Two reasons: the
entry exists on disk before the editor mounts, which is the guarantee the
whole feature is built on, and the link is set at the one moment the app
actually knows where the entry came from. Inferring it later from timestamps
would be a guess dressed as a fact.

`SessionOutcome` gained `sessionId`, `null` when the write failed. A link to a
session that was never stored is worse than no link — it is a claim the app
cannot honour later.

For the other half of T10, `JournalRepo.unlinkSession` clears the pointer and
leaves the entry completely intact, and `deleteBreathingSession(repositories,
id)` in `@calma/db` does both in the safe order — unlink, then delete. Dying
between the two costs a link the entry can live without; the other order
leaves a dangling one. It is a function over the repositories rather than a
method on `BreathingRepo`, because a repository reaching into another
repository is how a storage layer stops being swappable.

**Nothing in the app deletes a session yet.** This exists so that plan 14's
"delete everything" and any future per-session delete get the unlink for free
instead of each remembering it.

### Search is still a linear scan, on purpose

`JournalRepo.search` was already written and already commented with the
reason; the screen is new. Worth repeating here because it will look like a
performance oversight to the next person: an inverted index of someone's
journal is a **second copy of the most sensitive text on the device**, in a
shape that makes it easy to read out of order.

The 220ms debounce carries a generation counter, so a slow scan cannot land on
top of the results of a later, faster one.

`splitOnMatch` takes the matched text from the **original** string rather than
from the query, so searching "priya" highlights "Priya" as the person wrote
it. Handing someone their own sentence back with the capitalisation changed is
a small thing that reads as the app having edited them.

### T13, and the tests that were made to fail

`__tests__/retention.test.ts` reads the source rather than rendering, the same
way `onboarding/__tests__/guards.test.ts` does. "No code path clears the
editor without an explicit discard" is a claim about every path including the
ones a future commit adds; a render test only ever shows that the paths it
happened to try were fine.

Pinned: the editor never assigns an empty string to a field and holds no reset
or clear of its own; `repo.delete` appears exactly once in the whole feature,
inside `store.discard`; save is idempotent for 600ms; autosave is a debounce
plus `AppState` plus unmount, never `onBlur`.

It also carries **plan 07's** rule rather than plan 09's: `PanicSession` and
`PanicEnding` must not import `JournalOffer`, `shouldOfferJournaling`, or
anything under `journal/`. Session 12 removed the mechanism that had quietly
put an offer on the panic path. This is what keeps it removed.

**Every assertion was made to fail once before being kept.** Inserting
`update({ situation: '' })` into `onSave` and an import of `JournalOffer` into
`PanicEnding` both went red; both went green again on revert. That is recorded
because session 9's parity test passed for weeks while matching nothing.

---

## Plan 11 — entitlements

### What was built, and what it does when nothing is configured

There is no RevenueCat project, no configured products, and no API keys. The
owner chose to build the layer anyway, with every failure path resolving the
way `systems/05-entitlements.md` already specifies: **free tier, with all
paywalls suppressed.** Not free tier with paywalls — selling to someone whose
purchase would fail anyway is the worst of both.

That posture is load-bearing in three places, and each one will look like
missing error handling to someone reading quickly:

- **Both API keys are optional in `@calma/env`.** A missing key is a
  legitimate state, not a misconfiguration. Requiring them would mean the app
  cannot boot without a billing account, which for an app whose entire relief
  path is free is the wrong dependency.
- **`fetchPackages` returns `[]` rather than throwing.** The caller's correct
  response is identical either way: show no prices.
- **`paywallDecision` returns `'silent'` when `suppressed`** — including on a
  repeat hit, which has its own assertion.

### The cache never expires

A paying user is never downgraded by a tunnel. There is no staleness window
and no expiry, because the failure mode of a wrong expiry is that someone who
paid opens the app on a plane and finds their features gone; the opposite
error costs a few pence and upsets nobody.

Refresh is on foreground, throttled to once an hour inside the store, so
calling it every foreground is not polling. Nothing has a timer.

Hydration is deliberately **not** part of `boot()`. Boot decides whether the
app can open at all, and a billing SDK has no business in that chain.

### The gate is the part worth reading

`paywallGate.ts` is a pure function and `gateStore.ts` is the zustand half.
The split is not tidiness: `apps/native/vitest.config.ts` runs pure Node with
no renderer, and **a rule that can only be checked by mounting a component
tree is a rule that stops being checked.**

Two rules, deliberately not merged. *Frequency* (T07): a limit shows the sheet
at most once per calendar day, later hits get one inline line. *Interruption*
(T12): while anything is in flight, nothing commercial appears at all, not
even the line. "Not now" and "not again today" are different states, and
collapsing them would let a deferred sheet count as having been shown.

Blockers are a **deny-list of moments rather than an allow-list of screens**,
so a new screen is blocked the moment it registers a hold and nobody has to
remember to add it to a list somewhere. `'field'` covers "any text field in
the app has focus", which catches the cases nobody enumerates.

Fifteen assertions, all executed — one per condition T12 names, plus two it
does not: a completion timestamp in the **future** (clock changes move
`Date.now()` backwards, and this must fail toward silence rather than toward
selling), and a suppressed build staying silent on a repeat hit.

**The holds are not yet placed.** `usePaywallHold` exists and no screen calls
it. Until the capture field, the session screens, the worry window and the
editor each register one, the gate is a correct mechanism with nothing feeding
it. That is the first thing to do when plan 11 resumes.

### i1, and a conflict that needed the owner

i1 draws **one** price row — "Monthly £4" — and its caption says *"one price,
no annual-vs-monthly savings maths, no strike-through, no timer, no 'most
popular'"*. `systems/05-entitlements.md` says *"Lifetime is offered and is not
buried"*, and plan 11 T13 asks for monthly, annual and lifetime at equal
prominence.

Raised rather than resolved silently. `AGENT-PROCESS`'s precedence rule says
designs win on appearance and systems docs win on behaviour that spans
screens, and "which products exist" is the second kind. **The owner chose
three rows**, in exactly i1's row treatment, all identical, with none of the
comparison furniture the caption forbids.

The token layer encodes that: there is exactly one price surface and
deliberately **no highlighted variant of it**. A `--surface-price-featured`
appearing in `global.css` later is the bug.

### i2 cannot show what i2 draws

i2 has rows for "Payment method  •••• 4417" and "Receipts". Anonymous-mode
RevenueCat means the app never sees a card number and has no receipt list —
the store holds both. Rendering masked digits would mean inventing them.

**The owner chose to drop the two rows** rather than fake them. "Stop Plus"
survives and deep-links to the platform subscription page, which is the only
place either store allows a cancellation — and it stays a plain row in the
same ink as everything else, with no "are you sure you want to lose
everything" between the person and the door.

### d7, and the one place the design was not matched

The custom row on d1 was inert; it now opens `/custom-rhythm`. Bounds come
from `customRatioProblem` in `@calma/domain` — the same validation the
timeline builder uses — so a ratio this screen accepts can never be one the
engine rejects. Out of range is **prevented** by the steppers rather than
reported afterwards: the plus stops adding and a plain sentence says why.
Nothing turns red.

**The orb does not follow the numbers yet**, and d7's caption says it should.
Driving it from the live ratio would restart the animation on every tap, which
is the one thing an orb must never do (D-004). Doing it properly means
building a timeline from the draft ratio and rescheduling only on a settled
value. Real work, worth doing, and not worth a stuttering orb in the meantime.
Flagged in `plans/11` T11.

---

## Twenty new tokens, and the pattern that produced them again

**Five sessions running, a feature has turned out to have its own ground.**

`--saved` (g4) is `#FBF4E7`. `--lift` is `#FBF4E9` and `--ending` is
`#FBF3E6`. Three warm off-whites within two points of each other, and none of
them is the other two. Reusing `--ending` would have looked correct and would
have meant that fixing the panic ending silently moved the journal's save
confirmation.

Also `--offer` and its surface pair (g1), `--highlight` (g7),
`--surface-price` (i1), three tinted feature tiles (i1), `--surface-plus` and
its two text colours (i2), `--separator-row` (i2), and `--surface-stepper`
with `--stepper-glyph` (d7).

Two of those exist because the full-strength value is wrong at the size it
appears: `--highlight` is a wash rather than `--accent`, which across body
text reads as an alert, and `--stepper-glyph` is not the text colour, because
a full-strength minus at 46px reads as a delete control.

**Parity was checked and the check was made to fail first.** All 82 mapped
variables agree across `colors.ts`, `global.css` and `tailwind.ts`. No pure
white, no pure black, no danger colour.

---

## Verified, and not

**Executed, in this session, with real assertions:**

- 44 assertions across `describeDay`, `entries.ts` and the journal retention
  guards — run in Node with type-stripping, because `vitest` cannot be
  installed in the sandbox and the device's `node_modules` is not reachable
  from it.
- 15 assertions on `paywallDecision`.
- Token parity across the three files, 82 variables.
- Negative controls on the retention guards and on the parity check.

**Not verified, and this is the honest list:**

- **`tsc` did not finish.** Started on the device early in the session and
  still running, with an empty log, when the session ended — well over half an
  hour. Same for `eslint`. Neither produced a single line of output, which is
  not the same as passing. `apps/native` typechecked clean at the start of
  session 12 and has had four sessions of code added since.
  **Run `pnpm check-types` before anything else.**
- **Still nothing has rendered.** Thirteen sessions. Eight more screens now
  sit on top of the thirty-four that have never been seen.
- The 100ms-with-500-entries clause on plan 09 T14.
- Every purchase path: offerings, buying, restoring. None can execute until a
  RevenueCat project exists.
- VoiceOver, 200% font scale, Reduce Motion and the pseudo-locale, on all
  eight new screens.

---

## Decisions made on the owner's instruction, or in their absence

Answered directly by the owner:

1. **Journal before Plus**, so partial completion leaves a complete feature.
2. **Build the entitlement layer and let it degrade** rather than stubbing a
   local tier flag or skipping the Plus screens.
3. **Build g7 and d7 ungated**; the gate is plan 11's to add later.
4. **i1 shows three price rows**, resolving the design/systems conflict in
   favour of the systems doc.
5. **i2 drops the payment-method and receipts rows** rather than faking them.

Made without asking, and all reversible:

6. The Write tab shows **two** drafts and its "Drafts" label navigates to g5.
   Without a cutoff the archive gets pushed below the fold by anyone who
   starts a lot of entries, which is the exact failure T12 forbids.
7. **A search glyph was added beside "Earlier"** — g7 exists and no design
   draws the way in.
8. `describeDay` renders **"2 weeks ago", not "Two weeks ago"**. No JavaScript
   Intl API spells a number out.
9. The paywall route's sheet detent went **0.55 → 0.92**. i1 is a full screen.
10. Grey normalisation: the design set uses both `#5B6873` and `#5F6C78` in
    light and both `#8F98A3` and `#93A0AC` in dark, roughly at random. All
    four normalise to the existing `--muted` / `--faint` tokens, the same way
    session 11 normalised the worry grounds.
11. The mono day labels use the sans `caption` variant with the design's
    tracking, following session 11's precedent for g0's section labels (D-017:
    Calma ships two typefaces, and a third would be a third voice).

---

## Files moved onto the machine by archive

This session wrote its code in a cloud sandbox and delivered it as two
tarballs, `_session13.tgz` and `_session13b.tgz`, unpacked in place. **The
commit script deletes both**; they were never tracked. If either is still
sitting in the repository root, the script has not been run.

