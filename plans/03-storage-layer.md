# 03 — Storage Layer

Encrypted MMKV behind repository ports. No feature code ever touches MMKV directly.

**Branch:** `feat/storage-layer`
**Depends on:** 01
**Reference:** `systems/02-data-layer.md`, D-001

**Design note (session 7).** Repositories are written against a small
`KeyValueStore` interface (`src/kv.ts`) rather than against MMKV directly. The
MMKV adapter provides one; `MemoryStore` provides another. That is what lets
the whole layer — indexes, validation, repair, aggregates, migrations — be
tested in Node with no simulator, and it is how `MemoryStore.failWritesAfter`
can interrupt a write to prove the index invariant holds. The files keep their
`*.mmkv.ts` names: they are the MMKV-era implementations, they just do not
reach for MMKV themselves.

---

## T01 — Scaffold `packages/db`

- [x] `2edf7eb`
- **Commit:** `chore(db): scaffold db package with ports and adapters structure`
- **Touches:** `packages/db/{package.json,tsconfig.json,src/index.ts}`, `pnpm-workspace.yaml`
- **Done when:** the `ports/`, `adapters/mmkv/`, and `migrations/` directories exist, `@calma/domain` is a dependency, and the package builds empty.

---

## T02 — Add encryption key bootstrap

- [ ]
- **Commit:** `feat(db): add secure-store backed encryption key bootstrap`
- **Touches:** `packages/db/src/adapters/mmkv/key.ts`
- **Depends on:** T01
- **Done when:** a 32-byte key is generated with `expo-crypto` on first run and stored in `expo-secure-store` under `calma.storage.key` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`; subsequent runs read the existing key; the key is never logged; a SecureStore failure returns a typed error rather than throwing.

---

## T03 — Create MMKV instances

- [ ]
- **Commit:** `feat(db): create encrypted mmkv instances`
- **Depends on:** T02
- **Touches:** `packages/db/src/adapters/mmkv/storage.ts`
- **Done when:** `calma.data` and `calma.prefs` are created with the encryption key, `calma.cache` without, and a value written and read back survives an app restart on both platforms.
- **Written, not ticked (session 7):** `key.ts` and `storage.ts` exist and are
  the only files in the repo that import MMKV or Expo. Neither can be verified
  without an app that boots, so both stay unticked until `plans/05` T01 lands
  and they have been run on a device. Everything above them is tested.

---

## T04 — Define repository ports

- [x] `b4a383c`
- **Commit:** `feat(db): define repository port interfaces`
- **Depends on:** T01
- **Touches:** `packages/db/src/ports/{worry,journal,breathing,prefs}.repo.ts`
- **Done when:** all four interfaces are declared with async signatures over `@calma/domain` entities, and the port files contain no runtime imports at all.

---

## T05 — Add index maintenance helpers

- [x] `b799025`
- **Commit:** `feat(db): add index maintenance helpers`
- **Depends on:** T03
- **Touches:** `packages/db/src/adapters/mmkv/indexes.ts`
- **Done when:** `addToIndex`/`removeFromIndex`/`readIndex` maintain sorted string arrays, writes are ordered record-then-index, and a test proves an interrupted write leaves an orphan record rather than a dangling pointer.

---

## T06 — Implement `PrefsRepo`

- [x] `06455a6`
- **Commit:** `feat(db): implement prefs repository`
- **Depends on:** T04, T03
- **Touches:** `packages/db/src/adapters/mmkv/prefs.mmkv.ts`
- **Done when:** get/set round-trip every `Prefs` field, defaults are returned for unset keys, and an unknown persisted key is ignored rather than throwing.

---

## T07 — Implement `WorryRepo`

- [x] `fc28bdd`
- **Commit:** `feat(db): implement worry repository`
- **Depends on:** T05
- **Touches:** `packages/db/src/adapters/mmkv/worry.mmkv.ts`
- **Done when:** create / get / listPending / listByDay / countCapturedOn / markProcessed / markReleased / delete all work; `listPending` returns oldest first; a released worry is hard-deleted from the pending index.

---

## T08 — Implement `JournalRepo`

- [x] `c273de1`
- **Commit:** `feat(db): implement journal repository`
- **Depends on:** T05
- **Touches:** `packages/db/src/adapters/mmkv/journal.mmkv.ts`
- **Done when:** create / update / listByWeek / listPaged / search / delete work; drafts are distinguishable from saved entries; `search` is a case-insensitive linear scan and returns matches newest-first.

---

## T09 — Implement `BreathingRepo`

- [x] `8dfabcd`
- **Commit:** `feat(db): implement breathing session repository`
- **Depends on:** T05
- **Touches:** `packages/db/src/adapters/mmkv/breathing.mmkv.ts`
- **Done when:** sessions record pattern, entry point, duration, cycles, pre-SUDS, post-feeling, and completion; a skipped pre-SUDS stores `null` and is excluded from averages rather than treated as 0.

---

## T10 — Add aggregate cache and streak calculation

- [x] `059a551`
- **Commit:** `feat(db): add weekly aggregate cache and streak calculation`
- **Depends on:** T07, T08, T09
- **Touches:** `packages/db/src/adapters/mmkv/aggregates.ts`, `packages/domain/src/streak.ts`
- **Done when:** `agg:week:*` and `agg:streak` update on qualifying writes; a day qualifies on a saved journal entry **or** a completed worry window, not on breathing alone; tests cover a broken streak, a same-day double-qualify, and a timezone shift.

---

## T11 — Add migration runner

- [x] `23af33b`
- **Commit:** `feat(db): add forward-only migration runner`
- **Depends on:** T03
- **Touches:** `packages/db/src/migrations/index.ts`
- **Done when:** migrations run sequentially from `meta:schemaVersion`, are idempotent, and a throwing migration leaves the version unincremented and reports a typed failure instead of corrupting data.

---

## T12 — Add zod validation on read and `repairIndexes`

- [x] `a3af83f`
- **Commit:** `feat(db): validate records on read and add index repair`
- **Depends on:** T07, T08, T09
- **Touches:** `packages/db/src/adapters/mmkv/validate.ts`, `packages/db/src/adapters/mmkv/repair.ts`
- **Done when:** a corrupt record is dropped from results and de-indexed rather than throwing; the key is logged but never the content; `repairIndexes()` rebuilds every index from a full key scan and is verified against a deliberately corrupted store.

---

## T13 — Wire the factory and add the repository test suite

- [x] `01f080b`
- **Commit:** `feat(db): wire repository factory and add integration test suite`
- **Depends on:** T06–T12
- **Touches:** `packages/db/src/index.ts`, `packages/db/src/__tests__/*`
- **Done when:** a single `createRepositories()` factory returns all four repos typed as their ports, swapping the adapter is a one-line change, and the suite covers CRUD, index integrity, migration, and corruption recovery against an MMKV mock.
