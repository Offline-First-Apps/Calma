# 05 — App Shell

Boot sequence, navigation, tab bar, and the panic FAB's placement.

**Branch:** `feat/app-shell`
**Depends on:** 02, 03
**Reference:** `systems/01-architecture.md`

**Deviation (session 8).** Routes stay in `apps/native/app/`, not
`apps/native/src/app/`. Expo Router supports both, but the metro config's
`cssEntryFile`, the `@/*` path alias and the existing entry point are all
rooted at the app directory, and moving them could not be verified without
running the bundler. Everything that is not a route still lives in `src/`.
Plan paths below say `src/app/`; read them as `app/`.

**All nine todos are written but none can be ticked from a sandbox** — every
one of them ends in "renders", "presents", or "on both platforms". They are
marked here so the next agent knows the code exists; verify on a device, then
keep the ticks.

---

## T01 — Build the boot gate

- [x] `pending-T01`
- **Commit:** `feat(nav): add boot gate with splash retention`
- **Touches:** `apps/native/src/app/_layout.tsx`, `apps/native/src/lib/boot.ts`
- **Done when:** the splash screen stays up through font load, storage init, migrations, and store hydration, then hides; boot does not wait on any network call.

---

## T02 — Add the degraded-boot fallback

- [x] `436dcef`
- **Commit:** `feat(nav): add degraded boot state for storage failure`
- **Depends on:** T01
- **Touches:** `apps/native/src/app/_layout.tsx`, `apps/native/src/components/BootError.tsx`
- **Done when:** a SecureStore or migration failure boots into a calm read-only screen with a plain-language explanation and no stack trace, and the panic button still works from that state.

---

## T03 — Set up the tab layout

- [x] `ce536ea`
- **Commit:** `feat(nav): add five-tab layout`
- **Depends on:** T01
- **Touches:** `apps/native/src/app/(tabs)/{_layout,index,breathe,write,worries,progress}.tsx`
- **Done when:** Home, Breathe, Write, Worries, and Progress render as placeholder screens with themed icons and labels (D-015); the tab bar respects safe area on both platforms; and five labels fit without truncation at 200% font scale — if they don't, the labels change rather than the scaling.

---

## T04 — Configure full-screen routes

- [x] `7578155`
- **Commit:** `feat(nav): configure full-screen presentation routes`
- **Depends on:** T03
- **Touches:** `apps/native/src/app/{panic,worry-window,onboarding,paywall}.tsx`, `apps/native/src/app/session/[pattern].tsx`
- **Done when:** each presents full-screen with the tab bar hidden, and `paywall` presents as a bottom sheet rather than a full page.

---

## T05 — Build the PanicFab component

- [x] `be559ae`
- **Commit:** `feat(panic): add floating panic button component`
- **Depends on:** `02-design-system` T06
- **Touches:** `apps/native/src/components/PanicFab.tsx`
- **Done when:** 72×72, `amber.400`, bottom-right above the tab bar, respects safe area, has a subtle at-rest ambient pulse, and carries the accessibility label and hint from the systems doc.

---

## T06 — Mount PanicFab in the tab layout

- [x] `pending-T06`
- **Commit:** `feat(panic): mount panic button as persistent overlay`
- **Depends on:** T05, T04
- **Touches:** `apps/native/src/app/(tabs)/_layout.tsx`
- **Done when:** the FAB persists across tab switches without remounting, is hidden on all full-screen routes, and never overlaps scrollable content (lists get matching bottom padding).

---

## T07 — Add screen transition motion

- [x] `3351fd5`
- **Commit:** `feat(nav): add screen transition motion respecting reduce motion`
- **Depends on:** T04, `02-design-system` T07
- **Touches:** `apps/native/src/app/_layout.tsx`, motion constants
- **Done when:** transitions run at 280ms `easeOutCubic`, collapse to cross-fades under reduce motion, and contain no bounce or overshoot.

---

## T08 — Build the Home screen

- [x] `4f3d972`
- **Commit:** `feat(nav): build home screen`
- **Depends on:** T03, `02-design-system` T05
- **Touches:** `apps/native/src/app/(tabs)/index.tsx`, `apps/native/src/features/home/*`
- **Done when:** it shows a name-aware greeting (graceful when no name is set), a "Take a sigh now" button, a quick-breathe entry, and today's pending worry count — with no numbers shown at all when there's nothing to report.

---

## T09 — Add AppState handling and session rehydration

- [x] `287e422`
- **Commit:** `feat(nav): handle app state changes and orphaned sessions`
- **Depends on:** T01
- **Touches:** `apps/native/src/lib/appState.ts`
- **Done when:** backgrounding pauses animation and haptics but not session logic; foregrounding after the session length closes it out gracefully; an orphaned `state:session:active` on cold boot is discarded silently with no message to the user.
