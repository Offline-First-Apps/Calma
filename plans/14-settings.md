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
  rows have to live. **Note (session 16):** now reachable from Home. c1 draws no
  affordance, so `SettingsButton` is invented — 24px of drawn rules in a 44px
  target, top-right, in `muted`, displacing nothing. Not a cog. This todo's
  "Done when" asked for it, so the placement is the plan's; the drawing is
  session 16's and is reversible in one file.
- **Commit:** `feat(settings): build settings screen shell`
- **Depends on:** `05-app-shell` T03
- **Touches:** `apps/native/src/app/settings/index.tsx`, `apps/native/src/features/settings/*`
- **Done when:** grouped sections render (You · Worry window · Breathing · Sound & feel · Notifications · Calma Plus · Privacy · About), reachable from Home, and every row has an accessibility label.

---

## T02 — Add the language preference

- [x] `ad4c617`
- **Note (session 15):** **not built.** Blocked on `18-i18n` T13, which makes
  b2 reachable; only English ships, so a language row today offers one
  option. The copy already exists in `settings.json`.
- **Note (session 19):** built, along with `18-i18n` T13, and **the row is
  conditional rather than absent**. `offersLanguageChoice(LANGUAGES)` is pure
  and false today: with English alone, "Match my phone" and "English" both
  resolve to English, so the row would be a question with two identical
  answers — which is exactly the kind of row the owner's standing instruction
  removes. The condition reads the registry, so the row appears by itself the
  day a locale folder lands, which is what `supported.ts` promises ("never a
  code change anywhere else").

  **`LanguagePicker.tsx` is shared with no variant prop between the two call
  sites.** Not a `showSystem` flag, not a `compact` mode — onboarding's b2 and
  `/settings/language` render the identical component. Two copies of a list of
  languages drift the first time one is added, and they drift silently.

  **"Match my phone" stores the `'system'` sentinel and names what it resolves
  to.** b2 badges the detected language instead; the sentinel is the honest
  version of that badge, because it keeps following the phone rather than
  snapshotting one answer. Recorded as a knowing divergence in `Language.tsx`.

  Changing applies immediately via `applyLocale`, and prefs are written *after*
  the language changes so a locale that fails to load cannot leave prefs
  claiming one the app is not showing.
- **Commit:** `feat(settings): add language preference row`
- **Depends on:** T01, `18-i18n` T13
- **Touches:** `apps/native/src/features/settings/LanguageRow.tsx`
- **Done when:** the row shows the active language in its own name; "Match my phone" is the default and is described as a live behaviour rather than a stored value; changing it applies immediately with no restart; and the picker component is shared verbatim with onboarding rather than duplicated.

---

## T03 — Add the name preference

- [x] `25de1ad`
- **Note (session 19): the screen behind the row is built** at
  `/settings/name`, and the row is restored. Clearing is a full-size pill
  directly beneath Done — b11's "identical target, no pitch about
  personalising" applied to the edit. Empty stays `null` rather than `''`,
  because every greeting branches on the null and an empty string would pass a
  truthiness check and render "You're here, ." at somebody.
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
- **Note (session 19): the picker is built** at `/settings/window`, and the row
  points at it again.

  **DIVERGENCE, and the plan is wrong rather than the code.** This todo says
  "set with a native picker". That means
  `@react-native-community/datetimepicker` — a native module, so a prebuild,
  drawing a platform wheel in the platform's own type and colours in the middle
  of an app whose whole argument is that it does not look like a platform. The
  screen uses d7's steppers instead: whole values, every one reachable in an
  exact number of taps, no dependency, and vocabulary the app already has.

  **The time wraps at midnight rather than clamping.** Somebody whose worst
  hour is 1am gets there by pressing down from midnight, and a stepper that
  stopped would be saying their window is not a real option. `stepWindowTime`
  reuses `addMinutes` from `windowRange.ts`, so the row that displays the
  window and the screen that sets it cannot disagree about midnight.

  **Nothing calls `rescheduleAll()` and nothing needs to.** `useReschedule` is
  mounted at the root with window time and duration in its dependency array, so
  the write itself rebuilds the schedule. That was the point of building it as
  one dependency array rather than seven call sites; this screen was the
  seventh.

  **The permission pre-prompt clause is deliberately not honoured.** T07's
  session-15 note already settled it: a permission is spent once and the prompt
  belongs to b10 alone. Two todos asking for the same prompt is how an app ends
  up asking twice.

  **20 and 30 wear no badge and no padlock.** `mayUseDuration` carries the same
  `suppressed` clause as the custom rhythm — on a build where nothing can be
  bought, every length is available, because a block nobody can pay past is not
  a paywall.

  No design file exists for this screen; j1-j4 are the whole set.
- **Commit:** `feat(settings): add worry window time and duration preferences`
- **Depends on:** T01, `08-worry-postponement` T13
- **Touches:** `apps/native/src/features/settings/WorryWindowRow.tsx`
- **Done when:** the time is set with a native picker and reflects the value seeded during onboarding; duration offers 15/20/30 with 20 and 30 gated to Plus; changing either triggers `rescheduleAll()`; and setting the time for the first time triggers the permission pre-prompt if onboarding didn't already ask.

---

## T05 — Add breathing preferences

- [x] `5e297e9`
- **Note (session 19):** built as `BreathingScreen.tsx` at `/settings/breathing`,
  which is where j1's "Your usual rhythm · The sigh" row now points. The row
  had been removed in session 18 because its destination did not exist.

  **The preference is new: `prefs.defaultPattern`.** There was nowhere to store
  a usual rhythm, so this todo could not have been done without one. It is
  `.default('physiological-sigh')` in the zod schema rather than a bare enum,
  because `createPrefsRepo` treats a whole-schema parse failure as corruption —
  a required field would have recorded a false corruption on every existing
  device's first launch of this build.

  **It changes exactly one thing: what Home offers.** Not the panic path, which
  is the sigh always and reads this never (rule 3); not d1, which lists four
  siblings and always will. `resolveUsualPattern` is pure and resolves the one
  state that would crash Home — a stored `'custom'` whose ratio has since been
  erased, where `getPattern` throws.

  **Home keeps c1's exact copy for everyone who has not changed it.** The other
  three share "Start your usual rhythm" rather than being named in the button,
  because a pattern name would have to be capitalised mid-sentence in every
  locale. The line underneath already named the breath and now follows it.

  **The paywall clause is the gate at "Use this one"**, which is precisely where
  `plans/11` T11's note said it belonged. `mayUseCustomRatio` is pure and has
  one clause that matters: `suppressed` returns **true**. A build with no
  RevenueCat key cannot sell anything, so refusing there would be a hard block
  with nothing on the other side of it. Saving a ratio now also sets it as the
  usual rhythm — choosing a rhythm is choosing it, and making someone visit
  Settings afterwards would be two steps for one decision.

  Haptics moved from "Sound & feel" into "Breathing", which is where j1 draws
  it. The buzz is the thing you follow with your eyes closed; it was never a
  preference about sound.
- **Commit:** `feat(settings): add breathing pattern and ratio preferences`
- **Depends on:** T01, `11-entitlements-paywall` T11
- **Touches:** `apps/native/src/features/settings/BreathingRow.tsx`
- **Done when:** the default pattern is selectable, the custom ratio builder is reachable for Plus with the paywall for free, and ratios can only be changed here — never mid-session.

---

## T06 — Add sound, haptics, and theme toggles

- [x] `pending-T06` — sound, haptics and the lock. Theme is not built.
- **Note (session 16):** the **lock** half is done: `lockEnabled` in prefs
  (off by default), a j1 row, `expo-local-authentication`, and `LockGate` on
  the Write tab, which is what finally gives k4 a trigger.

  **The scope is enforced, not promised.** `lock.ts` holds an allowlist and
  `lock.test.ts` asserts `/panic`, `/session/*`, `/(tabs)/breathe` and
  `/settings/crisis` stay reachable while locked. Rule 3 is the whole reason
  this feature is dangerous; an unavailable authenticator means no lock rather
  than an impassable one.

  Theme (system/light/dark) and the orb-theme row are **not built** — the
  appearance row exists and its picker screen does not.
- **Note (session 19): the theme half is done, and the row is back.**
  `AppearanceScreen.tsx` at `/settings/appearance`, which is the screen the
  owner asked for by name.

  **The important half is `useThemePreference`, mounted at the root.**
  `AppThemeProvider` wrapped `Uniwind.setTheme` and had never read a
  preference, so a theme chosen here would have survived exactly until the next
  launch and then reverted. A setting that appears to work is worse than one
  that is absent. It applies on every change to `prefs.theme`, including the
  one hydration makes at boot.

  **`'system'` is stored and passed through, never resolved.** Uniwind takes the
  sentinel and tracks the OS itself, so "match my phone" keeps following the
  phone — the same decision `prefs.locale` makes, for the same reason.

  **Wave and bloom are listed and unselectable.** `isOrbThemeAvailable` enforces
  it, so an unbuilt theme cannot become selectable because somebody forgot to
  disable a row. Their second line says "Not here yet" — no padlock and no
  grey, because this is unfinished work rather than a tier.
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

- [x] `ebb2e19`
- **Note (session 19):** built as `AnswersScreen.tsx` at `/settings/answers`,
  and the j1 row that pointed there is restored.

  **The cards are `OptionCard`, the same component b4-b6 use**, so "every option
  is identical in weight" stays one rule in one place rather than two.

  **"When is it hardest" is the only answer with a consequence, and it asks.**
  `suggestedWindowMove` is pure: it returns the window a new answer would seed,
  or `null`. Two cases return `null` — the seeded window is already theirs, and
  the question has been cleared. The second matters: `worryWindowFor([])`
  returns 19:00, and offering it because somebody *removed* an answer would be
  the app inventing an opinion out of an absence.

  Onboarding may seed the window silently because at that moment there is
  nothing to overwrite. Six weeks in there is, and a tap on a card is not
  consent to move it. The answer saves immediately either way; only the window
  waits for a yes.

  **"What's helped" needs no offer at all** — `leadToolFor` derives Home's lead
  from the stored answer on every read, so editing it here is already the whole
  mechanism.

  Nothing is scored, summarised, or reported as incomplete, and clearing every
  answer is a state the app works fine in (D-014).
- **Commit:** `feat(settings): add onboarding answers row`
- **Depends on:** T01, `13-onboarding-walkthrough` T09
- **Touches:** `apps/native/src/features/settings/YourAnswersRow.tsx`
- **Done when:** the three onboarding answers are viewable and editable; changing "when is it hardest" offers to move the worry window rather than moving it silently; changing "what's helped" updates what Home leads with; and nothing here is framed as a profile or an assessment. Someone who mis-tapped at 2am must be able to fix it.

---

## T09 — Add the Calma Plus section

- [x] `e4c1bc8`
- **Note (session 19):** built as `PlusSection.tsx`, replacing the bare
  "See plans" row. `plusSectionState` is pure and has three answers, one of
  which is **`hidden`**: on a build where nothing can be purchased the section
  is absent rather than disabled, which is what systems/05 means by "no prices
  and no paywalls at all". It stays hidden for a cached Plus user on such a
  build too — the tier survives a key-less build and neither manage nor restore
  can work there.

  **Free reads "Free", never "Not active" and never "Upgrade".** It is the
  honest name of what someone has, and in this app it is most of the product.

  **No price appears in Settings.** Prices live on i1 behind a deliberate tap;
  a number here would put a commercial thing in front of somebody who came to
  adjust their haptics, which is the exact failure `paywallGate.ts` exists
  because of.

  **Restore is on both tiers and runs in place.** Both, because the person who
  needs it has a tier that currently reads free — a new phone, a reinstall.
  In place, because it is a request with an answer rather than a destination,
  and the answer is one line in the same ink as everything else. `null` (SDK
  unreachable) and `'free'` (nothing to restore) give the same sentence: neither
  is a problem the person caused.

  This also closes the Settings half of `plans/11` T04, including its
  device-change sentence.
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

- [x] `pending-T11`
- **Note (session 15):** clears all three MMKV instances and re-seeds
  `defaultPrefs` (an empty prefs record is not a first launch). Twelve
  assertions in `__tests__/erase.test.ts`, including that nothing survives.

  **Note (session 16): both remaining clauses are done, and session 15's
  reason for skipping them was wrong.** `destroyEncryptionKey` was already in
  `key.ts`, written alongside the key and never called — "exposes no delete"
  was a guess, and reading the file would have cost less than the note did.
  It also had a bug: the delete used a different keychain accessibility
  constant from the write, which on iOS can leave the item in place.

  Order is asserted: cancel, clear, then the key. `cancelAllNotifications` is
  an honest stub until plan 12 lands, and no call site will change when it
  does. Four new assertions cover the ordering and both failure paths.
- **Commit:** `feat(settings): add erase everything`
- **Depends on:** T10, `03-storage-layer` T03
- **Touches:** `apps/native/src/features/settings/EraseRow.tsx`
- **Done when:** a two-step confirmation with plain honest copy clears all three MMKV instances, deletes the SecureStore key, cancels all notifications, resets every store, and returns to first-launch state — with **no retention offer and no "are you sure you want to lose your streak"**.
