# 01 — Foundation

Package skeleton, boundaries, and shared primitives. Nothing user-facing.

**Branch:** `chore/foundation`
**Depends on:** nothing
**Reference:** `systems/01-architecture.md`

---

## T01 — Create `packages/domain` with zero runtime dependencies

- [x] `fc4a942`
- **Commit:** `chore(domain): scaffold dependency-free domain package`
- **Touches:** `packages/domain/{package.json,tsconfig.json,src/index.ts}`, `pnpm-workspace.yaml`
- **Done when:** `@calma/domain` builds, its only dependency is `zod` from the catalog, and it imports nothing from React or React Native.

---

## T02 — Define domain entities and zod schemas

- [x] `6721f35`
- **Commit:** `feat(domain): add entity types and zod schemas`
- **Touches:** `packages/domain/src/entities/{breathing,worry,journal,prefs}.ts`
- **Depends on:** T01
- **Done when:** `BreathingSession`, `Worry`, `JournalEntry`, and `Prefs` from `systems/02-data-layer.md` each have a type and a matching zod schema, and `schema.parse` round-trips a fixture.

---

## T03 — Add time utilities (day keys, ISO week keys)

- [x] `1f17d1e`
- **Commit:** `feat(domain): add local day and ISO week key utilities`
- **Touches:** `packages/domain/src/time.ts`, `packages/domain/src/time.test.ts`
- **Depends on:** T01
- **Done when:** `dayKey(date)` returns local `YYYY-MM-DD`, `weekKey(date)` returns Monday-start ISO `YYYY-Www`, and tests cover year boundaries, DST transitions, and the 29 Dec / 4 Jan ISO week edge cases.

---

## T04 — Add ULID-style id generator

- [x] `00ab548`
- **Commit:** `feat(domain): add sortable ulid-style id generator`
- **Touches:** `packages/domain/src/id.ts`, `packages/domain/src/id.test.ts`
- **Depends on:** T01
- **Done when:** ids are lexicographically sortable by creation time, and 10,000 ids generated in the same millisecond are unique.

---

## T05 — Add tier limit rules as pure functions

- [x] `223ed92`
- **Commit:** `feat(domain): add tier limit rules`
- **Touches:** `packages/domain/src/tier.ts`, `packages/domain/src/tier.test.ts`
- **Depends on:** T03
- **Done when:** `limitsFor(tier)`, `isAtWorryLimit`, and `isAtJournalLimit` match `systems/05-entitlements.md`, with tests for the boundary (2 entries allowed, 3rd blocked) and for week rollover.

---

## T06 — Add breathing pattern definitions

- [x] `d6754f7`
- **Commit:** `feat(domain): add breathing pattern definitions`
- **Touches:** `packages/domain/src/breathing.ts`, `packages/domain/src/breathing.test.ts`
- **Depends on:** T01
- **Done when:** 4-7-8, 5-5-5-5, and physiological sigh are defined as phase sequences with durations; `cycleDuration()` and `cyclesForDuration()` are tested; custom ratios validate against sane bounds (each phase 1–20s, total cycle 4–60s).

---

## T07 — Create `packages/tokens`

- [x] `724e1c1`
- **Commit:** `chore(tokens): make the token package resolvable from both apps`
- **Touches:** `packages/tokens/{package.json,src/index.ts}`, `apps/{native,web}/package.json`
- **Done when:** the package exports an empty typed token shape and is consumable from both `apps/native` and `apps/web`. Values land in plan 02.
- **Note:** the package itself was built ahead of order in session 4 (`61d1e57`
  onwards) with real values, so only the missing half of this todo remained —
  neither app declared `@calma/tokens`, which meant it was not actually
  resolvable from either. This commit adds the workspace dependency.

---

## T08 — Add import boundary lint rules

- [x] `5e31527`
- **Commit:** `chore(config): enforce package import boundaries`
- **Touches:** `packages/config/eslint/*`, root lint config
- **Depends on:** T01, T07
- **Done when:** importing `react-native-mmkv` outside `packages/db` fails lint; importing React or React Native inside `packages/domain` fails lint; a deliberate violation is confirmed to fail and then removed.

---

## T09 — Add Vitest to `domain` and wire it into turbo

- [x] `6abaacc`
- **Commit:** `chore(domain): add vitest and wire test task into turbo`
- **Touches:** `packages/domain/vitest.config.ts`, `turbo.json`, root `package.json`
- **Depends on:** T02–T06
- **Done when:** `pnpm test` runs all domain tests from the repo root in Node with no simulator, and every test written in T03–T06 passes.
