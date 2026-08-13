# 07 — Panic Button

One tap to breathing, from anywhere, always free, no questions. The strictest UX contract in the app.

**Branch:** `feat/panic-button`
**Depends on:** 05, 06
**Reference:** D-006

---

## T01 — Wire the FAB to the panic route

- [ ]
- **Commit:** `feat(panic): wire panic button to panic session route`
- **Depends on:** `05-app-shell` T06
- **Touches:** `apps/native/src/components/PanicFab.tsx`, `apps/native/src/app/panic.tsx`
- **Done when:** a single tap navigates to `/panic` from any tab, no confirmation appears, and the transition is measurably under 300ms from tap to first orb frame.

---

## T02 — Build the panic session as a 60-second sigh

- [ ]
- **Commit:** `feat(panic): build 60-second physiological sigh session`
- **Depends on:** T01, `06-breathing-engine` T05
- **Touches:** `apps/native/src/features/breathing/PanicSession.tsx`
- **Done when:** the session runs the physiological sigh pattern for 60 seconds, no SUDS slider is shown beforehand, and `entryPoint` is recorded as `panic`.

---

## T03 — Add the panic activation sound and haptic

- [ ]
- **Commit:** `feat(panic): add activation sound and heavy haptic`
- **Depends on:** T02, `04-audio-haptics` T03
- **Touches:** `apps/native/src/features/breathing/PanicSession.tsx`
- **Done when:** the wooden drum plays once at full volume on activation with a `Heavy` haptic, then the session is silent for its whole duration apart from breath haptics.

---

## T04 — Add the opening line

- [ ]
- **Commit:** `feat(panic): add opening reassurance copy`
- **Depends on:** T02
- **Touches:** `packages/i18n/src/locales/en/breathing.json`, `PanicSession.tsx`
- **Done when:** "Right now, just breathe. Everything else can wait." fades in for ~4 seconds then fades out, leaving only the orb.

---

## T05 — Add the always-visible exit

- [ ]
- **Commit:** `feat(panic): add always-visible session exit`
- **Depends on:** T02
- **Touches:** `PanicSession.tsx`
- **Done when:** an "I'm okay" button is visible for the entire session, exits immediately with no confirmation, and the partial session is still recorded with `completed: false`.

---

## T06 — Add the panic session ending

- [ ]
- **Commit:** `feat(panic): add gentle session ending`
- **Depends on:** T02
- **Touches:** `PanicSession.tsx`
- **Done when:** at 60 seconds the singing bowl plays, "You're still here. That's enough." is shown, and the only options are "A bit longer" or returning home — **no SUDS check, no journaling offer, no paywall, ever, on this path**.

---

## T07 — Guarantee single-frame response and double-fire protection

- [ ]
- **Commit:** `fix(panic): guarantee single-frame response and prevent double-fire`
- **Depends on:** T01, T03
- **Touches:** `apps/native/src/components/PanicFab.tsx`, `apps/native/src/app/panic.tsx`
- **Done when:** the visual change, the drum, and the Heavy haptic all land on the **same frame as the touch**, before the session screen mounts — the acknowledgement is never the *result* of the navigation. A second tap within 600ms is swallowed and cannot launch a second session or dismiss the one starting. Verified on a cold start and under CPU load, on both platforms. A button that hesitates gets tapped again, and the person doing the tapping here is having a panic attack (`plans/19-review-findings.md` R1).

---

## T08 — Verify the panic path end to end

- [ ]
- **Commit:** `test(panic): verify panic path constraints on both platforms`
- **Depends on:** T01–T06
- **Touches:** `apps/native/src/features/breathing/__tests__/panic.test.tsx`
- **Done when:** tests assert that no paywall, permission prompt, SUDS slider, or modal can appear on the panic path under any tier or state; and the flow is confirmed by hand on iOS and Android from every tab, including in the degraded boot state.
