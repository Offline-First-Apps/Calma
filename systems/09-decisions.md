# Decision Log

Append-only. Each entry records what was decided, why, and what it forecloses. Supersede rather than edit.

---

## D-001 — Storage: MMKV + expo-secure-store, behind a repository port

**Decided.** Records live in encrypted MMKV. The encryption key lives in `expo-secure-store`. All reads and writes go through repository interfaces in `packages/db`.

**Why.** MMKV is synchronous and fast, which suits an app where a screen must render instantly during a panic. SecureStore gives us Keychain/Keystore-backed key custody without a server.

**Cost.** MMKV is key-value. There is no query engine. History, monthly trends, and journal search require hand-maintained indexes and in-memory filtering.

**Mitigation.** The repository port (`packages/db/src/ports`) is storage-agnostic. Feature code never imports MMKV. If record volume outgrows in-memory filtering, we add a `sqlite` adapter alongside the `mmkv` one and change a single factory line.

**Rules out.** Realm, Drizzle/expo-sqlite in V1, and any direct `MMKV` import outside `packages/db`.

**Threshold to revisit.** Any repository query taking >16ms on a mid-range Android device, or journal entries exceeding ~2,000 per user.

---

## D-002 — Payments: RevenueCat from day one

**Decided.** `react-native-purchases` integrated in V1. Products configured in App Store Connect and Google Play Console before the entitlement feature is built.

**Why.** Cross-platform receipt validation and restore-purchases logic without a server, which is otherwise the hardest part of a serverless paid app.

**Cost.** RevenueCat is the app's only network dependency. It must fail open — a network error never blocks a free-tier user, and a previously-verified Plus user stays Plus offline.

**Rules out.** StoreKit-direct, expo-iap.

**Constraint.** RevenueCat is initialised in anonymous mode. We never call `logIn()` with a user identifier. No account system exists and none is implied.

---

## D-003 — Platforms: iOS and Android in parallel

**Decided.** Both platforms are tested for every feature. A feature is not done until it works on both.

**Cost.** Haptics, audio interruption, and notification scheduling differ materially between platforms. Each feature plan carries an explicit both-platforms verification todo.

**Android specifics to watch.** No `Haptics.selectionAsync` equivalent fidelity; vibration amplitude control varies by OEM. Notification channels are required. Background audio ducking behaves differently.

---

## D-004 — State: Zustand + feature folders

**Decided.** `apps/native/src/features/{breathing,worry,journal,progress,onboarding,settings}`. Each feature owns its screens, components, store, and repository calls. Zustand for cross-screen state; local React state for everything else.

**Why.** Small surface, no provider nesting, and selector-based subscriptions matter during 60fps orb animation.

**Rules out.** Redux, MobX, React Context as the primary state mechanism.

**Rule.** Animation values live in Reanimated shared values, never in Zustand. A store update must never run on a frame boundary during an active breathing session.

---

## D-005 — `apps/web` is a marketing site only

**Decided.** Next.js app serves the landing page, privacy policy, support page, and store links. It shares no data or logic with the app beyond `packages/ui` tokens.

**Rules out.** A web version of Calma, any shared session state, any web-based data entry.

---

## D-006 — Panic button is a floating overlay, bottom-right

**Decided.** A fixed FAB above the tab bar, present on every screen except during an active session, onboarding, and the worry window.

**Why.** Thumb reach matters more than visual prominence when someone is having a 2am panic attack.

**Consequence.** The original walkthrough line "It's always there, right at the top" is factually wrong. The voice track is since removed (D-012), so nothing needs re-recording — but the corrected wording survives as on-screen copy, and onboarding now teaches the button by having the person use it rather than by describing its position at all. See `systems/11-onboarding.md`.

---

## D-007 — SUDS: numeric before, emoji after

**Decided.** A 0–10 intensity slider is offered *before* a breathing session (skippable). A three-emoji check (better / same / worse) runs *after*.

**Why.** The blueprint asks for both a "SUDS 7+" journaling trigger and a three-emoji post-check. Numeric pre-rating gives the trigger and the dashboard its trend data; emoji post-check keeps the closing moment gentle.

**Rules.**
- The pre-rating is **always skippable** and is **never shown on the panic path**. Panic → breathing, immediately.
- Journaling is offered when `pre_suds >= 7`, or when the post-check is "same" or "worse".
- A skipped pre-rating stores `null` and is excluded from trend averages, not counted as zero.

---

## D-008 — Missed worry windows carry over, with no guilt language

**Decided.** Unprocessed worries roll forward indefinitely. The window is manually openable any time after its scheduled start. Nothing is ever auto-deleted.

**Copy rule.** The app never says "missed", "overdue", "you forgot", or shows a red badge. The pending count is stated neutrally: *"You have 4 things waiting whenever you're ready."*

**Rules out.** Auto-release after N days. We do not discard user data without an explicit tap.

---

## D-009 — Free-tier limits reset on the local calendar day / week (Monday start)

**Decided.** Worry capture limit (3) resets at local midnight. Journal entry limit (2) resets Monday 00:00 local.

**Implementation notes.**
- Day keys are `YYYY-MM-DD` in the device's current timezone, computed at read time — never a stored UTC offset.
- Week keys are ISO week (`YYYY-Www`), Monday-start.
- Crossing a timezone eastward may shorten a period. Accepted. We never claw back an allowance already granted, and counts are never negative.
- Device clock manipulation to gain allowances is not defended against. It is not worth the friction.

---

## D-011 — i18n: i18next, English-only launch, architecture ready for more

**Decided.** `i18next` + `react-i18next` + `expo-localization`. Every string externalised into locale JSON from the start. English is the only locale that ships.

**Why.** Retrofitting i18n is one of the most expensive refactors a mature app can undergo — it touches every component. Doing the infrastructure now costs one plan file; doing it in a year costs a quarter. Shipping only English keeps translation cost and QA burden at zero until there's a reason for them.

**Consequence.** `apps/native/src/copy/` is replaced by `packages/i18n/src/locales/en/*.json`. The tone rules in `systems/07-copy-and-tone.md` are unchanged and still govern every string.

**Rules out.** Hardcoded strings anywhere in `features/`. Sentence assembly from fragments. Hardcoded date, time, or number formats — `Intl` only. RTL support in V1 (see `systems/10-i18n.md` for why partial RTL is worse than none).

**Constraint.** `packages/domain` must never import `@calma/i18n`. Domain functions return keys and data, never rendered sentences.

---

## D-012 — The audio walkthrough is removed

**Decided.** The 90-second ElevenLabs voice track is cut. Onboarding is visual-first and silent.

**Why.** Voice is the single largest per-language cost in the product, and voice tone is the hardest thing to get right across languages — a slightly-off warm voice in a mental-health app reads as uncanny rather than comforting. A silent, visual sequence works in every locale for free.

**Supersedes.** The walkthrough sections of `systems/04-audio-and-haptics.md` and the original `plans/13`.

**Consequence.** The warmth the voice was carrying has to come from somewhere. It moves to the handwritten founder note (step 3) and to the first-breath moment (step 7). If those two land, the voice isn't missed; if they don't, this decision was wrong.

**Retained.** The original script's lines survive as on-screen copy — they were good, and they were written for exactly this purpose.

**Also removes.** The VO blocker, `walkthrough.m4a`, `walkthrough.json`, subtitle rendering, audio ducking for the walkthrough, and the subtitles preference.

---

## D-013 — No paywall and no social proof in onboarding

**Decided.** Nothing is sold before the person has felt the app work. No price, no plan, no "Plus", no user count, no testimonial anywhere in onboarding.

**Why.** The growth playbook recommends a one-time urgency offer during onboarding. Urgency is a manufactured stress response, and Calma exists to reduce stress responses. An app that opens by inducing the feeling it promises to relieve has told the user what it actually is in its first ninety seconds.

Social proof fails differently: "join 40,000 people managing their anxiety" contradicts "no accounts, no servers" — it implies we're counting.

**Consistent with.** The blueprint's own "No trial — free tier is the ongoing demonstration", and the tone guide's ban on urgency and scarcity.

**Cost.** Measurably lower onboarding-to-paid conversion than the playbook would produce. Accepted.

---

## D-014 — Onboarding always has a crisis escape

**Decided.** A persistent "I need this now" exit on every onboarding step, going straight to a panic session with nothing in between.

**Why.** A 12-step onboarding is a wall in front of someone having a panic attack. The App Store description promises help with "the panic that hits at 2am"; someone acting on that promise must not meet a quiz.

**Rules.** Every step has a working default, so an abandoned flow leaves a fully functional app. Onboarding is re-offered exactly once, later, gently. Declining is permanent.

**Consequence.** Onboarding is optimised for the calm arrival and abandoned instantly for the distressed one. This inverts standard growth logic deliberately.

---

## D-015 — Five tabs; journaling is a first-class destination

**Decided.** Navigation is Home · Breathe · **Write** · Worries · Progress.

**Why.** Journaling was reachable only as an offer after a high-distress breathing session. Someone who simply wants to write had no route, and the entry list had no home in the navigation at all — a genuine hole in the spec, surfaced by a competitor review asking for *"a quicker way to create journal entries without having to wade through the other elements"*.

The structural implication of the old design was also wrong: it framed writing as what you do when breathing didn't work. For some people writing is the primary tool.

**Retained.** The post-session journaling offer stays exactly as specced. It's a good moment. It's just no longer the only door.

**Cost.** A fifth tab, against a competitor review warning that arrival choice is overwhelming even in apps people like. Mitigated by Home offering one obvious next thing rather than five equal options.

---

## D-016 — Tier structure confirmed unchanged, with the risk recorded

**Decided.** Free keeps the current week; full history, trends, and search stay on Plus.

**Considered and rejected.** Making history free. A 5★ review of a category competitor praises exactly that, by name: *"This isn't like most journaling apps, where other functions are hidden behind a paywall. You're allowed to see how your mood has changed. You can go back and see what you've written."*

**The risk, stated plainly.** The free-tier experience of hitting a wall in front of *your own writing* is the specific thing that reviewer was relieved not to have. This is the most likely single cause of a bad review or weak retention on free tier.

**Trigger to revisit.** Any review mentioning it, or weak free-to-Plus conversion. This is the first lever to pull, before discounting or before adding features.

**Mitigation meanwhile.** `plans/11` T10 — a soft prompt, never blurred or teased content, and never any implication that the person's writing is being held hostage.

---

## D-010 — Typography: Figtree

**Decided.** Figtree via `@expo-google-fonts/figtree`, weights 400/500/600/700, bundled locally.

**Why.** Humanist and rounded without being childish. Nunito and Quicksand read too young for an adult mental-health tool; Inter and system sans read too neutral and clinical.

**Rules.** No font is fetched at runtime. Font loading gates the splash screen.

---

## D-017 — Two typefaces: Newsreader for feeling, Figtree for reading

**Decided.** **Supersedes D-010** ("Figtree everywhere").

The delivered designs use **Newsreader** (serif) for the sentences a person is
meant to feel — *"Breathe into it."*, *"Then this one isn't yours to carry."*,
*"You're still here. That's enough."* — and **Figtree** (sans) for everything they
only need to read: buttons, labels, hints, settings, counts, timestamps.

**Why this is better than the original decision.** D-010 chose one humanist sans
to avoid reading either childish or clinical. The split solves the same problem
more precisely: the serif carries warmth exactly where warmth is the point, and
the sans stays out of the way everywhere else. A single typeface had to compromise
between the two jobs.

**Consequence.** Dark mode needs two text colours to match — `#EAE2D7` warm cream
for serif, `#C9D2DA` cool grey for sans. Using the cool grey on an emotional line
makes it read clinical.

**Rules.** A serif button label or a sans emotional headline is a bug, not a style
choice. IBM Plex Mono appears in the design files as annotation and must never
ship. Both families are Google Fonts, bundled locally, never fetched at runtime.

---

## D-018 — The extracted designs are the visual source of truth

**Decided.** `designs/extracted/` outranks `systems/03-design-system.md` on
colour, type, spacing, and dimension. That document was written before the designs
existed and is superseded on appearance.

**It is not superseded on behaviour.** These survive any visual revision:
no red anywhere, no pure white or black, amber drops in intensity in dark mode,
nothing on the panic path, no progress indicators outside onboarding, nothing
truncates on user content.

**Why the split.** The designer was briefed from `plans/17-screens.md`, which
deliberately specified function and feeling but not layout. They then made the
visual calls — and the evidence they worked from the docs is that their orb
gradient matches the spec'd amber ramp almost exactly. Where they diverged
(backgrounds, the serif) they improved on it.

**Practical rule.** Before building a screen, open its extracted file and read the
designer's caption note. The note explains intent; the markup only shows result.

---

## D-019 — The handwritten founder note is cut

**Decided.** Onboarding step 3 (screen B3) is removed. Onboarding is eleven steps.

**Why.** The note only worked if it was real: scanned handwriting, the founder's
own words. A handwriting font is detectable, and a note that reads as a tactic
damages trust rather than building it — which is the opposite of what the screen
was for. It was also the last outstanding asset blocker on onboarding.

**Consequence.** Onboarding now has **no asset dependencies at all** and can be
built end to end today.

**Where the warmth goes.** The note was carrying the job the removed voice track
(D-012) used to do. That now rests entirely on the first breath (B7) and on the
copy. If onboarding starts to feel transactional, this is the cause — and the
fix is the copy, not a reinstated note.

**Screen IDs are NOT renumbered.** The designs use B1–B11; B3 is skipped and
B4–B11 keep their IDs, so every reference into `designs/extracted/` stays valid.
