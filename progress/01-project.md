# What Calma Is

**Calma** — *Breathe into it.*
A pocket companion for anxiety. Fully local. No accounts, no servers, no network layer.

iOS and Android, built with Expo. English at launch, i18n infrastructure from day one.

---

## The five rules

These constrain everything. If a proposal violates one, the proposal is wrong.

1. **No network layer.** No servers, no accounts, no analytics, no crash reporting that ships user content. The only network traffic in the entire app is RevenueCat's purchase and receipt calls.
2. **No data leaves the device.** Worries, journal entries, and session records are written to encrypted local storage and nowhere else.
3. **No friction on the panic path.** One tap to breathing, from anywhere, with zero questions, zero paywall, zero permission prompt.
4. **No hard paywalls.** Every core relief tool is unlimited on free. Plus adds depth, never access to calm.
5. **Tone is a feature.** Warm, direct, never clinical, never saccharine. See `systems/07-copy-and-tone.md`.

---

## The features

| Feature | What it does | Free | Plus |
|---|---|---|---|
| **Panic button** | Floating, always present. One tap → 60-second physiological sigh. | Unlimited | Unlimited |
| **Paced breathing** | Orb + haptics. 4-7-8, 5-5-5-5, physiological sigh. | All 3 presets | + custom ratios |
| **Worry postponement** | Capture a worry, it disappears until a scheduled window, then guided triage: act on it or release it. | 3/day, 15-min window | Unlimited, 15/20/30 min |
| **Journaling** | Cognitive restructuring template. Its own tab. | 2 entries/week | Unlimited + search |
| **Progress** | Streak, weekly stats, trends. | Current week | Full history + trends |
| **Notifications** | Local only. Four in total. | Worry window reminder | + streak nudge, weekly check-in |

**Navigation:** Home · Breathe · Write · Worries · Progress — five tabs, plus a persistent panic button floating bottom-right on every one of them.

---

## The aha moment

> The first breath cycle where the haptic pulses in their hand and they realise the app is doing something to their **body**, not showing them a screen.

That's the whole product in about eight seconds. It's why onboarding step 7 of 12 is a real breathing session rather than a description of one.

---

## The stack

| Layer | Choice | Decision |
|---|---|---|
| Monorepo | Turborepo + pnpm workspaces | — |
| Native | Expo 57, RN 0.86, expo-router | — |
| Styling | uniwind (Tailwind for RN) + heroui-native | — |
| Animation | Reanimated 4 + react-native-svg | — |
| Storage | **MMKV, encrypted**, key in expo-secure-store | D-001 |
| Data access | Repository ports in `packages/db` — MMKV is one adapter | D-001 |
| State | Zustand + feature folders | D-004 |
| i18n | i18next + react-i18next + expo-localization | D-011 |
| Payments | RevenueCat, anonymous mode, from day one | D-002 |
| Audio | expo-audio — 7 sounds, **no speech anywhere** | D-012 |
| Web | Next 16 — **marketing site only** | D-005 |

---

## What makes this project unusual

**No backend at all.** There is nothing to deploy, no API, no schema migrations on a server. Every hard problem is on-device: encryption key custody, index maintenance without transactions, timezone-correct day boundaries.

**MMKV instead of SQLite** (D-001). Key-value, no query engine. History, trends, and search are hand-maintained indexes and in-memory filtering. This is why `packages/db` exposes repository *ports* — swapping to SQLite later changes one factory line, not every call site.

**Tone is enforced, not aspirational.** No exclamation marks anywhere in the product. No red. No error states. Automated checks in `plans/18` T10 fail CI on violations.

**The panic path is sacred.** No paywall, no permission prompt, no rating request, no SUDS slider, no journaling offer can ever appear on it. Asserted by test in `plans/07` T08.

---

## Decisions you should know before changing anything

Full log in `systems/09-decisions.md`. The ones most likely to trip you up:

- **D-006** — The panic button is bottom-right floating, not top. The original blueprint said top.
- **D-007** — SUDS is a 0–10 slider *before* a session, three emoji *after*. Never before a panic session.
- **D-008** — Missed worry windows carry over forever. No guilt language, ever. Nothing auto-deletes.
- **D-009** — Free limits reset on the local calendar day / ISO week, Monday start.
- **D-012** — The audio walkthrough was cut. There is no voice in this app at all.
- **D-013** — No paywall and no social proof in onboarding.
- **D-014** — Onboarding has a crisis escape on every step.
- **D-015** — Five tabs. Journaling is a first-class destination, not a post-session consolation.
- **D-016** — Tier structure confirmed as-is, with a recorded risk about paywalling history.

---

## Blueprint source

The original product blueprint (identity, tone guide, feature set, tier structure, audio design, microcopy, App Store copy, visual direction) has been fully absorbed into `systems/`. Nothing was dropped silently — where the blueprint was contradictory or wrong, `systems/09-decisions.md` records what changed and why.
