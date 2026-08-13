# 13 — Onboarding

Eleven steps, visual-first, no voice track. The person breathes before it ends.

**Branch:** `feat/onboarding`
**Depends on:** 02, 03, 05, 06, 18
**Reference:** `systems/11-onboarding.md`, `plans/17-screens.md` § B, D-012, D-013, D-014

> **Changed from the original plan.** The 90-second ElevenLabs voice walkthrough is **removed** (D-012), and the handwritten founder note is **removed** (D-019). There are now **no outstanding asset dependencies for onboarding** — it can be built end to end today. The old script's lines survive as on-screen copy — see `systems/07-copy-and-tone.md`.
>
> Screen IDs are not renumbered: the designs use B1–B11 and B3 is simply skipped.

---

## Note (session 10) — five divergences, recorded before the code was written

**1. There are ten steps, not eleven.** T01 says "the eleven steps". The
eleventh in `systems/11-onboarding.md`'s table is *Home* — the app itself, not
a step of onboarding. With B3 cut (D-019) the machine holds ten: welcome,
language, why, when, helped, breath, howWasThat, reveal, notifications, name.
The design IDs are **not** renumbered.

**2. T06's language step is built but unreachable.** It depends on `18-i18n`
T13, and English ships alone. Rather than show a choice of one, or flash a
screen that auto-advances, `createOnboarding` drops the step entirely while
`LANGUAGES.length === 1`. The screen exists so that adding a second language is
a data change; it is unreachable, not unwritten. Two knowing pixel divergences
are commented in the file, to be settled against the design on the day it can
actually render.

**3. T12's notification step is built against a stub.** It depends on `12-
notifications` T02, which is not built and has no `expo-notifications`
dependency. `src/lib/notifications/permission.ts` returns `'unavailable'` —
true, and a case every caller must already handle because a real user can
decline. Plan 12 T02 replaces that function body and nothing else. The
pre-prompt, the real-notification preview, and the rule that a decline never
reaches the OS are all real today.

**4. T08's `applyAnswers` is in `packages/domain`, not `apps/native`.** The
plan puts it at `apps/native/src/features/onboarding/applyAnswers.ts` with a
test beside it. That test could not have run: `apps/native` had no test runner.
The mapping is pure, so it lives in `packages/domain/src/onboarding/answers.ts`
with `answers.test.ts` next to it, where the rest of the app's testable logic
already is. Home's lead tool is **derived on read** rather than stored, so
there is no new pref and no migration.

**5. T15's tests are split, and `apps/native` gained a test runner.** The flow,
skip and escape assertions are pure and live in
`packages/domain/src/onboarding/flow.test.ts`. The "no paywall, price, plan,
account prompt or review request" assertion is a claim about *every* code path,
so it reads the onboarding source as text rather than rendering it — that lives
at the plan's own path, `apps/native/src/features/onboarding/__tests__/`, and
`apps/native` now has a node-only `vitest` set up for it. It cannot live in
`packages/domain`, whose tsconfig sets `types: []` to keep the package
platform-free and therefore has no `node:fs`. The final clause of T15 — the
hand-walk on both platforms with VoiceOver, 200% font scale and Reduce Motion —
is untouched by any of this and still outstanding.

**Also found and fixed before this plan started, each in its own commit:**
`apps/native` had no `check-types` script, so `pnpm check-types` had never once
type-checked the app; and `Button variant="secondary"` used `bg-surface`, a
card colour, where every screen in the designs gives quiet buttons their own
warmer pair.

---

## T01 — Build the onboarding container and step machine

- [x] `c53e81f`
- **Commit:** `feat(onboarding): add onboarding container and step machine`
- **Touches:** `apps/native/src/app/onboarding.tsx`, `packages/domain/src/onboarding/machine.ts`, `machine.test.ts`
- **Done when:** the eleven steps advance and reverse as a pure, tested state machine; every step has a working default so an abandoned flow leaves a functional app; and the container presents full-screen with no tab bar.

---

## T02 — Add the crisis escape

- [x] `91cae7f`
- **Commit:** `feat(onboarding): add persistent crisis escape`
- **Depends on:** T01, `07-panic-button` T02
- **Touches:** `apps/native/src/features/onboarding/CrisisExit.tsx`
- **Done when:** an "I need this now" exit is present and legible on **every** onboarding step; it opens a panic session with nothing in between — no confirmation, no save prompt, no permission dialog; defaults are persisted so the person lands on a working Home afterwards; and a test asserts the exit is reachable from every step index.

---

## T03 — Add first-launch routing and completion tracking

- [x] `e53d93b`
- **Commit:** `feat(onboarding): route on first launch and track completion`
- **Depends on:** T01, `05-app-shell` T01
- **Touches:** `apps/native/src/lib/boot.ts`
- **Done when:** onboarding shows once on first launch; `prefs.onboardingCompletedAt` is set on completion **or** skip **or** crisis escape; it never reappears, including after an app update; and an escaped flow queues exactly one gentle re-offer for a later launch.

---

## T04 — Add quiet progress indication

- [x] `0fd0060`
- **Commit:** `feat(onboarding): add quiet progress indication`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/onboarding/Progress.tsx`
- **Done when:** the person can sense position without a percentage or a spoken step count; it never renders as a completion metric; and the deliberate exception to the app-wide no-progress-bars rule is noted in code.

---

## T05 — Build the welcome step

- [x] `ec3aecd`
- **Commit:** `feat(onboarding): build welcome step`
- **Depends on:** T01, `06-breathing-engine` T02
- **Touches:** `apps/native/src/features/onboarding/steps/Welcome.tsx`
- **Done when:** the orb is breathing within the first frame the person sees; the tagline is the only copy; **no feature list, no carousel, no dot pagination**; and the screen sells the outcome by showing it.

---

## T06 — Build the language step

- [x] `1855d7d`
- **Commit:** `feat(onboarding): build language selection step`
- **Depends on:** T01, `18-i18n` T13
- **Touches:** `apps/native/src/features/onboarding/steps/Language.tsx`
- **Done when:** the device-detected language is pre-selected and marked as the default; each language is listed in **its own language**; changing it applies immediately to the rest of onboarding; and the step auto-advances after a beat when only one language is supported, rather than presenting a pointless choice.

---

## T07 — Build the three personalisation steps

- [x] `4aa9f21`
- **Commit:** `feat(onboarding): build personalisation question steps`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/onboarding/steps/{WhatBringsYou,WhenHardest,WhatHelped}.tsx`
- **Done when:** all three are **multi-select**, none requires an answer, each is phrased conversationally rather than as a form label, and one question occupies each screen. No clinical vocabulary and no severity scoring anywhere.

---

## T08 — Wire answers to real defaults

- [x] `30b4108`
- **Commit:** `feat(onboarding): apply personalisation answers to preferences`
- **Depends on:** T07, `03-storage-layer` T06
- **Touches:** `apps/native/src/features/onboarding/applyAnswers.ts`, `applyAnswers.test.ts`
- **Done when:** the answer-to-effect mapping in `systems/11-onboarding.md` is implemented and tested — worry window time derives from step 4, Home's lead tool from step 5; conflicting multi-selects resolve deterministically; skipping every question produces sane defaults; and all of it remains editable in Settings.

---

## T09 — Build the first-breath step

- [x] `2be1285`
- **Commit:** `feat(onboarding): build first breath aha moment`
- **Depends on:** T01, `06-breathing-engine` T05, `04-audio-haptics` T08
- **Touches:** `apps/native/src/features/onboarding/steps/FirstBreath.tsx`
- **Done when:** three real physiological-sigh cycles run with haptics on; it is a **real session persisted via `BreathingRepo`**, not a demo; it is launched from an affordance matching the panic button's appearance and position so the gesture is learned by use; one short line teaches following the light; and it is skippable.

---

## T10 — Build the how-was-that step

- [x] `3ed87b1`
- **Commit:** `feat(onboarding): build post-breath check`
- **Depends on:** T09, `06-breathing-engine` T12
- **Touches:** `apps/native/src/features/onboarding/steps/HowWasThat.tsx`
- **Done when:** the three feeling faces render with equal weight, any answer is accepted without commentary, and "worse" is met with warmth rather than concern or escalation.

---

## T11 — Build the personalisation reveal

- [x] `3dac54b`
- **Commit:** `feat(onboarding): build personalisation reveal step`
- **Depends on:** T08, T10
- **Touches:** `apps/native/src/features/onboarding/steps/YourCalma.tsx`
- **Done when:** it states plainly what each answer changed — the worry window time, the tool on Home, the panic button — in specific sentences, not generic affirmations; it names the panic button in one line; a fully-skipped flow still produces an honest version of this screen; and **nothing here is a claim about outcomes**.

---

## T12 — Build the notification pre-prompt

- [x] `cbfd8ff`
- **Commit:** `feat(onboarding): build notification pre-prompt step`
- **Depends on:** T08, `12-notifications` T02
- **Touches:** `apps/native/src/features/onboarding/steps/Notifications.tsx`
- **Done when:** a realistic preview of the actual worry-window notification is shown **before** the OS dialog; it states that this is the only thing sent; declining skips the native prompt entirely so the permission is never spent; and the OS dialog is triggered only on an explicit yes.

---

## T13 — Build the name step

- [x] `cbbe789`
- **Commit:** `feat(onboarding): build optional name step`
- **Depends on:** T01, `03-storage-layer` T06
- **Touches:** `apps/native/src/features/onboarding/steps/Name.tsx`
- **Done when:** the field is optional with the on-device hint copy, skip is equal in weight to confirm, and every greeting in the app reads naturally with no name set.

---

## T14 — Add step transitions and motion

- [x] `f2a6bed`
- **Commit:** `feat(onboarding): add step transitions`
- **Depends on:** T05–T13, `02-design-system` T07
- **Touches:** `apps/native/src/features/onboarding/transitions.ts`
- **Done when:** transitions are breath-paced with no bounce or overshoot, collapse to cross-fades under Reduce Motion, and **contain no horizontal directional motion** — that would need revisiting the day RTL is added (`systems/10-i18n.md`).

---

## T15 — Verify the full flow on both platforms

- [x] `2965b3e`
- **Commit:** `test(onboarding): verify onboarding flow and escape paths`
- **Depends on:** T01–T14
- **Touches:** `apps/native/src/features/onboarding/__tests__/*`
- **Done when:** tests cover the complete flow, a fully-skipped flow, and a crisis escape from every step index; a test asserts **no paywall, price, plan, account prompt, or review request can render during onboarding**; the pseudo-locale from `18-i18n` T14 shows no truncation; and the whole flow is walked by hand on iOS and Android with VoiceOver on, at 200% font scale, and with Reduce Motion enabled.
