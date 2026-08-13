# Calma V1 — Roadmap

Build order. Each file is one feature; each todo inside it is one commit (`systems/08-git-workflow.md`).

**Total: 17 plan files, 189 todos**, plus two design briefs that are not todo lists: `17-screens.md` (every screen's function and feeling) and `19-review-findings.md` (changes derived from competitor reviews).

---

## Order and rationale

| Order | Plan | Todos | Why here |
|---|---|---|---|
| 1 | `01-foundation.md` | 9 | Package skeleton and boundaries. Everything imports this. |
| 2 | `02-design-system.md` | 9 | Tokens and primitives. Every screen needs them. |
| 3 | `18-i18n.md` | 14 | **Sequenced third on purpose.** Every feature after this writes its strings into locale files from day one, so nothing needs retrofitting. |
| 4 | `03-storage-layer.md` | 13 | Repositories. Every feature writes through them. |
| 5 | `04-audio-haptics.md` | 9 | Shared services. Breathing depends on haptics. |
| 6 | `05-app-shell.md` | 9 | Navigation, boot gate, panic FAB placement. |
| 7 | `06-breathing-engine.md` | 14 | The core. Panic and sigh are entry points into it. |
| 8 | `07-panic-button.md` | 8 | Thin layer over the engine, but its own UX contract. |
| 9 | `08-worry-postponement.md` | 17 | Largest feature. Capture + window + triage. |
| 10 | `09-journaling.md` | 14 | Its own tab (D-015), plus the post-session trigger. |
| 11 | `10-progress-dashboard.md` | 10 | Needs data from the breathing, worry, and journal features to be meaningful. |
| 12 | `11-entitlements-paywall.md` | 13 | Gates are added to features that already exist. |
| 13 | `12-notifications.md` | 9 | Needs the worry window and streak to exist. |
| 14 | `13-onboarding-walkthrough.md` | 16 | Describes and demonstrates the finished app, so it comes late. |
| 15 | `14-settings.md` | 11 | Aggregates preferences from every other feature. |
| 16 | `15-web-marketing.md` | 6 | Independent; can run in parallel any time. |
| 17 | `16-release-prep.md` | 8 | Store assets, privacy, accessibility, device matrix. |

File numbers are names, not order. `18-i18n.md` is built third.

---

## Critical path

```
01 ──▶ 02 ──▶ 18 ──▶ 05 ──┐
  └──▶ 03 ────────────────┼──▶ 06 ──▶ 07
         └──▶ 04 ─────────┘     │
                                ├──▶ 09 ──┐
                                │         ├──▶ 10 ──▶ 11 ──▶ 12 ──▶ 13 ──▶ 14 ──▶ 16
                     03 ──▶ 08 ─┴─────────┘
```

`15-web-marketing.md` is off the critical path entirely.

---

## Sequencing rules

**i18n comes before any feature work.** Retrofitting internationalisation is one of the most expensive refactors a mature app can undergo — it touches every component. Doing it third costs one plan file. English is the only locale that ships (D-011).

**Entitlement gating comes late, deliberately.** Features 06–10 are built without tier checks. Adding gates to working features is straightforward; building features around gates that don't exist yet produces tangled conditionals. The one exception: the `useLimit()` hook signature is defined in 01 so call sites don't need rewriting.

**Audio assets are delivered.** All seven `.mp3` files are in `assets/audio/`. Plan 04 T02 renames and converts them — including verifying `panic.m4a` by ear, since it was assigned by elimination.

**There is no voice track.** The ElevenLabs walkthrough was cut (D-012). Onboarding is visual-first and silent, which is also why all seven sounds are language-neutral.

**RevenueCat store setup is a prerequisite, not a todo.** Products must exist in App Store Connect and Play Console before plan 11 starts. Flagged as a blocker at the top of that file.

---

## Known blockers

| Blocker | Blocks | Owner |
|---|---|---|
| Verify `panic.m4a` is actually the wooden drum | 04 T02 | you |
| Apple Developer + Google Play accounts | 11, 16 | you |
| RevenueCat project + products configured | 11 | you |
| Founder note text + hand-drawn artwork | 13 T07 | you |
| App icon + splash artwork | 16 | you |
| Privacy policy URL live | 15, 16 | 15 produces it |

*Resolved since the last revision:* the seven SFX are delivered, and the walkthrough VO blocker no longer exists.

---

## Deferred to backlog

From the blueprint's own backlog, plus items deferred during planning:

- Dot-probe attention bias modification
- Values card sort + goal linking
- Non-improvement detection
- Wave and bloom orb themes *(tokens and the Prefs field ship in V1; rendering does not)*
- Weekly audio reflection check-in
- Sleep wind-down guided audio
- Data export / backup *(D-001 makes this the most likely first backlog item — device loss means data loss)*
- Cross-device sync
- **Additional languages** *(infrastructure ships in V1; only translation and QA remain — see `systems/10-i18n.md`)*
- **RTL support** *(deliberately not partially implemented; half-mirrored is worse than unmirrored)*
- SQLite adapter *(triggered by the thresholds in D-001)*

---

## Progress

- [ ] 01 Foundation
- [ ] 02 Design system
- [ ] 18 Internationalisation
- [ ] 03 Storage layer
- [ ] 04 Audio & haptics
- [ ] 05 App shell
- [ ] 06 Breathing engine
- [ ] 07 Panic button
- [ ] 08 Worry postponement
- [ ] 09 Journaling
- [ ] 10 Progress dashboard
- [ ] 11 Entitlements & paywall
- [ ] 12 Notifications
- [ ] 13 Onboarding
- [ ] 14 Settings
- [ ] 15 Web marketing
- [ ] 16 Release prep
