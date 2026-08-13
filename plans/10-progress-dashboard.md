# 10 — Progress Dashboard

Reflection, not gamification. No scores, no comparisons, no badges.

**Branch:** `feat/progress-dashboard`
**Depends on:** 03, 06, 08, 09
**Reference:** `systems/02-data-layer.md` (aggregates, streak)

---

## T01 — Build the progress store

- [ ]
- **Commit:** `feat(progress): add progress zustand store`
- **Depends on:** `03-storage-layer` T10
- **Touches:** `apps/native/src/features/progress/store.ts`
- **Done when:** the store reads from the aggregate cache rather than recomputing, and the Progress tab renders in under 16ms with a year of seeded data.

---

## T02 — Build the this-week card

- [ ]
- **Commit:** `feat(progress): build this-week summary card`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/progress/WeekCard.tsx`
- **Done when:** it shows sessions, total breathing minutes, worries processed and released, and journal entries for the current ISO week, phrased in plain language rather than as bare metrics.

---

## T03 — Build the streak display

- [ ]
- **Commit:** `feat(progress): build streak display`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/progress/StreakCard.tsx`
- **Done when:** the current streak renders with "{n} days in a row. You're showing up for yourself.", day one has its own copy, a zero streak shows nothing at all rather than a zero, and there is no "longest streak" comparison.

---

## T04 — Add the streak achievement moment

- [ ]
- **Commit:** `feat(progress): add streak achievement feedback`
- **Depends on:** T03, `04-audio-haptics` T03
- **Touches:** `apps/native/src/features/progress/useStreakCelebration.ts`
- **Done when:** the two glass notes and a success haptic fire once when a new streak day is reached, in-context rather than on the Progress tab, and never more than once per day.

---

## T05 — Build the empty state

- [ ]
- **Commit:** `feat(progress): build progress empty state`
- **Depends on:** T02
- **Touches:** `apps/native/src/features/progress/EmptyState.tsx`
- **Done when:** a new user sees "We'll start keeping track as you go." with no zeroed-out charts and no empty skeletons.

---

## T06 — Build the history list

- [ ]
- **Commit:** `feat(progress): build paginated history list`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/progress/HistoryList.tsx`
- **Done when:** history paginates 30 days at a time descending, each day shows its sessions and entries compactly, and scrolling stays smooth with a year of data. Gated in plan 11.

---

## T07 — Build the monthly trend chart

- [ ]
- **Commit:** `feat(progress): build monthly trend chart`
- **Depends on:** T06
- **Touches:** `apps/native/src/features/progress/TrendChart.tsx`
- **Done when:** an SVG line chart shows sessions per week and average pre-SUDS over 12 weeks, uses only warm palette colours, has no axis clutter, and excludes null SUDS values from the average rather than treating them as zero.

---

## T08 — Build session statistics

- [ ]
- **Commit:** `feat(progress): build session statistics view`
- **Depends on:** T06
- **Touches:** `apps/native/src/features/progress/SessionStats.tsx`
- **Done when:** it shows pattern distribution, average duration, completion rate, and the better/same/worse split — all phrased neutrally, with no framing of a low completion rate as a failure.

---

## T09 — Add the no-improvement guardrail

- [ ]
- **Commit:** `feat(progress): suppress discouraging trend framing`
- **Depends on:** T07
- **Touches:** `apps/native/src/features/progress/TrendChart.tsx`
- **Done when:** a flat or worsening trend is rendered without commentary — no "your anxiety is increasing", no red, no warning icon. Data is shown; interpretation is not imposed.

---

## T10 — Build the Progress tab and verify

- [ ]
- **Commit:** `feat(progress): assemble progress tab`
- **Depends on:** T02–T09
- **Touches:** `apps/native/src/app/(tabs)/progress.tsx`
- **Done when:** the tab composes streak, week card, and gated sections in order; renders correctly with 0, 1, 7, and 365 days of seeded data; and is verified on iOS and Android at 200% font scale.
