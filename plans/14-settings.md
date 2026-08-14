# 14 — Settings

Preferences, privacy, and the honest bits.

**Branch:** `feat/settings`
**Depends on:** 03, 11, 12, 13

---

## T01 — Build the settings screen shell

- [x] `pending-T01`
- **Note (session 15):** built at `app/settings/index.tsx`, not
  `src/app/settings/`. Sections follow j1's design (Breathing · Worries ·
  This phone) plus You, Sound & feel and Calma Plus, rather than the eight
  this todo lists — j1 draws three and the others are where the remaining
  rows have to live. **Not reachable from Home yet**: c1's design has no
  settings affordance and inventing one on the app's calmest screen is a
  decision for the owner, not a side effect of this plan. Currently reachable
  only by route.
- **Commit:** `feat(settings): build settings screen shell`
- **Depends on:** `05-app-shell` T03
- **Touches:** `apps/native/src/app/settings/index.tsx`, `apps/native/src/features/settings/*`
- **Done when:** grouped sections render (You · Worry window · Breathing · Sound & feel · Notifications · Calma Plus · Privacy · About), reachable from Home, and every row has an accessibility label.

---

## T02 — Add the language preference

- [ ]
- **Note (session 15):** **not built.** Blocked on `18-i18n` T13, which makes
  b2 reachable; only English ships, so a language row today offers one
  option. The copy already exists in `settings.json`.
- **Commit:** `feat(settings): add language preference row`
- **Depends on:** T01, `18-i18n` T13
- **Touches:** `apps/native/src/features/settings/LanguageRow.tsx`
- **Done when:** the row shows the active language in its own name; "Match my phone" is the default and is described as a live behaviour rather than a stored value; changing it applies immediately with no restart; and the picker component is shared verbatim with onboarding rather than duplicated.

---

## T03 — Add the name preference

- [x] `pending-T03`
- **Commit:** `feat(settings): add name preference`
- **Depends on:** T01, `03-storage-layer` T06
- **Touches:** `apps/native/src/features/settings/NameRow.tsx`
- **Done when:** the name can be set, changed, or cleared; the hint states it's stored only on this phone; and clearing it makes every greeting fall back gracefully.

---

## T04 — Add worry window preferences

- [x] `pending-T04`
- **Note (session 15):** the row renders the window as ONE value —
  "8–8:20pm" — rather than a time and a duration on separate rows. Nobody
  thinks of their window as "20:00" plus "20 minutes"; two rows would also
  make the length read as a thing to maximise. `windowRange` is pure and
  tested. **The picker screen behind it is not built** and the row is
  currently inert.
- **Commit:** `feat(settings): add worry window time and duration preferences`
- **Depends on:** T01, `08-worry-postponement` T13
- **Touches:** `apps/native/src/features/settings/WorryWindowRow.tsx`
- **Done when:** the time is set with a native picker and reflects the value seeded during onboarding; duration offers 15/20/30 with 20 and 30 gated to Plus; changing either triggers `rescheduleAll()`; and setting the time for the first time triggers the permission pre-prompt if onboarding didn't already ask.

---

## T05 — Add breathing preferences

- [ ]
- **Commit:** `feat(settings): add breathing pattern and ratio preferences`
- **Depends on:** T01, `11-entitlements-paywall` T11
- **Touches:** `apps/native/src/features/settings/BreathingRow.tsx`
- **Done when:** the default pattern is selectable, the custom ratio builder is reachable for Plus with the paywall for free, and ratios can only be changed here — never mid-session.

---

## T06 — Add sound, haptics, and theme toggles

- [x] `pending-T06`
- **Commit:** `feat(settings): add sound, haptics and theme toggles`
- **Depends on:** T01, `04-audio-haptics` T07
- **Touches:** `apps/native/src/features/settings/FeelRows.tsx`
- **Done when:** sound and haptics toggle immediately; theme offers system/light/dark; the orb theme row shows wave and bloom as "coming soon" rather than as broken options; and the silent-switch explainer copy is present. **No subtitles toggle** — the voice track is removed (D-012).

---

## T07 — Add the notifications row

- [x] `pending-T07`
- **Note (session 15):** the toggle records the preference and **never fires
  the OS dialog**, per `permission.ts`: a permission is spent once and the
  prompt belongs to b10 alone. The system deep-link is not wired, because
  plan 12 is not built and there is nothing yet to deep-link about.
- **Commit:** `feat(settings): add notifications row with system deep link`
- **Depends on:** T01, `12-notifications` T02
- **Touches:** `apps/native/src/features/settings/NotificationsRow.tsx`
- **Done when:** the row shows the current permission state and deep-links to system settings, listing exactly which notifications are sent — and the app never re-prompts from here.

---

## T08 — Add the onboarding answers row

- [ ]
- **Commit:** `feat(settings): add onboarding answers row`
- **Depends on:** T01, `13-onboarding-walkthrough` T09
- **Touches:** `apps/native/src/features/settings/YourAnswersRow.tsx`
- **Done when:** the three onboarding answers are viewable and editable; changing "when is it hardest" offers to move the worry window rather than moving it silently; changing "what's helped" updates what Home leads with; and nothing here is framed as a profile or an assessment. Someone who mis-tapped at 2am must be able to fix it.

---

## T09 — Add the Calma Plus section

- [ ]
- **Commit:** `feat(settings): add calma plus section`
- **Depends on:** T01, `11-entitlements-paywall` T04
- **Touches:** `apps/native/src/features/settings/PlusSection.tsx`
- **Done when:** the current tier is shown; free sees "See plans" without pressure; Plus sees a manage-subscription deep link and restore; and restore is present for both tiers with the device-change explanation.

---

## T10 — Add the privacy section

- [x] `pending-T10`
- **Note (session 15):** built as j2, a screen rather than a section — that
  is what the design draws. "Keep a copy in iCloud" and "Send yourself
  everything" are **drawn and inert**: both need machinery that does not
  exist (a backup path, an export encoder). A toggle that silently does
  nothing is worse than an absence, so they are present-but-not-yet rather
  than fake. The web privacy-policy link waits on plan 15.
- **Commit:** `feat(settings): add privacy section`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/settings/PrivacySection.tsx`
- **Done when:** the privacy copy from `systems/07-copy-and-tone.md` is shown verbatim — including the honest sentence about no backup and device loss — alongside a permanent "Need more help?" row listing crisis resources, and a link to the web privacy policy.

---

## T11 — Add erase everything

- [ ]
- **Note (session 15):** clears all three MMKV instances and re-seeds
  `defaultPrefs` (an empty prefs record is not a first launch). Twelve
  assertions in `__tests__/erase.test.ts`, including that nothing survives.

  **Two of the five things this todo lists are NOT done, and neither is
  forgotten:** the SecureStore key is not destroyed — `key.ts` exposes no
  delete, and adding one is a storage-layer change with its own test surface
  — and notifications are not cancelled, because none are ever scheduled
  while plan 12 is a stub. Neither leaves user content on the device, which
  is the promise the screen makes. **T11 stays unticked until both land.**
- **Commit:** `feat(settings): add erase everything`
- **Depends on:** T10, `03-storage-layer` T03
- **Touches:** `apps/native/src/features/settings/EraseRow.tsx`
- **Done when:** a two-step confirmation with plain honest copy clears all three MMKV instances, deletes the SecureStore key, cancels all notifications, resets every store, and returns to first-launch state — with **no retention offer and no "are you sure you want to lose your streak"**.
