# Session 8 -- plan 05, the app shell.
# ASCII only. See the note in commit-session-7.ps1 for why.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\kinzi\Desktop\projects\calma'
Set-Location $repo

function Assert-Ok($what) {
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

function Commit-Todo {
  param([string]$Plan, [string]$Tag, [string]$Message, [string[]]$Paths)

  git add -A -- $Paths
  Assert-Ok "git add for $Tag"

  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, ($Message -replace "`r`n", "`n"))
  git commit -q -F $tmp
  Assert-Ok "git commit for $Tag"
  Remove-Item $tmp -Force

  $sha = (git rev-parse --short HEAD).Trim()
  $file = Join-Path $repo "plans\$Plan"
  $body = [System.IO.File]::ReadAllText($file) -replace "pending-$Tag", $sha
  [System.IO.File]::WriteAllText($file, $body)

  Write-Host "  $Tag  $sha" -ForegroundColor Green
}

Remove-Item -Force -ErrorAction SilentlyContinue '.git\index.lock'
Remove-Item -Force -ErrorAction SilentlyContinue '.git\HEAD.lock'
git reset -q

# --- 0. line endings ----------------------------------------------------
# Do this first, alone. Otherwise it contaminates every diff below.
git add -- '.gitattributes'
git add --renormalize .
$tmp = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tmp, @'
chore: normalise line endings

Files committed from the Linux sandbox came back as modified the moment a
Windows editor touched them -- a six thousand line diff that changed nothing.
LF in the repository, whatever the checkout looks like.
'@ -replace "`r`n", "`n")
git commit -q -F $tmp
Assert-Ok 'commit gitattributes'
Remove-Item $tmp -Force

# --- 1. plan 05 ---------------------------------------------------------
git checkout -q -b feat/app-shell
Assert-Ok 'checkout -b feat/app-shell'

# The starter's drawer navigation goes. It was scaffolding.
git rm -r -q --ignore-unmatch 'apps/native/app/(drawer)' 'apps/native/app/modal.tsx'

Commit-Todo '05-app-shell.md' 'T01' @'
feat(nav): add boot gate with splash retention

Storage, migrations, hydration and language resolution, in that order, all
behind the splash. Nothing waits on the network: someone opening this app in a
tunnel is exactly the person who needs it to open.

Migrations that move the version trigger an index repair. Indexes are derived
data, so rebuilding them after a schema change costs a key scan and removes a
whole class of upgrade bug.

Fonts come from @expo-google-fonts rather than checked-in binaries. The two
typefaces are the design, and a flash of system serif on the welcome screen is
the first impression of an app whose pitch is that it feels different.

Replaces the starter's drawer navigation.

Plan: plans/05-app-shell.md#T01
'@ @(
  'apps/native/app/_layout.tsx',
  'apps/native/app/(drawer)',
  'apps/native/app/modal.tsx',
  'apps/native/src/lib/boot.ts',
  'apps/native/src/lib/repositories.tsx',
  'apps/native/src/stores/prefs.ts',
  'apps/native/package.json'
)

Commit-Todo '05-app-shell.md' 'T02' @'
feat(nav): add degraded boot state for storage failure

Some Android configurations have no Keystore to hold an encryption key -- a
phone with no passcode, most often. Boot degrades to an in-memory store rather
than failing.

The screen does not name the error, and does not offer a retry that would only
fail again. It does keep a route to breathing, because someone who opened
Calma at 3am does not care why saving is broken.

Plan: plans/05-app-shell.md#T02
'@ @('apps/native/src/components/BootError.tsx')

Commit-Todo '05-app-shell.md' 'T03' @'
feat(nav): add five-tab layout

Write is a tab, not an offer that appears after a bad breathing session
(D-015). Reaching journaling only through "that did not work" made it
structurally the consolation prize; for some people it is the main tool.

Labels are single words because five of them have to fit at 200% font scale,
and the rule is that the label gets shorter before the scaling gets capped.

Plan: plans/05-app-shell.md#T03
'@ @(
  'apps/native/app/(tabs)',
  'packages/i18n/src/locales/en/common.json'
)

Commit-Todo '05-app-shell.md' 'T04' @'
feat(nav): configure full-screen presentation routes

Panic, session, worry window and onboarding take the whole screen with no tab
bar and no FAB. The paywall is a sheet: a paywall is not a place you arrive
at, it is something that appears after an action was attempted.

Plan: plans/05-app-shell.md#T04
'@ @(
  'apps/native/app/panic.tsx',
  'apps/native/app/session',
  'apps/native/app/worry-window.tsx',
  'apps/native/app/onboarding.tsx',
  'apps/native/app/paywall.tsx'
)

Commit-Todo '05-app-shell.md' 'T05' @'
feat(panic): add floating panic button component

It breathes at rest on the orb's eleven-second cycle at a much smaller
amplitude -- enough to read as alive in peripheral vision without asking for
attention. A perfectly still button on a screen about anxiety looks like a
warning light.

Its accessibility label is "Breathe", never "panic". That is not a word to say
to someone having one.

PANIC_FAB_CLEARANCE is exported so no list can hide its last row underneath.

Plan: plans/05-app-shell.md#T05
'@ @(
  'apps/native/src/components/PanicFab.tsx',
  'packages/i18n/src/locales/en/breathing.json'
)

Commit-Todo '05-app-shell.md' 'T06' @'
feat(panic): mount panic button as persistent overlay

Mounted as a sibling of the navigator rather than inside any screen, so it
survives tab switches without remounting -- a remount would restart the
ambient pulse mid-cycle, which is visible.

Plan: plans/05-app-shell.md#T06
'@ @('apps/native/app/(tabs)/_layout.tsx')

Commit-Todo '05-app-shell.md' 'T07' @'
feat(nav): add screen transition motion respecting reduce motion

280ms, easing out, nothing bounces. Calma's metronome is the orb's eleven
second breath; a screen that springs into place belongs to a different app.

Under Reduce Motion everything collapses to a cross-fade. Breath timing is
never reduced -- the guidance has to stay usable, and that is the one thing
the app is for.

Plan: plans/05-app-shell.md#T07
'@ @('apps/native/src/lib/motion.ts')

Commit-Todo '05-app-shell.md' 'T08' @'
feat(nav): build home screen

One obvious next thing and as little else as possible. Someone opening Calma
is usually not browsing.

When there is nothing to report, it reports nothing -- no zeroed count, no
empty chart, no "0 worries waiting". A dashboard of noughts is a list of
things you have not done, which is the one thing this app promised never to
do.

Plan: plans/05-app-shell.md#T08
'@ @(
  'apps/native/src/features/home/HomeScreen.tsx',
  'apps/native/app/(tabs)/index.tsx'
)

Commit-Todo '05-app-shell.md' 'T09' @'
feat(nav): handle app state changes and orphaned sessions

An orphaned active-session record is discarded in silence on cold boot.
Someone whose phone died mid-session is not greeted with "you abandoned a
session" -- there is nothing to apologise for and nothing to resume into.

Foregrounding re-resolves the language, because "system" is a live binding and
the phone can change language while we are backgrounded.

No re-engagement anything. No "welcome back".

Plan: plans/05-app-shell.md#T09
'@ @('apps/native/src/lib/appState.ts')

git checkout -q main
git merge --no-ff -m "Merge branch 'feat/app-shell'" feat/app-shell
Assert-Ok 'merge feat/app-shell'

Write-Host ''
Write-Host 'Now: pnpm install; pnpm check-types; pnpm test; pnpm lint' -ForegroundColor Yellow
Write-Host 'Then: pnpm dev:native -- and expect to fix things. None of this has run.' -ForegroundColor Yellow
git log --oneline -12
