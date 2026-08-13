# Git Workflow

**One todo, one commit.** No exceptions.

A feature has between 1 and 20 todos. Each todo is a single, self-contained, reviewable commit. Wiring several pieces together is its own todo and its own commit — for example, in an auth feature: signup controller, signup deps, password hasher, and *then* a fourth todo connecting the three.

---

## The loop

For each todo, in order:

1. Read the todo in its `plans/` file.
2. Make **only** that change.
3. Tick the checkbox in the plan file, appending the short commit SHA.
4. Stage the code change **and** the plan-file edit together.
5. Commit with the message written in the todo.

The plan-file tick lands in the same commit as the work. That way `git log` and the plan file can never disagree about what's done, and `git show` for any commit tells you what it was for.

---

## Message format

Conventional Commits.

```
<type>(<scope>): <subject>

<body — why, not what>

Plan: plans/08-worry-postponement.md#T04
```

**Types:** `feat` · `fix` · `refactor` · `chore` · `docs` · `test` · `style` · `perf` · `build`

**Scopes:** `db` · `domain` · `tokens` · `breathe` · `worry` · `journal` · `progress` · `panic` · `entitlement` · `notify` · `audio` · `haptics` · `onboarding` · `settings` · `nav` · `theme` · `web` · `deps`

**Subject:** imperative, lowercase, no full stop, ≤ 72 characters.

```
feat(worry): add guided triage state machine

Triage is modelled as an explicit machine rather than screen state so an
interrupted window can resume at the right worry after a cold boot.

Plan: plans/08-worry-postponement.md#T06
```

The body is for the reasoning. The diff already shows what changed; it doesn't show why the alternative was rejected.

---

## Branching

`main` is the trunk and stays releasable.

Feature branches are used when a feature has **more than 5 todos**, which is most of them:

```
feat/worry-postponement
feat/breathing-engine
chore/foundation
```

Merged with `--no-ff` so the feature's todo sequence stays legible as a group in the history. Small features (≤ 5 todos) commit directly to `main`.

Branch names use the plan file's slug, so `plans/08-worry-postponement.md` → `feat/worry-postponement`.

---

## Plan file format

Every plan file uses this structure. The checkbox is the source of truth for progress.

```markdown
## T04 — Add worry capture repository methods

- [x] `a1b2c3d`
- **Commit:** `feat(db): add worry capture and pending-list repository methods`
- **Touches:** `packages/db/src/ports/worry.repo.ts`, `packages/db/src/adapters/mmkv/worry.mmkv.ts`
- **Depends on:** T02
- **Done when:** `create`, `listPending`, and `countCapturedOn` are implemented,
  index writes are ordered record-then-index, and unit tests pass.
```

- `Done when` is a verifiable condition, not a restatement of the title. If it can't be checked, the todo is too vague to start.
- `Touches` is a prediction, not a contract — but a commit that strays far outside it usually means the todo was doing two things.

---

## Definition of done

A todo cannot be ticked unless all of these hold:

- `pnpm check-types` passes across the workspace.
- Lint passes, including the `no-restricted-imports` boundary rules.
- New pure logic in `packages/domain` has unit tests.
- The change was run on **both** iOS and Android (D-003) — or the todo explicitly says it's platform-neutral.
- No new `console.log`, no commented-out code, no `TODO` without a plan-file reference.
- No user content appears in any log statement, on any platform, in any build.

A feature's plan file is closed only when every todo is ticked and the feature has been used end-to-end on both a real iOS device and a real mid-range Android device.

---

## Things that are never committed

- Real RevenueCat API keys, or any `.env` file.
- Audio source files (`.wav`, `.aiff` masters) — only the shipped `.m4a`.
- `plans/` and `systems/` — both gitignored. These are working notes.
- Anything containing real user data, including screenshots of populated screens from a personal device.

---

## When a plan turns out to be wrong

It will. Do not silently do something different.

1. Edit the plan file to reflect the new approach.
2. If the reasoning changed, add or supersede an entry in `systems/09-decisions.md`.
3. Commit that as its own `docs(plan):` commit **before** the code change.

The plan is a record of intent. A plan that gets quietly retconned to match the code is worth nothing.
