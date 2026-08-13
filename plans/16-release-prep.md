# 16 — Release Prep

Store assets, compliance, accessibility, and the device matrix.

**Branch:** `chore/release-prep`
**Depends on:** everything

---

## T01 — Configure app identity and build config

- [ ]
- **Commit:** `chore(build): configure app identity and eas build profiles`
- **Touches:** `apps/native/app.json`, `apps/native/eas.json`
- **Done when:** bundle identifiers, version, build number, and the display name "Calma" are set; EAS development, preview, and production profiles build successfully for both platforms.

---

## T02 — Add the app icon and splash screen

- [ ]
- **Commit:** `chore(build): add app icon and splash screen`
- **Depends on:** T01 · **Blocked on:** artwork
- **Touches:** `apps/native/assets/images/*`, `app.json`
- **Done when:** icons render correctly at every required size on both platforms including the Android adaptive icon, and the splash uses `sand.100` in light and `navy.900` in dark so launch never flashes white.

---

## T03 — Audit permissions and capabilities

- [ ]
- **Commit:** `chore(build): audit and minimise permissions`
- **Depends on:** T01
- **Touches:** `app.json`, generated `Info.plist` and `AndroidManifest.xml`
- **Done when:** only notification and vibration permissions are declared; **no INTERNET-dependent capability beyond what RevenueCat requires**; and the generated manifests are inspected by hand to confirm no analytics or tracking SDK crept in transitively.

---

## T04 — Complete privacy declarations

- [ ]
- **Commit:** `docs(release): complete app store privacy declarations`
- **Depends on:** T03, `15-web-marketing` T03
- **Touches:** store console, `plans/16` notes
- **Done when:** Apple's Privacy Nutrition Label and Google's Data Safety form both declare no data collected and no data shared, RevenueCat's purchase data is correctly disclosed, and both link to the live privacy policy URL.

---

## T05 — Prepare store listings

- [ ]
- **Commit:** `docs(release): prepare store listing copy and screenshots`
- **Depends on:** T02
- **Touches:** store console, `apps/native/store/*`
- **Done when:** the name, subtitle, and description from `systems/07-copy-and-tone.md` are in place including the self-help disclaimer; screenshots are captured on required device sizes using **seeded fake data only, never real content**; and the health category and age rating are set appropriately.

---

## T06 — Run the accessibility audit

- [ ]
- **Commit:** `test(release): complete accessibility audit`
- **Done when:** every screen is traversed with VoiceOver and TalkBack; a full breathing session, worry capture, and triage are each completed with the screen off using haptics alone; every screen is checked at 200% font scale; and all contrast pairs pass in both themes.

---

## T07 — Run the tone audit

- [ ]
- **Commit:** `docs(release): complete copy and tone audit`
- **Done when:** every string in `packages/i18n/src/locales/en/` is reviewed against `systems/07-copy-and-tone.md`; the automated check from `18-i18n` T10 passes (zero exclamation marks, zero all-caps); a grep confirms no "error"/"failed"/"invalid" in user-facing copy; every microcopy line from the blueprint appears verbatim where specified; and no raw translation key renders anywhere in the app.

---

## T08 — Complete the device test matrix

- [ ]
- **Commit:** `test(release): complete device verification matrix`
- **Depends on:** T01–T07
- **Touches:** `plans/16-release-prep.md` results table
- **Done when:** the matrix below is fully passed on at least one recent iPhone, one small-screen iPhone (SE class), one Pixel, and one mid-range Samsung.

### Matrix

| Scenario | Why it matters |
|---|---|
| Cold boot → panic in under 3 seconds | The whole product promise |
| Full session with the screen off, haptics only | Stated design goal |
| Airplane mode throughout | There is no network layer; nothing may degrade |
| Cached Plus user, offline for a week | Must not be downgraded |
| Force-quit mid-breathing session | Must not resume awkwardly or accuse the user |
| Force-quit mid-worry-window | Must resume at the correct worry |
| Timezone change and DST shift | Window and notification correctness |
| Silent switch on | Sounds suppressed, haptics still working |
| Battery saver on (Android) | Haptics may be disabled; orb must remain sufficient |
| Reduce Motion on | Breathing guidance still fully usable |
| 200% font scale | No truncation or overlap anywhere |
| Notification permission denied | Every feature still reachable manually |
| Erase everything, then relaunch | Clean first-launch state |
| Crisis escape from every onboarding step | The one non-negotiable in onboarding (D-014) |
| Onboarding fully skipped | App must be completely functional with defaults |
| Device language changed while backgrounded | Locale re-resolves on foreground |
| Pseudo-locale at 200% font scale | No truncation, overlap, or raw keys |
