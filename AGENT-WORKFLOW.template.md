# Agent Workflow — a portable operating system for design-led monorepos

**This is a template. Copy it into a new project's repository root and follow
Part 2 to scaffold.** It is not specific to any one product.

---

## For the agent reading this in a fresh chat

If the project has already been scaffolded, you will find `progress/00-START-HERE.md`.
**Read that next, then stop reading this file except as reference.**

If `progress/` does not exist, you are the first session. Go to **Part 2** and
scaffold the system before writing any product code. Ask the kickoff questions
in Part 2.2 first — do not guess the answers.

---

## Part 0 — What this is and when it applies

A way of building a project across many separate agent chats, where each chat:

- has a finite context window,
- starts with no memory of the previous one,
- and forgets everything the moment it closes.

The method makes that survivable with one idea: **the repository is the memory.
Writing to it is part of the work, not the wrap-up.**

### Preconditions

This system assumes:

1. **A design source that is machine-readable.** Typically a folder of exported
   HTML screens — one file per screen per theme — containing real markup with
   real hex values, sizes and spacing. Figma exports, a static site export, or
   an AI design tool's HTML output all qualify. If your designs are only PNGs,
   most of this still works but Pillar 1 weakens sharply: an agent cannot read
   a hex out of an image reliably.
2. **A monorepo** — Turborepo, Nx, or plain workspaces — with shared packages
   and one or more apps.
3. **Work that decomposes into a long list of small, orderable units.**

### The one-line summary

Designs are the source of truth, plans are the unit of work, systems documents
hold the rules, `progress/` is the memory, and every value that exists in two
places gets a test that spans the gap.

---

## Part 1 — The pillars

### Pillar 1. The design files outrank the prose

Keep two folders:

```
designs/
  raw/          # the original exports, tracked. Never edited by hand.
  extracted/    # one readable file per screen per theme. GITIGNORED.
  extract.<ext> # the script that turns raw into extracted. Gitignored or tracked, your call.
  CENSUS.md     # optional: a frequency count of values. See the warning below.
```

`designs/extracted/` is the source of truth for **appearance**: layout, colour,
size, spacing, weight, gradients, shadows.

**The precedence ladder, highest first:**

| Rank | Source | Authority |
|---|---|---|
| 1 | `designs/extracted/*` | What a screen looks like |
| 2 | `systems/*` | Why, and rules that span screens |
| 3 | `packages/tokens` | A convenience for values the designs share |
| 4 | Anything else | Nothing |

Where 1 and 2 disagree about an **appearance**, 1 wins. Where they disagree
about a **behaviour** that no single screen can express — "never show a
countdown", "no red anywhere" — 2 wins.

**Three rules that make this real:**

- **Open the design file for the screen you are building. Every time.** Do not
  build from the token package. Tokens are downstream and are allowed to be
  incomplete; the designs are not.
- **If the design export carries designer notes or captions, read them.** The
  markup says what it looks like; the note says why. A note will sometimes
  overrule a written spec, and it should.
- **Register exceptions, never assume them.** When a design and a systems doc
  genuinely conflict, stop and ask. Write the decision into the plan file so it
  is not re-litigated. There should be a short, findable list of every place a
  spec knowingly overrides a design.

> **If you keep a `CENSUS.md`, put a warning at the top of it.** A frequency
> count of colours is useful for spotting what is common and dangerous as a
> substitute for looking. In the project this template came from, the census
> missed a background colour used on five screens, which is how the wrong
> background shipped and stayed shipped.

### Pillar 2. The plan file is the unit of work

```
plans/
  00-roadmap.md
  01-<area>.md
  02-<area>.md
  ...
```

Each plan file is a numbered list of todos. **One todo, one commit.** The
checkbox carries the resulting short SHA:

```markdown
## T04 — <imperative title>

- [x] `4f3d972`
- **Commit:** `feat(scope): message in the imperative`
- **Depends on:** `02-<area>` T03
- **Touches:** `path/to/file.ts`
- **Done when:** <a testable condition, written so it can be honestly refused>
```

- **"Done when" is a contract.** If it says "on both platforms" and you cannot
  run a device, you cannot honestly tick it. Leave it unticked and say why.
- **If the plan is wrong, change the plan first** in its own `docs(plan):`
  commit, with a `**Note (session N):**` block saying what changed and why.
  Never diverge silently.
- **Shared commits are allowed when honest.** Three todos that are three
  requirements on one file written once should share a SHA and say so in the
  message. Fabricating intermediate states that never existed is worse.

### Pillar 3. `systems/` holds the why and the rules

```
systems/
  00-index.md
  01-architecture.md
  02-data-layer.md
  ...
  09-decisions.md      # numbered, immutable, cited by number
```

Systems documents state what a design file cannot: invariants that span every
screen, architectural boundaries, and the numbered decision log.

**Number your decisions and cite them in code.** `D-004`, `D-017`. A comment
that says "animation state never goes in a store (D-004)" is worth ten that say
"careful here". When you make a new decision, add it to the log.

### Pillar 4. `progress/` is the memory

```
progress/
  00-START-HERE.md         # the entry point. Rewritten every session.
  01-project.md            # what this product is. Rarely changes.
  04-changelog.md          # newest first. Where the REASONING lives.
  commit-session-N.<ext>   # the commit script, if your agent can't run git.
  AGENT-PROCESS.md         # a copy of this file, or a link to it.
```

- **`00-START-HERE.md` is rewritten, not appended.** It must be self-contained
  and honest about state. A new agent reads it cold.
- **The changelog is not a list of files touched** — git has that. It is where
  the reasoning, the divergences, and the things you are unsure about survive.
  Write the entry you would want to find.

`plans/`, `systems/` and `progress/` are typically **gitignored** — they are
working notes, not product. That has two consequences worth knowing: plan-file
ticks are local only, and a `docs(plan):` commit is a no-op in the tree that
exists so the message is in the log.

### Pillar 5. Know your execution limits and design around them

Establish these in the first ten minutes of every session, by trying them, not
by assuming:

| Question | Why it matters |
|---|---|
| Can you run `git`? | Some sandboxes block `unlink`, so git strands lock files and refuses to run |
| Can you delete files? | Same cause. If not, deletions must go in a script |
| Does the test runner run? | Platform-specific native binaries often are not installed for your OS |
| Does the typechecker run? | Usually yes, even when the test runner does not |
| Is there a package registry? | If not, you can edit a manifest but not install |
| What else is available? | `ffmpeg`, `python`, image tools — often more than you assume, and often decisive |

**If you cannot commit:** write all the code, then emit a script the owner runs.
It should commit one todo at a time and write each resulting SHA back into the
plan file, replacing a `pending-TXX` placeholder. Make it safe to re-run — check
whether anything is actually staged and skip rather than fail. Put deletions in
the script too, and use a real delete rather than an index-only one, or the next
`add -A` will restore the file.

> **Encoding matters more than it sounds.** A shell script written in one
> encoding and executed under another will silently corrupt any non-ASCII
> character into the repository. If your script runs under Windows PowerShell
> 5.1, keep it **ASCII-only** and verify:
> `python -c "print(sum(1 for b in open(p,'rb').read() if b>127))"`

### Pillar 6. Every value in two places gets a test that spans the gap

This is the pillar that catches the bugs the others miss.

The moment a value is defined in one file and consumed in another that cannot
import it — a token in TypeScript and a variable in CSS, a constant in code and
a number in a config — **write the check that compares them.** Otherwise both
sides will agree with each other while disagreeing with reality, and nothing
will ever complain.

Then:

- **Make the test fail once, deliberately.** Tamper with an input and confirm it
  goes red. A check written with a subtly broken pattern passes forever because
  it matches nothing. This has happened.
- **Prefer checks that pin rules, not just values.** "No pure black or white",
  "no error colour is ever defined", "these two text colours never collapse into
  one" survive a redesign; a hardcoded hex does not.
- **Measure rather than assume.** If an asset has a property that matters
  — a frequency range, a file size, a contrast ratio — measure it in the
  session. Reading a filename is not verification.

---

## Part 2 — Scaffolding a new project

Do this **before** any product code.

### 2.1 Orient

- List the repo. Identify the monorepo tool, the apps, the packages.
- Find the design source. Work out how to turn it into readable per-screen
  files, and whether a script already exists.
- Run Pillar 5's checklist. Write down what works.
- Read whatever brief, blueprint or spec the owner has provided.

### 2.2 Ask the owner — one round, concrete options

Do not scaffold on assumptions. Ask these, together:

1. **The product in one paragraph, and its non-negotiables.** What are the three
   to five rules that must never be broken? These become the top of
   `START-HERE.md` and the seed of `systems/`.
2. **The design source.** Where is it, is it complete, and does it carry
   designer notes? If some screens are missing, which ones are authoritative?
3. **Scope and order.** What is the first slice? What is explicitly out?
4. **What "done" means.** Is there a device, a browser, a test suite? Who runs
   it? This determines which "Done when" clauses you can ever honestly tick.
5. **Constraints on the stack.** Anything already chosen, anything forbidden.
6. **How they want to be interrupted.** Some owners want a question the moment a
   conflict appears; some want you to take the recommended option and flag
   everything at the end. Ask which.

If the answer to 6 is "use your judgement": take the recommended option every
time, keep moving, and **collect every decision into one visible list at the
end.** Do not bury them in the changelog only.

### 2.3 Create the structure

```
designs/     raw + extracted + the extraction script
systems/     00-index, architecture, data, design-system, tone, 09-decisions
plans/       00-roadmap + one file per area, each a numbered todo list
progress/    00-START-HERE, 01-project, 04-changelog, AGENT-PROCESS
```

Add `plans/`, `systems/`, `progress/` and `designs/extracted/` to `.gitignore`
unless the owner wants them tracked.

**Add a line-endings policy on day one.** In a mixed Linux-sandbox and Windows
setup, its absence produces a diff of thousands of lines that changes nothing:

```gitattributes
* text=auto eol=lf
*.png binary
# ...every binary extension you will actually commit
```

### 2.4 Extract the designs, then build the token layer FROM them

In this order, and not the other order:

1. Run the extraction. Confirm you have one readable file per screen per theme.
2. **Read a representative sample end to end** — a list screen, a form screen, a
   full-bleed screen, in both themes. Note every distinct ground colour, surface,
   border, radius, control height and type size.
3. Build the token package from what you actually found. Expect more grounds
   than you assumed: a "background" and a "surface" is usually not enough. Real
   design sets tend to have several grounds, each with its own surface and
   border pair that only appears on top of it.
4. **Wire the tokens into the styling system and prove it is wired.** Write one
   component, run it, and confirm the colour on screen is your colour. See
   anti-pattern 1 below — this is the single most expensive thing to get wrong,
   because everything downstream will look self-consistent and be wrong.
5. Write the parity test from Pillar 6, and make it fail once.

### 2.5 Write the plans

Decompose into numbered plan files by area, each todo commit-sized. Give each a
branch name, dependencies, files touched, and a "Done when" that can be refused.

### 2.6 Write the first `START-HERE.md` and changelog entry

Use the templates in Part 5. Then stop and hand over, even if you have context
left — the first thing the owner should do is check the scaffold matches what
they had in mind.

---

## Part 3 — The per-session loop

### 1. Orient (cheap, bounded)

`progress/00-START-HERE.md` → the named plan file → the `systems/` sections it
points at → `git log --oneline | head -20` and status → **try the toolchain.**

Trying the toolchain is routinely skipped and routinely decisive. Discovering in
minute five that the test runner cannot run, or that the theme layer is not
wired up, changes the whole plan. Discovering it at the end wastes the session.

### 2. Budget, out loud

State what you think fits and in what order. Rough calibration:

| Work | Cost |
|---|---|
| A pure-logic module with real tests | small |
| One screen built properly from its design file | medium |
| A screen needing a new token, component variant and copy string | medium-large |
| A cross-cutting fix touching tokens, styles and several components | large |
| Auditing a handful of built screens against their designs | medium |
| **The handoff** | **always reserved — roughly the last fifth** |

**Order by "what is most valuable if I stop here", not by plan order.** If the
owner is away, that ordering is the decision you are asking them to trust.

When you are running low: say so, finish the current unit, hand over. Never
leave a half-written file. A stub with a `TODO` is worse than an absence,
because the next agent has to work out whether it is real.

### 3. Build

One todo at a time, against the design file and the "Done when". Comment the
*why*, especially where the obvious implementation is wrong. Cite decisions by
number.

### 4. Verify — and make the verification capable of failing

Run what runs. If the real test runner cannot run in your environment, **find
another way to actually execute the logic** rather than declaring it untested —
compile it and run assertions with whatever runtime you do have. Not as good as
the real suite; enormously better than nothing.

### 5. Audit the screens against the designs

**A separate, deliberate step. Do not skip it because you were careful.**

For each screen you built, open its design file in both themes and compare:
ground, surface, border, radii, control heights, type sizes, section gaps,
gradients, shadows. Write down what does not match.

In the project this came from, a session that had genuinely followed the designs
closely still had five real deviations — including a wrong background on the most
important screen. The audit only happened because the owner asked. **Ask
yourself.**

### 6. Record divergences in the plan files, before the changelog

`**Note (session N):**` under the todo it affects. What the spec said, what you
did, why, and whether the owner should be able to reverse it.

### 7. Write the handoff

Changelog entry first (reasoning, divergences, what is verified and what is not,
what you are unsure about), then rewrite `START-HERE.md`.

### 8. Emit the commit script, if you cannot commit

---

## Part 4 — Definition of done for a session

- [ ] Every screen built was compared to its design file, both themes
- [ ] Every divergence has a `Note (session N)` in its plan file
- [ ] Every new token exists in **both** places and the parity test covers it
- [ ] Every new user-facing string is in the localisation layer, not inline
- [ ] Typecheck and lint are clean, or the exact remaining errors are named in
      the changelog with the reason
- [ ] Any check you wrote has been made to fail once, deliberately
- [ ] Plan checkboxes carry a SHA, or a placeholder the script will fill
- [ ] Todos you could not honestly verify are **left unticked**, and said so
- [ ] `04-changelog.md` has a new top entry containing the reasoning
- [ ] `00-START-HERE.md` is rewritten and self-contained
- [ ] Any commit script is encoding-safe and re-runnable
- [ ] Judgement calls made in the owner's absence are in one visible list

---

## Part 5 — Templates

### `progress/00-START-HERE.md`

```markdown
# START HERE

You are picking up **<PROJECT>**, <one line>. This file is self-contained.

> Read `AGENT-WORKFLOW.md` first — that is *how* work is done here.
> This file is *what* to build next.

Last updated: end of session N.

## The rule that comes before everything else
Every screen you build, you build from its design file. <precedence ladder>
<the concrete failure that proves it, from this project>
<the registered exceptions, if any>

## Your task
<the next plan, and the order>
<the exact commands to run, in order>
<what is uncommitted, if anything>

## What <PROJECT> is, in five rules
<the non-negotiables>

## What is already built
<per area, and what "built" means for each — written, run, verified>

## Read this before you write a line
<the traps: what looks fine and is not>

## How to work here
<one todo one commit; change the plan first; update the changelog>

## Where things are
<table: path, what, tracked or not>

## Open items, in priority order

## The test
<the single question that overrides everything>
```

### A changelog entry

```markdown
## Session N

**<one-line summary of what this session was>**

### <area>
- what was built, grouped so it can be skimmed
- **the reasoning behind anything non-obvious**

### Divergences from the specs
<each one: what the spec said, what you did, why>

### What is verified and what is not
<precisely — "typechecks" is not "runs" is not "works">

### Next
<what the next agent should do first, and why that order>
```

### A commit script

Whatever your shell, it needs: a helper that commits one unit and writes the
SHA back into the plan file; a skip-if-nothing-staged guard; deletions handled
explicitly; and encoding safety. Copy the previous session's and edit.

---

## Part 6 — Anti-patterns, with their real cases

Every one of these shipped. They share a shape: **a layer that agreed with
itself while disagreeing with reality, and no check spanning the gap.**

| Anti-pattern | Real case | The check that would have caught it |
|---|---|---|
| **Config written for the wrong major version** | A Tailwind v3 JS preset in a v4 CSS-first project. Nothing imported it; the app rendered in the library's stock palette for three sessions while the tokens described something else. | Render one component and look at it. Then a parity test. |
| **Building from tokens instead of designs** | A ground colour used on five screens was missing from both the tokens and the census. Everything downstream agreed. | Open the design file per screen. |
| **Assuming two similar things are the same thing** | A card and a quiet button look like the same material. They were not, on nine screens. | The same. |
| **Simplifying a fill** | A three-stop gradient with a coloured glow shipped as a flat colour. Plausible in code, dead on screen. | The same. |
| **Intersecting your props onto a library's** | A `variant` union narrowed to the overlap, making a value a type error at eight call sites — unnoticed, because the app had never been typechecked. | Typecheck early, not at the end. |
| **Assuming the platform synthesises something** | Font weights are not synthesised for custom families; the wrong face renders silently. | Verify on device, or encode the choice so it cannot be got wrong. |
| **Trusting a filename over the file** | An audio asset's fundamental was ~31 Hz — inaudible on the target hardware. | Measure it. |
| **A spec that contradicts itself** | A doc's own command used loudness normalisation where the doc's prose asked for peak. | Read both, pick one, record the divergence. |
| **A format that fails silently** | A duplicate key in a JSON manifest. Parsers keep the last one and never warn. | Parse and count after editing. |
| **A test that cannot fail** | A validation pattern was over-escaped and matched nothing, so it passed forever. | Tamper with the input once. |

---

## Part 7 — The overriding test

Every project should have one sentence that beats every other consideration.
Write it with the owner during scaffolding and put it at the bottom of
`START-HERE.md`.

It should name the **worst realistic moment** for the person using the product,
and ask whether what you built helps then. Make it specific enough to actually
decide arguments — a generic "is this good UX?" decides nothing.
