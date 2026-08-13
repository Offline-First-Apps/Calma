# Plan 01 — foundation. Replays session 6's work as one commit per todo.
#
# Everything is already written to disk; this only stages, commits, and ticks
# the plan-file checkboxes with each short SHA. Run it from anywhere.
#
# Two files (the root and domain package.json) are touched by more than one
# todo, so the script rewrites them to their intermediate state before the
# earlier commit. That is why the here-strings below exist.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\kinzi\Desktop\projects\calma'
Set-Location $repo

function Assert-Ok($what) {
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

function Write-Utf8($path, $text) {
  $full = Join-Path $repo $path
  [System.IO.File]::WriteAllText($full, ($text -replace "`r`n", "`n"))
}

function Commit-Todo {
  param([string]$Tag, [string]$Message, [string[]]$Paths)

  git add -- $Paths
  Assert-Ok "git add for $Tag"

  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, ($Message -replace "`r`n", "`n"))
  git commit -q -F $tmp
  Assert-Ok "git commit for $Tag"
  Remove-Item $tmp -Force

  $sha = (git rev-parse --short HEAD).Trim()
  $plan = Join-Path $repo 'plans\01-foundation.md'
  $body = [System.IO.File]::ReadAllText($plan) -replace "pending-$Tag", $sha
  [System.IO.File]::WriteAllText($plan, $body)

  Write-Host "  $Tag  $sha" -ForegroundColor Green
}

# --- 0. clear the lock files the sandbox stranded ------------------------
Write-Host 'Clearing stale git locks...' -ForegroundColor Cyan
Remove-Item -Force -ErrorAction SilentlyContinue '.git\index.lock'
Remove-Item -Force -ErrorAction SilentlyContinue '.git\HEAD.lock'
Remove-Item -Force -ErrorAction SilentlyContinue '.git\objects\maintenance.lock'
Get-ChildItem '.git\objects' -Recurse -Filter 'tmp_obj_*' -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

# Background maintenance is what stranded them. Turn it off for this repo.
git config gc.auto 0
git config maintenance.auto false

# Nothing should be staged going in; the working tree is left alone.
git reset -q

# --- 1. branch -----------------------------------------------------------
git checkout -q -b chore/foundation
Assert-Ok 'git checkout -b chore/foundation'

$header = @'
/**
 * @calma/domain — pure, dependency-free logic.
 *
 * Everything Calma knows how to *reason* about lives here: entities and their
 * schemas, tier rules, breathing pattern maths, day and week keys.
 *
 * The package's only dependency is zod. It must never import React, React
 * Native, MMKV, or anything else platform-bound — that is what makes all of
 * this testable in Node with no simulator. The boundary is enforced by lint
 * (plans/01-foundation.md#T08), not by good intentions.
 *
 * See systems/01-architecture.md § Package boundaries.
 */

'@

# --- T01 -----------------------------------------------------------------
Write-Host 'Committing plan 01...' -ForegroundColor Cyan

Write-Utf8 'packages\domain\package.json' @'
{
  "name": "@calma/domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "@calma/config": "workspace:*",
    "typescript": "^6.0.3"
  }
}
'@

Write-Utf8 'packages\domain\src\index.ts' ($header + "export {};`n")

Commit-Todo 'T01' @'
chore(domain): scaffold dependency-free domain package

Tier rules, streak maths, ISO week keys and breathing pattern timing are all
pure functions. Isolating them in a package that cannot import React, React
Native or MMKV means they stay unit-testable in Node with no simulator, and
makes the boundary a build error rather than a code-review note.

`types: []` in the tsconfig is deliberate: even Node globals are out of scope
for this package.

Plan: plans/01-foundation.md#T01
'@ @(
  'packages/domain/package.json',
  'packages/domain/tsconfig.json',
  'packages/domain/src/index.ts'
)

# --- T02 -----------------------------------------------------------------
Write-Utf8 'packages\domain\src\index.ts' ($header + "export * from './entities';`n")

Commit-Todo 'T02' @'
feat(domain): add entity types and zod schemas

The four entities from systems/02-data-layer.md, each with a schema, because
records are validated on read: one corrupt journal entry must drop out of a
collection rather than take down the Progress tab.

Journal text fields accept the empty string. A draft is saved as someone
types, and half a thought is still worth keeping — validation here is about
shape, never about whether the form was filled in properly.

`defaultPrefs` lives with the schema so first launch and a factory reset
cannot drift apart. The worry window defaults to 19:00: late enough to have
collected the day, early enough not to hand someone their worries at bedtime.

Plan: plans/01-foundation.md#T02
'@ @(
  'packages/domain/src/entities',
  'packages/domain/src/index.ts'
)

# --- T03 -----------------------------------------------------------------
Write-Utf8 'packages\domain\src\index.ts' ($header + "export * from './entities';`nexport * from './time';`n")

Commit-Todo 'T03' @'
feat(domain): add local day and ISO week key utilities

Keys are built from local calendar fields, never from epoch arithmetic. Twice
a year a day is 23 or 25 hours long, and someone who breathes at 00:30 on the
night the clocks change has still done it today; dividing a timestamp by
86,400,000 quietly disagrees.

Week arithmetic projects the local date onto UTC midnight first, so the
Thursday rule can be applied in whole days with no offset creeping in. Tests
cover both DST transitions in both hemispheres, the 29 December / 4 January
boundary, and 2026 — a 53-week year, which is where off-by-one bugs live.

Plan: plans/01-foundation.md#T03
'@ @(
  'packages/domain/src/time.ts',
  'packages/domain/src/time.test.ts',
  'packages/domain/src/index.ts'
)

# --- T04 -----------------------------------------------------------------
Write-Utf8 'packages\domain\src\index.ts' ($header + "export * from './entities';`nexport * from './id';`nexport * from './time';`n")

Commit-Todo 'T04' @'
feat(domain): add sortable ulid-style id generator

48 bits of timestamp then 80 bits of randomness, Crockford base32. Sorting
ids is therefore chronological for free, which is what lets the pending-worry
and day indexes stay plain string arrays with no secondary time index.

Within a millisecond the random block is incremented rather than redrawn, so
uniqueness does not depend on luck — a degenerate random source still cannot
produce a collision, and two worries typed in the same frame read back in the
order they were typed.

The clock is clamped forwards. An NTP correction or a manual time change must
not reorder someone's history; the record's own `createdAt` remains the truth
about when something happened.

Randomness is injected rather than imported because this package may not
depend on anything platform-bound.

Plan: plans/01-foundation.md#T04
'@ @(
  'packages/domain/src/id.ts',
  'packages/domain/src/id.test.ts',
  'packages/domain/src/index.ts'
)

# --- T05 -----------------------------------------------------------------
Write-Utf8 'packages\domain\src\index.ts' ($header + "export * from './entities';`nexport * from './id';`nexport * from './tier';`nexport * from './time';`n")

Commit-Todo 'T05' @'
feat(domain): add tier limit rules

Panic, paced breathing and the sigh are absent from this file entirely —
there is nothing to count, and that is the point.

Counting lives here rather than in the repository so that "today" and "this
week" have exactly one definition. Remaining allowances clamp at zero: a
lapsed Plus subscriber who captured ten worries this morning is at their
limit, not seven in debt, and an allowance already granted is never revoked.

`resolveWorryWindowMinutes` handles the same lapse for a stored 20- or
30-minute window — a quiet fallback rather than an invalid-state error.

Nothing here decides what the interface does at a limit. Reaching one is never
a disabled button; the action is attempted and a gentle card follows.

Plan: plans/01-foundation.md#T05
'@ @(
  'packages/domain/src/tier.ts',
  'packages/domain/src/tier.test.ts',
  'packages/domain/src/index.ts'
)

# --- T06 -----------------------------------------------------------------
Write-Utf8 'packages\domain\src\index.ts' ($header + "export * from './entities';`nexport * from './breathing';`nexport * from './id';`nexport * from './tier';`nexport * from './time';`n")

Commit-Todo 'T06' @'
feat(domain): add breathing pattern definitions

Patterns are sequences of timed phases rather than a fixed four-tuple, because
the physiological sigh does not fit one: it needs a second, shorter inhale and
the 180ms micro-hold that makes the two read as distinct sips of air rather
than one wobbly breath.

Absent phases are omitted rather than stored as zero, so a phase machine never
has to special-case a zero-length hold. 4-7-8 has no empty hold at all.

`cyclesForDuration` rounds down with a floor of one. Overrunning a length
someone agreed to is worse than finishing a few seconds early, and stopping
mid-exhale is worse than either.

Custom ratios return which bound they crossed rather than a bare boolean, so
the builder can say what is wrong instead of just refusing.

This file is about time only. The orb's scale ramp and easing belong to the
design system; the pulses belong to the haptics map.

Plan: plans/01-foundation.md#T06
'@ @(
  'packages/domain/src/breathing.ts',
  'packages/domain/src/breathing.test.ts',
  'packages/domain/src/index.ts'
)

# --- T07 -----------------------------------------------------------------
Commit-Todo 'T07' @'
chore(tokens): make the token package resolvable from both apps

The package itself was built ahead of order in session 4, but neither app
declared it, so `@calma/tokens` was not actually resolvable from either — the
half of this todo that was still outstanding.

Plan: plans/01-foundation.md#T07
'@ @(
  'apps/native/package.json',
  'apps/web/package.json'
)

# --- T08 -----------------------------------------------------------------
Write-Utf8 'package.json' @'
{
  "name": "calma",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "type": "module",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "check-types": "turbo run check-types",
    "lint": "eslint .",
    "dev:native": "turbo run dev -F native",
    "dev:web": "turbo run dev -F web"
  },
  "dependencies": {
    "@calma/env": "workspace:*",
    "dotenv": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@calma/config": "workspace:*",
    "@types/node": "^22.20.1",
    "eslint": "^9.39.0",
    "turbo": "^2.10.7",
    "typescript": "^6.0.3"
  },
  "packageManager": "pnpm@11.4.0"
}
'@

Commit-Todo 'T08' @'
chore(config): enforce package import boundaries

Two rules in systems/01-architecture.md are load-bearing enough that a code
review is not a good enough place for them: only packages/db may touch MMKV,
and packages/domain may not import anything platform-bound.

Boundaries are checked from the repo root rather than per package, because the
rules are about the relationships between packages — a per-package run cannot
see that packages/db is the one place MMKV is allowed.

No type-aware linting: an import statement is syntax, and the project service
is not worth the startup cost for this.

Plan: plans/01-foundation.md#T08
'@ @(
  'packages/config/package.json',
  'packages/config/eslint/base.js',
  'eslint.config.js',
  'package.json'
)

# --- T09 -----------------------------------------------------------------
Write-Utf8 'package.json' @'
{
  "name": "calma",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "type": "module",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "check-types": "turbo run check-types",
    "lint": "eslint .",
    "test": "turbo run test",
    "dev:native": "turbo run dev -F native",
    "dev:web": "turbo run dev -F web"
  },
  "dependencies": {
    "@calma/env": "workspace:*",
    "dotenv": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@calma/config": "workspace:*",
    "@types/node": "^22.20.1",
    "eslint": "^9.39.0",
    "turbo": "^2.10.7",
    "typescript": "^6.0.3"
  },
  "packageManager": "pnpm@11.4.0"
}
'@

Write-Utf8 'packages\domain\package.json' @'
{
  "name": "@calma/domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "catalog:"
  },
  "devDependencies": {
    "@calma/config": "workspace:*",
    "typescript": "^6.0.3",
    "vitest": "^3.2.4"
  }
}
'@

Commit-Todo 'T09' @'
chore(domain): add vitest and wire test task into turbo

Domain tests are pure Node — no simulator, no jsdom, no React. If a test in
this package ever needs one of those, something has leaked across the package
boundary and the fix belongs in the source, not in the test config.

Plan: plans/01-foundation.md#T09
'@ @(
  'packages/domain/vitest.config.ts',
  'packages/domain/package.json',
  'turbo.json',
  'package.json'
)

Write-Host ''
Write-Host 'All nine todos committed.' -ForegroundColor Green
git log --oneline -10
