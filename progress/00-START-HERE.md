# START HERE

You are picking up **Calma**, a local-first anxiety companion for iOS and
Android. This file is self-contained. Read it fully before touching anything.

> **Read `progress/AGENT-PROCESS.md` first.** It is how work is done here —
> the pillars, how to budget a chat's context, what to ask before starting,
> and what "leaving the repo correct" means. This file is only *what* to build
> next. That one is *how*.

Last updated: end of session 13.

> **For "is screen X done?", read `progress/03-screens-status.md`.** It is all
> 58 screens in one table — built, cut, or not started — plus the handover
> order for the 15 that remain. It talks in screens rather than features,
> because a feature being "done" is not something anyone can look at.
> **Current count: 42 built, 0 partial, 1 cut, 15 not started, 0 verified.**

---

## The rule that comes before everything else

**Every screen you build, you build from its design file.**

`designs/extracted/*.html` is 58 screens, light and dark. It is the source of
truth for layout, colour, size, spacing and weight — above `systems/`, above
`@calma/tokens`, above anything written in prose. Open the file for the screen
you are on, read the values out of the markup, and read the caption block at
the bottom, which says *why*.

> If `designs/extracted/` is missing, run `python designs/extract.py`. Both
> the folder and the script are gitignored; `designs/html/` is the tracked
> source.

**The token layer is incomplete by default, and has been five sessions
running.** The shape is always the same: a feature gets its own ground, the
ground gets its own surface and border pair, and `colors.ts` only finds out
when someone opens the design file.

| Session | What was missing | How it survived |
|---|---|---|
| 9 | `--immersive` (light mode's own #F2E7D6) | Absent from tokens *and* the census. Everything downstream agreed with itself. |
| 10 | `--surface-quiet` | A card and a button look like the same material until you check nine screens. |
| 11 | `--worry` and `--write`, two whole grounds | Nobody had opened the f- or g- screens. |
| 12 | `--panic` and `--ending`, two more | The panic screens rendered on `--immersive`. Two dim warm sands that are not the same dim warm sand. |
| 13 | `--saved`, `--offer`, `--highlight`, and eleven more | `--saved` is #FBF4E7. `--lift` is #FBF4E9 and `--ending` is #FBF3E6. Three warm off-whites, two points apart, none of them the other two. |

**Assume the ground you need does not exist yet.** Check `global.css` against
the design file before you write a single `bg-` class.

There are now 82 themed variables and the parity test covers all of them, in
`colors.ts`, `global.css` and `tailwind.ts`. **Change a colour in all three.**
The test tells you if you forgot one; only the design file can tell you the
value is wrong in all three.

The one deliberate exception: **the orb's proportions follow `systems/03`
(35% halo at 1.35R), not d3's 1.64.** Decided in session 9. Do not "fix" it.

---

## Your task

**Run the app. Everything else is downstream of that.**

Twelve sessions of code, seven features' worth of screens, and **not one
screen has ever rendered.** This has now been the stated task for four
sessions running. Nothing below matters as much.

```powershell
powershell -ExecutionPolicy Bypass -File progress\commit-session-12.ps1   # FIRST
powershell -ExecutionPolicy Bypass -File progress\commit-session-13.ps1

pnpm install
pnpm check-types      # DID NOT COMPLETE in session 13 — see below
pnpm test             # THE FIRST RUN, EVER. Expect real failures.
pnpm --filter native android
```

**Session 12's work is still uncommitted.** `panic.tsx`, `PanicFab.tsx`,
`PanicSession.tsx`, `PanicEnding.tsx` and `breathing.json` all show as
modified or untracked in `git status`. `progress/commit-session-12.ps1` was
written to commit them and has never been run. **Run it before session 13's
script** — the two scripts do not touch the same paths, but committing 13 on
top of an uncommitted 12 makes the log lie about the order things were built.

**`pnpm check-types` and `eslint` both hung in session 13.** Started on the
device, left running for well over half an hour, and neither produced a single
line of output — not a pass, not a failure, nothing. That is a fact about the
toolchain on that machine, not a claim about the code. `apps/native`
typechecked clean at the start of session 12 and has had four sessions of code
added since. **This is the first thing to establish.** If it hangs again, try
`pnpm --filter @calma/domain check-types` and the other packages one at a time
to find where it stalls.

> **`pnpm dev:native` alone will not get you a running app.** `expo start`
> expects a dev client, and `react-native-mmkv`, reanimated, svg and
> `react-native-purchases` are all native — Expo Go cannot load this project.
> `apps/native/android/` exists from session 11's prebuild (gitignored) but is
> **stale**: `android.package` changed to `app.calma.mobile` in session 11, so
> run `npx expo prebuild --clean` before building. **You are on Windows: iOS
> needs a Mac.** Any "on both platforms" clause in a plan cannot be closed
> from this machine.

### What to look at, in this order

1. **Does it look like Calma?** Warm sand or deep navy, amber orb. If it looks
   like a blue-and-grey component library demo, the theme in
   `apps/native/global.css` is not resolving.
2. **A breathing session.** Tab "Breathe" → "The sigh". Does the orb breathe
   (0.62↔1.0, soft edge, never perfectly still)? Do the haptics land with it?
3. **Onboarding, from cleared prefs.** Ten screens, B1 through B11 with B3
   cut. B7 is a real session — breathe it, then check that it persisted.
4. **The worry flow.** Capture four worries in under fifteen seconds without
   waiting once. That is the entire design of `CaptureField` and it has never
   met a human hand.
5. **The write tab, end to end — new in session 13 and the largest untested
   surface.** Start an entry, type a sentence, force-quit, reopen (the
   sentence must still be there). Save it and watch for "Saved. That's yours."
   Then: does it appear under "Earlier"? Does the day label say something a
   person would say? Does search find it? Does a draft's long press offer to
   discard it, and does "Keep it" keep it?
6. **The post-session offer.** Rate 8 or above before a session; at the end
   the orb should stay visible behind a card in the lower third, not vanish.
7. **The Plus screens.** With no RevenueCat keys they must show *no prices and
   no paywalls at all* — that is the designed behaviour, not a bug. `/paywall`
   should render i1 with one plain sentence where the prices would be.
8. Then **VoiceOver, 200% font scale, Reduce Motion**, plus the pseudo-locale
   from plan 18 T14 to catch truncation.

Anything you fix goes in as its own `fix(...)` commit.

---

## What Calma is, in five rules

1. **No network layer.** No servers, no accounts, no analytics. The only
   network traffic in the whole app is RevenueCat.
2. **No data leaves the device.** Encrypted MMKV, key in SecureStore.
3. **No friction on the panic path.** One tap to breathing from anywhere. No
   paywall, no permission prompt, no modal may ever appear on it.
4. **No hard paywalls.** Every relief tool is unlimited free. Plus adds depth.
5. **Tone is a feature.** No exclamation marks anywhere. No red. No error
   states.

Full context: `progress/01-project.md`. Decisions: `systems/09-decisions.md`.

---

## What is already built

### Packages — done, tested, and the tests have never run

| Package | What is in it |
|---|---|
| `@calma/domain` | Entities + zod schemas, `dayKey`/`weekKey`/`shiftDayKey`, ULID ids, tier limits, streak, breathing patterns, the breathing timeline machine, the worry triage machine |
| `@calma/db` | Four repositories, indexes, migrations, `repairIndexes`, aggregates, MMKV adapter, `deleteBreathingSession` |
| `@calma/i18n` | Nine locale namespaces, fallback chain, `Intl` formatters, `describeDay`, pseudo-locale, `TRANSLATORS.md` |
| `@calma/tokens` | Colours, typography, layout, motion, the CSS-variable name map + parity test (82 variables) |

### The grounds

The part of the design system most likely to trip you up, so it is here rather
than buried. **Seven grounds now**, and each has its own surface and border
pair:

| Class | Light | Dark | Where |
|---|---|---|---|
| `bg-background` | `#FBF7F1` | `#141C26` | most screens, plus g7 search, i1, i2, d7 |
| `bg-immersive` | `#F2E7D6` | `#101823` | breathing (d3-d5, b7, k3) |
| `bg-panic` | `#EADCC6` | `#0D141C` | e2, e3. Dimmer than immersive |
| `bg-ending` | `#FBF3E6` | `#18212B` | e4 |
| `bg-lift` | `#FBF4E9` | `#16202B` | b9, f8, h3. Light warms up, dark lifts *off* navy — the direction reverses |
| `bg-worry` | `#F6EDE3` | `#1A1D24` | f1-f7 |
| `bg-write` | `#FAF4E9` | `#151D26` | g0, g2, g3, g5, g6, e1 |
| `bg-saved` | `#FBF4E7` | `#17202A` | g4 and only g4 |
| `bg-offer` | `#F5EDE0` | `#131B24` | g1 |

**A button standing on a ground gets a different pair from a card standing on
it.** That distinction has been rediscovered three times; do not collapse
them. `bg-surface-worry`, `bg-surface-paper` and `bg-surface-offer` are
**brighter than the grounds they sit on** — a slip of paper on a table. They
are the only surfaces in Calma that do that.

### The breathing engine — plan 06, 14/14

`apps/native/src/features/breathing/`. **The session is scheduled once and
then left alone.** `buildTimeline` expands a pattern into a flat array of
phases with absolute start times; `useOrbAnimation` hands the whole array to
Reanimated as one `withSequence`, and the UI thread owns the breath from then
on — no timer, no tick, no per-phase re-render. If JS is busy the *label* is
late and the *breath* is still perfect. **Do not add a `setInterval` in here.**

### Audio and haptics — plan 04, eight of nine

`src/lib/audio/` and `src/lib/haptics/`. Six sounds ship. Preferences push
into module-level flags rather than being read through a hook, so toggling
sound in Settings does not re-render a screen that might make a noise.
`Error`, `Warning` and `Rigid` haptics are not exported and not wrapped.

### App shell (05), onboarding (13), panic (07), worry (08) — all written, never run

Onboarding's step machine is pure and its progress fractions are hand-authored
so position can be sensed but not counted. The crisis exit is rendered by
`StepFrame` and is **not a prop**, so a step cannot express the idea of not
having one.

The panic path is `PanicSession.tsx` and `PanicEnding.tsx`, split out of
`SessionScreen` in session 12 because a `panic?: boolean` flag had let three
rule violations in one `if` at a time. **There is a test asserting the panic
screens cannot reach the journaling offer** — keep it that way.

Worry: **the store holds ids, not text.** `pendingIds: string[]`, never
`Worry[]`. **The capture field is never blocked** — read, clear, write, *then*
animate. **`reconcileWindow` re-anchors on outcomes, not on the cursor index.**

### Journaling — plan 09, 14/14 as of session 13. Written, never run.

`apps/native/src/features/journal/`.

**An entry is a draft on disk before its first keystroke.** Autosave is
continuous and debounced at 800ms — *not* on blur, because blur-only saving
loses the field they were in the middle of, which is the only field that
matters. Three triggers: debounce, `AppState` leaving active, unmount.

**No code path in the editor clears it, and there is now a test that proves
the mechanism is absent** rather than a test that tried a few paths
(`__tests__/retention.test.ts`).

New in session 13: g5 drafts with a long-press discard, g4's save
confirmation, g6's day-grouped archive, g1's post-session offer, g7 search,
and `describeDay` — which dates entries the way a person would rather than
with a timestamp. Search is a **linear scan on purpose**: an inverted index of
someone's journal is a second copy of the most sensitive text on the device.

### Entitlements — plan 11, 8 of 13. Written, never run, and cannot be.

`apps/native/src/features/entitlement/`.

**Everything degrades to "free tier, paywalls suppressed."** There is no
RevenueCat project and no API keys, and that is a legitimate state rather than
a misconfiguration — see `packages/env/src/native.ts`. Selling to someone
whose purchase would fail anyway is the worst of both.

**The cached tier never expires.** A paying user is never downgraded because
their train went into a tunnel. Refresh is on foreground only, throttled to
once an hour.

**`paywallGate.ts` is pure and `gateStore.ts` is the zustand half.** Fifteen
assertions cover every condition under which a paywall must not appear. The
split exists so those assertions can run in Node at all.

i1 and i2 are both at `/paywall`, chosen by tier. d7 is at `/custom-rhythm`
and d1's custom row now opens it.

### Not built

Progress (10), notifications (12), settings (14), web (15), release (16). Plus
the rest of plan 11: T03, T04, T08, T09, T10.

---

## Read this before you write a line

### The theme, and the mistake worth not repeating

`packages/tokens/src/tailwind.ts` used to export `calmaPreset`, a Tailwind
**v3** `theme.extend` object. Uniwind runs Tailwind **v4**, which is CSS-first
and never loads a JS config. Nothing imported it. For three sessions the app
was styled by heroui-native's stock blue-on-grey palette while the tokens sat
in a file that was not plugged in, and no test noticed.

The theme now lives in `apps/native/global.css` as real CSS. `tailwind.ts` is
the name map, and `packages/tokens/src/theme-parity.test.ts` reads the CSS and
fails if a single hex drifts. **The parity test has still never been executed
by vitest** — session 13 reimplemented its logic in the sandbox and confirmed
all 82 variables agree, which is not the same as running it.

### Weight — and slant — is part of the font family name

`font-sans font-medium` does not work. expo-font registers each face under its
own family and neither platform synthesises weights, so it renders regular on
iOS and can fall back to Roboto on Android — silently, with no error. Use
`font-sans-medium` / `font-sans-semibold` / `font-serif-medium`.
`font-serif-italic` exists for the same reason and is used by exactly one line
in the app (f8).

### Amber fills are gradients, not flat colours

`amberGradient` carries the three stops and the glow. `Button`'s `primary`
variant, `PanicFab` and g4's page-edge rule draw them with react-native-svg. A
flat `bg-accent` where a fill belongs is a bug — amber is the one thing in
this app that gives off light. `clayGradient` follows the same pattern for
"Set it down" and is deliberately **not** a fifth `Button` variant.

### The two typefaces (D-017)

Newsreader serif for sentences meant to be **felt**, Figtree sans for
everything only meant to be **read**. `Text`'s `variant` prop encodes this. In
dark mode the serif takes `text-warm` (cream) and the sans takes
`text-foreground` (cool grey); if those collapse into one value, every
emotional line starts reading like a status bar. There is a test.

**The designs set small uppercase labels in IBM Plex Mono. Calma does not ship
it and must not.** A third typeface is a third voice. Those labels use the
sans `caption` variant with the design's tracking — sessions 11 and 13 both
did this; keep doing it.

### Animation state never goes in Zustand (D-004)

A store write during an inhale is a dropped frame someone can feel. This is
also why d7's orb does not yet follow the numbers being edited.

### Every string goes through `@calma/i18n`

Lint fails on literal JSX text in `features/`. **The three feeling faces
(😌 😐 😔) live in the component, not the JSON** — deliberately, so the bundle
test can forbid emoji absolutely.

Beware naive key checkers: `pending`, `worryWindowSoon`, `entries`,
`weeksAgo` and friends resolve through ICU plural suffixes (`_one` /
`_other`). A grep-based checker reports them as missing.

### Pure logic goes in a `.ts` file, or it cannot be tested

`apps/native/vitest.config.ts` runs pure Node with no renderer. Anything with
a decision in it — grouping, preview selection, match splitting, the paywall
gate — lives in a `.ts` module beside its component rather than inside it.
**A rule that can only be checked by mounting a component tree is a rule that
stops being checked.**

### The sandbox cannot delete files or run git

The mount blocks `unlink`, so `git` strands its lock files and refuses to run,
and `tar` cannot overwrite an existing file. Write all the code, then emit a
PowerShell script the user runs — see `progress/commit-session-{6..13}.ps1`.
It commits one todo at a time.

**Any `.ps1` you write must be ASCII-only.** Windows PowerShell 5.1 reads a
script as ANSI unless it has a BOM, so an em dash in a here-string gets
written into the repo doubly encoded. Check with:
`python -c "print(sum(1 for b in open(p,'rb').read() if b>127))"`

**`vitest` cannot run in the sandbox** and cannot be installed there either —
there is no npm registry. Session 13's workaround, which is worth reusing:
`node --experimental-strip-types` with a ~40-line `describe/it/expect` shim
and a loader that resolves extensionless relative imports. It ran 59
assertions. Not the real suite; enormously better than nothing.

**`tsc` and `eslint` both hung on the device in session 13** with no output at
all. `expo export` does not finish either. `expo prebuild` *does* work.

### Other hard rules

- **Strip the mockup furniture** from the designs — the fake status bar,
  notch, home indicator and the whole fake keyboard sit inside `<sc-if>`
  blocks. They are not app UI.
- **Never import `react-native-mmkv` outside `packages/db`.** Lint enforces
  it. `expo-haptics` should get the same treatment outside `src/lib/haptics`.
- **Never import React, RN, Expo, Zustand or i18n inside `packages/domain`.**
- A **skipped SUDS rating is `null`, never 0** (D-007).
- The panic session is dismissible at any moment with one visible button.
- **`logIn()` is never called on RevenueCat.** Anonymous mode only. An
  identity would travel with every receipt.

---

## How to work here

- **One todo, one commit.** Tick the plan-file checkbox with the short SHA in
  the same commit. Format: `systems/08-git-workflow.md`.
- **If the plan is wrong, change the plan first**, in its own `docs(plan):`
  commit. Never silently diverge. Look for "Note (session N)" blocks.
- `plans/`, `systems/` and `progress/` are gitignored.
- **Update `progress/04-changelog.md` before you finish.** Newest at the top.
  It is the only place the *reasoning* survives.

---

## Where things are

| Path | What | Tracked |
|---|---|---|
| `systems/` | How it works — architecture, data, tone, 19 decisions | gitignored |
| `plans/` | 189 todos, one commit each | gitignored |
| `progress/` | This folder — the method, handoff state, commit scripts | gitignored |
| `designs/html/` | Original design bundles (encoded) | tracked |
| `designs/extracted/` | 116 files: 58 screens × light/dark | gitignored |
| `packages/{domain,db,i18n,tokens,config,env}/` | The libraries | tracked |
| `apps/native/app/` | Routes. **Not `src/app/`** | tracked |
| `apps/native/src/` | Everything that is not a route | tracked |
| `apps/native/android/` | Generated by prebuild. Regenerate, never edit | gitignored |

**Route location deviation.** Several plans say `apps/native/src/app/`. The
routes are actually in `apps/native/app/`. Read `src/app/` as `app/`.

---

## Open items, in priority order

1. **Run the commit scripts, then establish whether the code compiles.**
   Session 12's script has never been run and session 13's is new. Then
   `pnpm check-types` — it hung in session 13 and produced nothing, so its
   result is genuinely unknown, and four sessions of code have landed since
   the last clean typecheck.

2. **Nothing has rendered. Four sessions running, now seven features deep.**
   Plans 05, 06, 07, 08, 09, 11 and 13 have ticked boxes so you know the code
   exists; they are honest only once it has run. `pnpm test` has **never
   executed in any session** — not once, in thirteen sessions.

3. **Place the paywall holds.** `usePaywallHold` exists and no screen calls
   it. Until `CaptureField`, `SessionScreen`, `PanicSession`,
   `WorryWindowScreen` and `EditorScreen` each register one, plan 11 T12's
   guarantee is a correct mechanism with nothing feeding it. Five one-line
   additions, and the test that proves them is already written.

4. **Finish plan 11: T08, T09, T10** — the three call sites for `useLimit`.
   The hook, the sheet, the frequency cap and the gate all exist and are
   tested; nothing calls them. This is the cheapest remaining work in the repo
   and it closes the loop on everything session 13 built.

5. **T03 and T04 are blocked on you, the owner.** A RevenueCat project,
   `calma_plus_monthly` / `calma_plus_annual` / `calma_plus_lifetime` in App
   Store Connect and Play Console, the `plus` entitlement mapped to all three,
   and the two public SDK keys in `apps/native/.env` as
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
   Until then the app runs correctly with no paywalls at all.

6. **`panic.m4a` is missing and must be regenerated.** The delivered file has
   a ~31 Hz fundamental with 90% of its energy below 300 Hz — no phone speaker
   reproduces it. It is the one sound a person hears at their worst moment.
   `soundManifest.panic.module` is `null` and the bank treats that as a silent
   no-op, so nothing is blocked — but plan 07 T03 cannot be done until it
   exists.

7. **Plan 10, the progress dashboard.** Five screens, and the block that
   proves B7's onboarding breath actually persisted. `packages/db` already
   computes the aggregates, so it is more screen work than logic. Watch the
   tone rules hard: no scoring, no comparison to previous weeks, no chart that
   implies a target. h3 is the single most likely screen in the app to
   accidentally congratulate someone.

8. **Plan 14, settings.** Everything onboarding collects — name, language,
   worry window, breathing preference, notifications — is currently
   uneditable, and there is no home for "erase everything" or for j3 crisis
   resources. It is also where plan 11 T04's restore row belongs.

9. **d7's orb does not follow the numbers**, and its caption says it should.
   See `plans/11` T11 for why the naive version is worse than the current one.

10. `systems/04-audio-and-haptics.md`'s ffmpeg command uses `loudnorm`, which
    normalises loudness rather than peak — it contradicts the doc's own
    "-3 dBFS peak" requirement. The doc should be updated.

11. `apps/native/app/+not-found.tsx` is still Expo template boilerplate:
    untranslated English, an emoji, and `rounded-lg`/`text-4xl` classes from
    outside the design system. It is also the only consumer of the leftover
    `components/container.tsx`, which imports `expo-haptics` directly via
    `theme-toggle.tsx` — against the rule above.

12. No CI config. Parity and tone run as tests, so `pnpm test` covers it until
    `plans/16`.

---

## The test

Before calling any screen done:

> If someone opened this at 3am, shaking, having just had the worst thought
> they've had all year — would this help, or would it be one more thing to
> deal with?
