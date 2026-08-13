# Calma — Systems Index

**Calma** — *Breathe into it.*
A fully local, no-account anxiety companion. iOS + Android, React Native (Expo).

These `systems/` docs describe **how Calma works**. The `plans/` docs describe **what we build next, in what order**.

- `systems/` = durable reference. Updated when a decision changes.
- `plans/` = ordered, checkable todos. Each todo is exactly one commit.

Both folders are gitignored — they are working notes, not shipped artifacts.

---

## Documents

| File | Covers |
|---|---|
| `01-architecture.md` | Monorepo layout, package boundaries, app shell, navigation, state |
| `02-data-layer.md` | Repository ports, MMKV adapter, encryption, schema, indexes, migrations |
| `03-design-system.md` | Colour, typography, spacing, motion, the orb, dark mode, accessibility |
| `04-audio-and-haptics.md` | Sound manifest, playback rules, haptic vocabulary, silent-switch policy |
| `05-entitlements.md` | Free/Plus tiers, limit accounting, RevenueCat integration, paywall UX |
| `06-notifications.md` | Local notification catalogue, scheduling, permission flow |
| `07-copy-and-tone.md` | Tone rules, the full microcopy registry, i18n approach |
| `08-git-workflow.md` | Commit-per-todo convention, message format, plan-file bookkeeping |
| `09-decisions.md` | Decision log — what was chosen, why, and what it rules out |
| `10-i18n.md` | i18next setup, locale resolution, plural rules, key conventions, RTL posture |
| `11-onboarding.md` | The twelve-step flow, the aha moment, and the crisis escape |

---

## Non-negotiables

These constrain every decision below. If a proposal violates one, the proposal is wrong.

1. **No network layer.** No servers, no accounts, no analytics, no crash reporting that ships user content. The only network calls in the entire app are RevenueCat's purchase/receipt traffic.
2. **No data leaves the device.** Worries, journal entries, and session records are written to encrypted local storage and nowhere else.
3. **No friction on the panic path.** The panic button reaches breathing in one tap, from anywhere, with zero questions, zero paywall, zero permission prompt.
4. **No hard paywalls.** Every core relief tool is unlimited on free. Plus adds depth, never access to calm.
5. **Tone is a feature.** Warm, direct, never clinical, never saccharine. See `07-copy-and-tone.md`.

---

## Reading order for a new contributor

`00-index.md` → `09-decisions.md` → `01-architecture.md` → `02-data-layer.md` → then whichever feature plan you're picking up.
