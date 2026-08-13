# 06 — Breathing Engine

The core of the app. Panic and the physiological sigh are entry points into this engine, not separate systems.

**Branch:** `feat/breathing-engine`
**Depends on:** 02, 03, 04, 05
**Reference:** `systems/03-design-system.md` (the orb), `systems/04-audio-and-haptics.md`, D-007

---

## T01 — Build the phase state machine

- [x] `bfbca39`
- **Commit:** `feat(breathe): add breathing phase state machine`
- **Touches:** `packages/domain/src/breathing.machine.ts`, `breathing.machine.test.ts`
- **Done when:** the machine advances inhale → holdFull → exhale → holdEmpty per pattern, skips zero-length phases, counts cycles, and is fully tested as a pure function with no timers.
- **Note (session 6):** the path was `packages/domain/src/breathing/machine.ts`,
  which cannot coexist with the `breathing.ts` that plan 01 T06 created and that
  T05 below also names. Flattened to `breathing.machine.ts`. The patterns
  themselves, `cycleDuration` and `cyclesForDuration` already exist in
  `breathing.ts`; the machine consumes them and defines no phases of its own.
  Note also that presets carry no zero-length phases — an absent hold is
  omitted rather than stored as `0` — so "skips zero-length phases" only bites
  for custom ratios, which validation already keeps at 1s or more.

---

## T02 — Build the orb: core and halo

- [x] `485559b`
- **Commit:** `feat(breathe): add orb core and halo rendering`
- **Depends on:** `02-design-system` T03
- **Touches:** `apps/native/src/features/breathing/Orb.tsx`
- **Done when:** an SVG radial-gradient core renders with a 35% halo at 1.35× radius, edges read as soft and blurred rather than hard-edged, and it looks right in both themes.

- **Note (session 9):** built to the design's structure (halo, body, offset
  highlight) with the soft edge made from gradient stops fading to zero alpha
  well inside each radius, NOT a blur. react-native-svg has no cheap blur, and
  a real one on the largest moving element on screen is the fastest way to
  make this stutter on mid-range Android. Do not "tidy away" the transparent
  last stop of any gradient -- it IS the edge.
- **Note (session 9), THE ORB'S PROPORTIONS ARE A DELIBERATE DIVERGENCE.**
  `systems/03-design-system.md` says "35% halo at 1.35R". d3 actually draws a
  276px body inside a 452px glow -- a ratio of about 1.64 -- with the
  highlight at roughly 25% of the body rather than our 34%. **Decision: the
  orb follows the systems doc, not the design.** Reviewed and confirmed by
  the owner in session 9. This is the ONE place where the "design wins" rule
  below is set aside, so do not "fix" it to match d3 -- and if you change the
  ratio, change `systems/03` first.

---

## T03 — Add orb grain and ambient drift

- [x] `485559b`
- **Commit:** `feat(breathe): add orb grain texture and ambient drift`
- **Depends on:** T02
- **Touches:** `apps/native/src/features/breathing/Orb.tsx`, `apps/native/assets/images/grain.png`
- **Done when:** a static low-opacity noise texture overlays the orb, a ±1.5% scale oscillation runs on a ~7s cycle independent of the breath, and the orb is never perfectly still.

- **Note (session 9):** `assets/images/grain.png` is generated, not drawn --
  128x128, 8-bit grey+alpha, deterministic seed so it never shows up as a
  spurious diff. Tiled (`resizeMode="repeat"`), never stretched: scaled up to
  320 it becomes soft blobs, which is the opposite of the point.

---

## T04 — Drive the orb from Reanimated shared values

- [x] `41a6ea8`
- **Commit:** `feat(breathe): drive orb animation from reanimated shared values`
- **Depends on:** T02, T01
- **Touches:** `apps/native/src/features/breathing/useOrbAnimation.ts`
- **Done when:** scale animates 0.62↔1.0 and opacity 0.75↔1.0 on `easeInOutSine`, the halo lags the core by ~120ms, everything runs on the UI thread, and no animation value is held in Zustand.

- **Note (session 9):** implemented as ONE `withSequence` covering the whole
  session, scheduled at start. There is no tick and no per-phase re-render --
  see the long comment at the top of `useOrbAnimation.ts`. Phase starts reach
  the JS thread through Reanimated's own completion callbacks, so if JS is
  busy the label arrives late while the breath stays perfect, which is the
  right way round.

---

## T05 — Add the physiological sigh curve

- [x] `41a6ea8`
- **Commit:** `feat(breathe): add physiological sigh animation curve`
- **Depends on:** T04
- **Touches:** `apps/native/src/features/breathing/useOrbAnimation.ts`, `packages/domain/src/breathing.ts`
- **Done when:** the double-inhale renders as 0.62→0.85, a 180ms micro-hold, 0.85→1.0, then a long exhale to 0.62, and it reads visually as two distinct sips of air.

- **Note (session 9):** the curve lives in `packages/domain`, not in the hook.
  `buildTimeline` puts `fromScale`/`toScale` on every step, so the sigh's
  0.62 -> 0.85 -> hold -> 1.0 shape is unit-tested with no frame loop, and
  the renderer stays dumb. Opacity is derived from scale rather than stored,
  so the two cannot disagree.

---

## T06 — Wire haptics to phase transitions

- [x] `353a0f3`
- **Commit:** `feat(breathe): wire haptic cues to breath phase transitions`
- **Depends on:** T04, `04-audio-haptics` T07
- **Touches:** `apps/native/src/features/breathing/useBreathHaptics.ts`
- **Done when:** each phase fires its mapped haptic within 30ms of the visual transition, the sigh's second inhale fires a 140ms double-tap, and a full session is followable with the screen off on both platforms.

---

## T07 — Add the phase label

- [x] `f75b46f`
- **Commit:** `feat(breathe): add cross-fading phase label`
- **Depends on:** T04
- **Touches:** `apps/native/src/features/breathing/PhaseLabel.tsx`
- **Done when:** "Breathe in" / "Hold" / "Breathe out" / "Rest" cross-fade beneath the orb, no countdown number is ever shown, and `accessibilityLiveRegion="polite"` announces phase changes to VoiceOver and TalkBack.

---

## T08 — Add reduce-motion orb variant

- [x] `485559b`
- **Commit:** `feat(breathe): add reduce-motion orb variant`
- **Depends on:** T04, `02-design-system` T07
- **Touches:** `apps/native/src/features/breathing/Orb.tsx`
- **Done when:** with reduce motion on, the orb shifts opacity and colour instead of scaling, breath timing is unchanged, and the guidance remains fully usable.

---

## T09 — Build the session screen

- [x] `c621c4f`
- **Commit:** `feat(breathe): build breathing session screen`
- **Depends on:** T04, T07, `05-app-shell` T04
- **Touches:** `apps/native/src/app/session/[pattern].tsx`, `apps/native/src/features/breathing/SessionScreen.tsx`
- **Done when:** the orb is centred on an otherwise empty screen, the screen stays awake for the session's duration, and there is no chrome, timer, or progress bar visible.

- **Note (session 9, design audit):** the first implementation of this screen
  took its colours from `@calma/tokens` rather than from the design files, and
  inherited the token layer's gaps. Corrected: the light-mode immersive ground
  is `#F2E7D6`, not `#FBF7F1`; the buttons on it use `surface-immersive` /
  `border-immersive` (`#EADCC7` / `#DFCEB4` light, `#1C2733` / `#2A3644` dark)
  and are 64px, not 62; the orb and the gap beneath it are per-state (320/46
  breathing, 268/48 extending, 240/54 stopping) rather than one shared value;
  d5's heading is 34px (`titleSm`), not 36.

---

## T10 — Add the pre-session SUDS slider

- [x] `248f76e`
- **Commit:** `feat(breathe): add pre-session suds intensity slider`
- **Depends on:** T09
- **Touches:** `apps/native/src/features/breathing/SudsSlider.tsx`
- **Done when:** a 0–10 slider labelled "Steady" to "Overwhelming" is shown before non-panic sessions, is skippable with one visible tap, stores `null` when skipped, and is **never shown on the panic path**.

- **Note (session 9):** NO NUMBER IS SHOWN, which diverges from
  `systems/03-design-system.md`'s "no numeric labels except the current
  value". D2's caption is explicit -- "no number anywhere; the value is a
  position, not a score" -- and the design wins on presentation. The value is
  still stored as 0-10 for the Progress tab; it is simply never shown back.
  Built on gesture-handler rather than adding `@react-native-community/slider`:
  the design needs a gradient track, a 40px thumb and no numerals, which is
  the whole component anyway.

- **Note (session 9, design audit):** the thumb's ring is `accent-ring`
  (`#D08A45` / `#C08347`), its own token. It first used `accent-pressed`,
  which is close enough to grab by mistake and different enough that the thumb
  reads flat against the track.

---

## T11 — Add extend-or-stop handling

- [x] `c621c4f`
- **Commit:** `feat(breathe): add session extension and stop confirmation`
- **Depends on:** T09
- **Touches:** `apps/native/src/features/breathing/SessionScreen.tsx`
- **Done when:** at session end the app asks "Want to keep going?" and only extends on an explicit tap; back or swipe-down mid-session asks "Stop here?"; ratios cannot be changed mid-session.

---

## T12 — Add the post-session feeling check

- [x] `3e40ac9`
- **Commit:** `feat(breathe): add post-session feeling check`
- **Depends on:** T09
- **Touches:** `apps/native/src/features/breathing/FeelingPicker.tsx`
- **Done when:** the three emoji options render as large targets with their exact response copy, the choice is skippable, and `sessionEnd` audio plays once as the session closes.

- **Note (session 9):** `sessionEnd` plays. The three faces are in the
  component, not the JSON, so `packages/i18n`'s no-emoji rule can stay
  absolute.

- **Note (session 9, design audit):** card padding is 26/8 with a 14px gap and
  a 34px section gap, and the heading is 34px (`titleSm`), per d6.

---

## T13 — Persist sessions and offer journaling

- [x] `61dcf10`
- **Commit:** `feat(breathe): persist sessions and trigger journaling offer`
- **Depends on:** T10, T12, `03-storage-layer` T09
- **Touches:** `apps/native/src/features/breathing/useSession.ts`
- **Done when:** every session is written via `BreathingRepo` including early stops; the journaling offer appears when `preSuds >= 7` or the post-check is "same" or "worse"; the offer is dismissible without friction and never re-prompts for the same session.

---

## T14 — Build the pattern picker

- [x] `dfb58dd`
- **Commit:** `feat(breathe): build pattern picker screen`
- **Depends on:** T09
- **Touches:** `apps/native/src/app/(tabs)/breathe.tsx`
- **Done when:** 4-7-8, 5-5-5-5, and physiological sigh are selectable with a one-line plain-language description each, a "custom" row is present but inert until plan 11 gates it, and each entry launches the session with the correct `entryPoint`.
- **Note (session 9):** row order follows D1 (sigh first), NOT
  `PRESET_PATTERNS` (4-7-8 first) -- the picker leads with the fastest-acting
  pattern because the likeliest reason to be on this screen is needing
  something to work soon. Names are spoken, not numeric, and the second line
  says what each is FOR rather than what it is; this replaces the `description`
  copy in `breathing.json` with a new `purpose` key. The old `description`
  strings are left in place for Settings and the custom-rhythm screen.
- **Note (session 13):** the custom row is no longer inert. It routes to
  `/custom-rhythm` (d7, plan 11 T11), which is built and deliberately ungated
  for now. "a 'custom' row is present but inert until plan 11 gates it" in the
  Done-when above is therefore superseded: the row is present and live, and
  the gate is still plan 11's to add.

