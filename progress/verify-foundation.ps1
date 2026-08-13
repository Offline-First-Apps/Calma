# Plan 01 — install, verify, lock, merge.
#
# Run this after commit-foundation.ps1. It is the half that needs a machine
# with registry access, which the sandbox did not have: the new dependencies
# have never actually been installed, so treat the first step as the real test.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\kinzi\Desktop\projects\calma'
Set-Location $repo

function Assert-Ok($what) {
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

# --- 1. install ----------------------------------------------------------
# New this session: vitest, eslint, @typescript-eslint/parser, and the
# @calma/tokens links in both apps. The versions are unverified against this
# repo's TypeScript 6 / React 19 stack — if the resolver objects, adjust the
# range and re-run rather than pinning something older by reflex.
Write-Host 'Installing...' -ForegroundColor Cyan
pnpm install
Assert-Ok 'pnpm install'

# --- 2. types ------------------------------------------------------------
Write-Host 'Checking types...' -ForegroundColor Cyan
pnpm check-types
Assert-Ok 'pnpm check-types'

# --- 3. tests ------------------------------------------------------------
# 83 tests. They passed under plain Node in the sandbox; this confirms them
# under Vitest, which is what T09 actually claims.
Write-Host 'Running tests...' -ForegroundColor Cyan
pnpm test
Assert-Ok 'pnpm test'

# --- 4. lint -------------------------------------------------------------
Write-Host 'Linting...' -ForegroundColor Cyan
pnpm lint
Assert-Ok 'pnpm lint'

# --- 5. prove the boundary actually bites --------------------------------
# T08 is only done when a deliberate violation is confirmed to fail. A rule
# that has never rejected anything is a rule you are trusting on faith.
Write-Host 'Probing the import boundary...' -ForegroundColor Cyan

$probe = Join-Path $repo 'packages\domain\src\boundary-probe.ts'
[System.IO.File]::WriteAllText($probe, "import 'react-native-mmkv';`nimport 'react-native';`nexport {};`n")

pnpm exec eslint 'packages/domain/src/boundary-probe.ts'
$probeExit = $LASTEXITCODE
Remove-Item $probe -Force

if ($probeExit -eq 0) {
  throw 'The boundary rule did NOT reject react-native-mmkv inside packages/domain. T08 is not done.'
}
Write-Host '  rejected, as it should be' -ForegroundColor Green

# --- 6. commit the lockfile ---------------------------------------------
# Its own commit rather than folded into a todo: several todos added
# dependencies, and one lockfile cannot honestly belong to all of them.
$status = git status --porcelain -- pnpm-lock.yaml
if ($status) {
  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, @'
chore(deps): lock vitest, eslint and the tokens links

Plan: plans/01-foundation.md
'@ -replace "`r`n", "`n")
  git add -- pnpm-lock.yaml
  git commit -q -F $tmp
  Assert-Ok 'git commit lockfile'
  Remove-Item $tmp -Force
  Write-Host '  lockfile committed' -ForegroundColor Green
}

# --- 7. merge ------------------------------------------------------------
# --no-ff so plan 01's todo sequence stays legible as a group in the history.
Write-Host 'Merging into main...' -ForegroundColor Cyan
git checkout -q main
Assert-Ok 'git checkout main'
git merge --no-ff -m 'Merge branch ''chore/foundation''' chore/foundation
Assert-Ok 'git merge'

Write-Host ''
Write-Host 'Plan 01 is closed.' -ForegroundColor Green
git log --oneline -12
