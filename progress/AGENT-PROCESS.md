# How to work on Calma

**Read this before `00-START-HERE.md`.** That file tells you *what* to build
next. This one tells you *how* to work, and how to leave the repo so the agent
after you can pick it up cold.

Calma is built one chat at a time. Each chat has a finite context window, no
memory of the last one, and no memory of itself once it closes. The whole
method below exists to make that survivable: **the repository is the memory,
and writing to it is part of the job, not the wrap-up.**

If you take one thing: *a session that builds nine things and leaves no handoff
is worth less than a session that builds six and hands over cleanly.* The
seventh, eighth and ninth get rediscovered by the next agent at full price.

---

## Part 1 — The five pillars

### Pillar 1. The design files are the source of truth

`designs/extracted/*.html` is 58 screens, light and dark, 116 files. Every one
carries the real markup — exact hex values, pixel sizes, spacing, weights — and
a **caption block** at the bottom where the designer wrote down *why*.

> If the folder is missing, run `python designs/extract.py`. It decodes
> `designs/html/`, which is the only tracked source. Both the script and the
> extracted folder are gitignored.

**The precedence order, highest first:**

1. `designs/extracted/*.html` — what a screen looks like
2. `systems/` — why it works that way, and the rules that survive a redesign
3. `packages/tokens` — a convenience for values the designs share
4. Anything else

Where 1 and 2 disagree about an **appearance**, 1 wins. Where they disagree
about a **behaviour** ("never show a countdown", "no red anywhere"), 2 wins,
because the design file cannot express a rule that spans screens.

**The failure this pillar exists to prevent** happened twice and cost real
work. Session 9 built the breathing screens from `@calma/tokens` instead of
from the design files, and inherited the token layer's gaps: light mode has
its own immersive background, `#F2E7D6`, which was missing from `colors.ts`
*and* from `designs/TOKEN-CENSUS.md`. Nothing caught it because everything
downstream agreed with itself. Session 10 found the same shape again with
`surface-quiet` — a button is a step forward of a card and gets its own pair,
on nine screens.

So: **open the design file for the screen you are on, every time.** Read the
values out of the markup. Read the caption. The tokens are downstream of the
designs and are allowed to be incomplete; the designs are not.

**Exceptions are registered, not assumed.** There is exactly one place where a
systems doc knowingly overrides a design: the orb's proportions follow
`systems/03`'s "35% halo at 1.35R" rather than d3's 1.64, decided by the owner
in session 9 and written into `plans/06` T02. If you find another conflict,
**do not resolve it silently in either direction** — raise it, get a decision,
and record it the same way.

### Pillar 2. The plan file is the unit of work

`plans/` holds 189 todos across 19 files. A todo is one commit. The checkbox
carries the short SHA:

```markdown
## T04 — Drive the orb from Reanimated shared values

- [x] `4f3d972`
- **Commit:** `feat(breathe): drive orb animation from reanimated shared values`
- **Touches:** `apps/native/src/features/breathing/useOrbAnimation.ts`
- **Done when:** scale animates 0.62↔1.0 ... and no animation value is in Zustand.
```

**"Done when" is a contract.** If it says "on both platforms" or "renders", and
you cannot run a device, you cannot honestly tick it. Say so in the changelog
rather than quietly counting it.

**If the plan is wrong, change the plan first**, in its own `docs(plan):`
commit, and leave a `**Note (session N):**` block explaining why. Never diverge
silently. Several plans have already been corrected this way and the notes are
the only reason anyone knows what happened.

Sometimes several todos genuinely share one commit — three requirements on one
file written once (plan 06 T02/T03/T08 are all "the orb"). That is fine. Say so
in the commit message and give each checkbox the same SHA. Fabricating
intermediate states that never existed would be worse.

### Pillar 3. `systems/` explains why, and holds the rules

Ten documents: architecture, data, design system, audio/haptics, entitlements,
notifications, copy and tone, git workflow, 19 numbered decisions, i18n.

Decisions are cited by number (D-004, D-017) throughout the codebase. When you
write a comment explaining a non-obvious constraint, cite the decision. When
you make a new one, add it to `systems/09-decisions.md` and cite it.

These documents state things a design file cannot: no exclamation marks
anywhere, no red, no error states, a skipped rating is `null` and never `0`,
animation state never goes in Zustand, no modal may ever appear on the panic
path. Those hold across every screen and survive any visual revision.

### Pillar 4. `progress/` is the memory

| File | What it is |
|---|---|
| `00-START-HERE.md` | The entry point. Rewritten every session. Self-contained. |
| `04-changelog.md` | Newest first. **The only place the reasoning survives.** |
| `commit-session-N.ps1` | The commit script for that session (see Pillar 5). |
| `AGENT-PROCESS.md` | This file. |

The changelog is not a list of files touched — git already has that. It is
where you write down *why* you did it that way, *what* you decided, and *what
you are unsure about*. Write the entry you would want to find.

`plans/`, `systems/` and `progress/` are all gitignored. They are working
notes. That means plan-file ticks are local only, and it means a `docs(plan):`
commit is a no-op in the tree that exists so the message is in the log.

### Pillar 5. The sandbox has hard limits — design around them

You are likely working in a Linux sandbox against a mounted Windows folder.
What that costs:

- **The mount blocks `unlink`.** `git` strands its lock files and then refuses
  to run at all. So you cannot commit, and you cannot delete a file.
- **`vitest` cannot run.** Only Windows rollup binaries are installed, so
  rollup has no linux native module. `tsc` works fine. `eslint` works fine.
- **No npm registry.** You can add a dependency to `package.json`, but the
  install happens on the owner's machine.
- **`ffmpeg`, `python3`, `numpy` and `node` are available** and are genuinely
  useful — session 9 used them to measure a sound's frequency spectrum and
  catch a file that was inaudible on a phone speaker.

**The pattern that works:** write all the code, then emit a PowerShell script
the owner runs. It commits one todo at a time and writes each resulting SHA
back into the plan file, replacing a `pending-TXX` placeholder. See
`commit-session-{6,7,8,9}.ps1` for the shape — copy the newest.

> **Any `.ps1` you write must be ASCII-only.** Windows PowerShell 5.1 reads a
> script as ANSI unless it has a BOM, so a single em dash in a here-string gets
> written into the repo doubly encoded. This has happened. Check with:
> `python3 -c "print(sum(1 for b in open(p,'rb').read() if b>127))"`

The script should also tolerate being re-run: check `git diff --cached --quiet`
and skip rather than fail when there is nothing to commit.

**Deletions go in the script**, not the working tree — `git rm -f`, not
`--cached`, or the following `git add -A` puts the file straight back.

---

## Part 2 — Budgeting context

This is the part that has no tooling. You have to do it by judgement, out loud,
early.

### Do a cheap orientation pass first

Before deciding anything, spend a small, bounded amount of context on:

1. `progress/00-START-HERE.md` — the whole thing
2. The plan file named as your task
3. The relevant `systems/` sections it points at
4. `git log --oneline | head -20` and `git status --short`
5. Whether the toolchain actually runs — try `tsc`, try the test runner, check
   what is in `node_modules`

**Step 5 is not optional and it is routinely skipped.** Session 9 discovered
in the first ten minutes that `vitest` could not run at all and that the entire
theme layer was dead code. Both facts changed the plan. Finding them at the end
would have wasted the session.

### Then estimate, and say the estimate out loud

State plainly what you think fits. A rough calibration from real sessions:

| Work | Rough cost |
|---|---|
| A pure-logic module in `packages/` with real tests | small |
| A screen built from a design file, done properly | medium |
| A screen requiring a new token, a new component variant and an i18n key | medium-large |
| A cross-cutting fix touching tokens + CSS + several components | large |
| Auditing six built screens against their design files | medium |
| The handoff — changelog, START-HERE, plan notes, commit script | **always reserve this** |

**Reserve the handoff before you start, not when you notice you are running
low.** Roughly the last fifth. If you are choosing between one more todo and a
clean handoff, take the handoff every time.

### Order the work so partial completion still makes sense

Sequence by "what is most valuable if I stop here", not by plan order. Session
9 ordered it: theme fix → phase machine → orb → haptics → screens → docs, so
that stopping at any point left something coherent behind.

Say the order at the start. If the owner is away, that ordering *is* the
decision you are asking them to trust.

### When you are running low

Say so, finish the current unit, and go to the handoff. Do not start a screen
you cannot finish and do not leave a file half-written. A stub with a `TODO` is
worse than an absence — the next agent has to work out whether it is real.

---

## Part 3 — The session, start to finish

### 1. Orient (see above)

### 2. Ask the owner — before writing code

Ask in one round, with concrete options, and then start. Do not ask one
question at a time and do not ask what you can determine yourself.

**The four questions worth asking:**

1. **Scope.** "The plan has N todos. All of them, or the first M?" Offer a
   recommendation and say why.
2. **Blocked dependencies.** If your plan depends on an unbuilt plan, or on a
   package that is not installed, name it and offer the options: build the
   dependency inline, stub it, or skip the dependent todos. Do not silently
   pick one.
3. **Known conflicts.** If a design file and a systems doc disagree, or a plan
   contradicts what is on disk, surface it now with both readings.
4. **Anything you cannot verify.** Say which "Done when" clauses need a device
   and will therefore be unverified whatever you do.

If the answer is "I'm leaving, use your judgement": take the recommended option
every time, keep going, and **collect every decision you made into one flagged
list at the end.** Do not bury them in the changelog only.

### 3. Build

- One todo at a time, against the design file and the plan's "Done when".
- Every string through `@calma/i18n`. Lint fails on literal JSX text in
  `features/`.
- Comment the *why*, especially where the obvious implementation is wrong. The
  comment that says "a JS timer drifts most exactly when the phone is busiest,
  which is when someone is most likely to be using this" is worth more than the
  code under it.
- Cite decisions by number.

### 4. Verify — and make sure the verification can fail

Run what runs: `tsc` per package, `eslint`. If the test runner cannot run in
the sandbox, **find another way to actually execute the logic** rather than
declaring it untested. Session 9 compiled the phase machine to CommonJS with
`tsc` and ran 22 assertions against it with `node`. That is not as good as the
real suite, but it is enormously better than nothing.

**A test that cannot fail is not a test.** When you write a parity or invariant
check, tamper with the input once and confirm it goes red. Session 9's theme
parity test was written with an over-escaped regex that matched nothing; only
the negative control caught it.

Prefer checks that pin *rules*, not just values: no pure black or white, no
danger colour, amber quieter in dark mode, the warm and cool text colours never
collapsing into one.

### 5. Audit the screens against the designs

**A separate, deliberate step. Do not skip it because you were careful.**

For every screen you built, open its design file — both themes — and compare:
ground colour, surface and border, radii, control heights, type sizes, section
gaps, and any gradient or shadow. Write down what does not match.

Session 9 believed it had followed the designs closely, and had, mostly. The
audit still found five real deviations including a wrong background on the most
important screen in the app. The audit only happened because the owner asked.
**Ask yourself.**

### 6. Record every divergence, in the plan file, before the changelog

`**Note (session N):**` under the todo it affects. Say what the spec said, what
you did, and why. If it was a judgement call the owner should be able to
reverse, say that too.

### 7. Write the handoff

**`progress/04-changelog.md`** — newest entry at the top. Include:

- what you built, grouped so it can be skimmed
- **the reasoning behind anything non-obvious**
- every divergence from the specs
- what is verified, what is not, and precisely how
- anything you are unsure about
- what the next agent should do first

**`progress/00-START-HERE.md`** — rewrite it, do not append. It must be
self-contained and honest about state. It should contain:

- the design-file rule, first
- the next task and the order to do it in
- what is already built, and what "built" means for each piece
- the traps: what looks fine and is not
- the exact commands to run, in order
- open items in priority order

### 8. Emit the commit script

`progress/commit-session-N.ps1`, ASCII-only, one commit per todo, SHA written
back into the plan file. Commit messages carry the reasoning — they are the
part of the record that is actually tracked, since `plans/` and `progress/` are
not.

---

## Part 4 — Leaving the repo correct

Before you finish, all of these should be true:

- [ ] Every screen you built has been compared to its design file, both themes
- [ ] Every divergence has a `Note (session N)` in its plan file
- [ ] Every new token exists in `colors.ts` *and* `global.css`, and the parity
      test covers it
- [ ] Every new string is in `packages/i18n`, not inline
- [ ] `tsc` and `eslint` run clean, or the exact remaining errors are named in
      the changelog with the reason
- [ ] Any check you wrote has been made to fail once, deliberately
- [ ] Plan checkboxes carry a SHA or a `pending-TXX` the script will fill
- [ ] Todos you could not honestly verify are **left unticked**, and said so
- [ ] `04-changelog.md` has a new entry at the top with the reasoning in it
- [ ] `00-START-HERE.md` is rewritten and self-contained
- [ ] The commit script is ASCII-only and safe to re-run
- [ ] Judgement calls made in the owner's absence are collected in one visible
      list, not only in the changelog

---

## Part 5 — The failure catalogue

Every one of these shipped and was caught later. They are here because they all
have the same shape: **a layer that agreed with itself while disagreeing with
reality, with no check spanning the gap.**

| What | How it survived |
|---|---|
| `calmaPreset` was a Tailwind v3 preset in a Tailwind v4 project | Nothing imported it. The tokens described one thing, the app rendered another, for three sessions. |
| Light-mode immersive ground missing | Absent from the tokens *and* from the census. Everything downstream agreed. |
| `surface` used where the designs use `surface-quiet` | A card and a button look like the same material until you check nine screens. |
| Amber shipped as a flat fill | Reads as plausible in code; reads as dead on screen. |
| `Button`'s props intersected with heroui's | Narrowed `variant` to the overlap. `quiet` was a type error at eight call sites, unnoticed because the app had never been typechecked. |
| `font-sans font-medium` | expo-font does not synthesise weights. Renders regular on iOS, silently. |
| `panic.m4a` inaudible | ~31 Hz fundamental, 90% of its energy below 300 Hz. Fine on a laptop, near-silent on a phone. Only measurement caught it. |
| `loudnorm` used where the spec wanted peak normalisation | The systems doc's own ffmpeg command contradicted the doc's stated requirement. |
| Duplicate `expo-audio` key in `package.json` | JSON keeps the last duplicate silently. No parser complains. |
| Parity test regex over-escaped | Matched nothing. The test passed because it could not fail. |

The lesson is not "be more careful". It is **build the check that spans the
gap** — a parity test between tokens and CSS, a negative control on every
invariant, a measurement rather than a listen, and an explicit audit of screens
against designs.

---

## The test that overrides everything

Before calling any screen done:

> If someone opened this at 3am, shaking, having just had the worst thought
> they've had all year — would this help, or would it be one more thing to deal
> with?

Calma is for people at their worst moment. A rough edge here is not a polish
issue. Ship the honest version, flag what you are unsure about, and never let
the app quietly overstate what it knows about someone's week.
