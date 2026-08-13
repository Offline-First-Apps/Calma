# commit-session-12.ps1
#
# Session 12 - plan 07, the panic path.
#
# ASCII ONLY. Windows PowerShell 5.1 reads a script as ANSI unless it has a
# BOM, so a single em dash in a here-string lands in the repo doubly encoded.
# Verify before editing:
#   python -c "print(sum(1 for b in open('progress/commit-session-12.ps1','rb').read() if b>127))"
#
# Safe to re-run: every step skips when there is nothing staged.
#
# Run from the repository root:
#   powershell -ExecutionPolicy Bypass -File progress\commit-session-12.ps1

$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.git')) {
  Write-Error 'Run this from the repository root (no .git here).'
}

$script:shas = @{}

function Commit-Todo {
  param(
    [Parameter(Mandatory = $true)][string]   $Todo,
    [Parameter(Mandatory = $true)][string[]] $Paths,
    [Parameter(Mandatory = $true)][string]   $Message
  )

  $existing = @($Paths | Where-Object { Test-Path $_ })
  if ($existing.Count -eq 0) {
    Write-Host "SKIP $Todo - none of its paths exist" -ForegroundColor DarkYellow
    return
  }

  git add -- $existing

  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host "SKIP $Todo - nothing staged (already committed?)" -ForegroundColor DarkGray
    return
  }

  git commit -m $Message | Out-Null
  $sha = (git rev-parse --short HEAD).Trim()
  $script:shas[$Todo] = $sha
  Write-Host "OK   $Todo  $sha" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# The tokens come first. Every screen below stands on them, and a screen
# committed before its ground is a commit that renders wrong at that SHA.
# ---------------------------------------------------------------------------

Commit-Todo -Todo 'T00' -Paths @(
  'packages/tokens/src/colors.ts',
  'packages/tokens/src/tailwind.ts',
  'apps/native/global.css'
) -Message @'
feat(tokens): add the panic path's own grounds

The panic screens were rendering on --immersive (#F2E7D6 light). e2's
design file is #EADCC6 and its caption says "even in light mode this is
the dimmest surface in the app" - the ground drops two further steps for
the panic session. Two dim warm sands that are not the same dim warm
sand, which is why it read as correct for four sessions.

Adds two grounds and their pairs, in colors.ts, global.css and the name
map together so theme-parity.test.ts spans all three:

  --panic                 #EADCC6 / #0D141C   e2, e3
  --panic-foreground      #33291C / #DDD3C6   the opening line
  --surface-panic-exit    rgba(51,41,28,.07) / rgba(221,211,198,.07)
  --border-panic-exit     rgba(51,41,28,.18) / rgba(221,211,198,.2)
  --panic-exit-foreground #3A2E1F / #D6CCBE
  --ending                #FBF3E6 / #18212B   e4
  --surface-ending        #F1E7D6 / #212C39   e4's two buttons
  --border-ending         #E5D6BE / #2E3B4A

--surface-ending is warmer than --surface-quiet (#EFE5D8), not equal to
it. A button standing on the ending ground is not the same material as a
button standing on --background: the same card-vs-button distinction
that has now been rediscovered three sessions running.
'@

# ---------------------------------------------------------------------------
# T05 and T06 are the two rule violations. They share one commit because they
# share one cause: the panic path was a flag on a screen whose job is asking
# questions. Splitting them would fabricate an intermediate state in which the
# panic session had an instant exit but still ended on a journaling offer, and
# that state never existed.
# ---------------------------------------------------------------------------

Commit-Todo -Todo 'T02+T04+T05' -Paths @(
  'apps/native/src/features/breathing/PanicSession.tsx',
  'apps/native/src/features/breathing/SessionScreen.tsx',
  'apps/native/app/panic.tsx',
  'packages/i18n/src/locales/en/breathing.json'
) -Message @'
feat(panic): give the panic session its own screen

Splits the panic path out of SessionScreen, where it had inherited three
violations of the contract it exists to keep (D-006, plan 07):

  1. "I'm okay" called setConfirmingStop(true). Someone in a panic
     attack tapped the way out and was asked whether they meant it.
     T05: "exits immediately with no confirmation". e3's caption:
     "never delayed, never asking to confirm".
  2. Finishing ran stage 'feeling' -> FeelingPicker -> and, depending on
     shouldOfferJournaling, a journaling offer. T06 and e4's caption
     forbid the feeling check, the offer and the paywall on this path.
  3. It rendered on --immersive rather than the panic ground.

None of those were written on purpose. They arrived one `if (panic)` at
a time from a screen built to ask questions, and the panic path is
defined by not asking any. A shared component with an exception flag
keeps growing the exception; a separate component cannot express the
idea of a feeling check at all, which is the only version of this rule
that survives someone adding a stage to SessionScreen next year.

SessionScreen's `panic` prop is removed rather than deprecated, and the
comment where it used to be says why.

Also T04: the opening line now fades in over 900ms, holds 4s, and fades
out over 1.4s, leaving only the orb. Under Reduce Motion it appears and
goes without the fades - shortened, not removed. Someone who asked for
less motion did not ask for less help.

The exit is idempotent: a double-tap must not write two session records.
The partial session is still recorded with completed: false, because a
minute someone spent breathing happened whether they finished it or not.
'@

Commit-Todo -Todo 'T06' -Paths @(
  'apps/native/src/features/breathing/PanicEnding.tsx'
) -Message @'
feat(panic): build the panic ending (e4)

"Light coming back up in a room, slowly, from above." A 128px orb at
half opacity, one serif line, and two identical targets - "A bit longer"
and "Home", neither favoured, no amber. Amber here would read as a
recommendation and there is no right answer to recommend.

No feeling check, no SUDS, no journaling offer, no streak, no stat, no
paywall, no share, no rating prompt. Its own component with two buttons
and no stage machine, so there is nowhere for any of those to be added
without deleting the comment that forbids them first.

The light from above is an SVG radial gradient rather than a view with a
shadow: it is 380px tall and fades to nothing by 74%, which no shadow
can do.
'@

Commit-Todo -Todo 'T01+T03+T07' -Paths @(
  'apps/native/src/components/PanicFab.tsx'
) -Message @'
fix(panic): acknowledge the tap on the frame it happened

The FAB fired on onPress and did nothing but navigate; the drum and the
Heavy haptic fired in an effect inside the panic route, after mount. The
acknowledgement was therefore the result of the navigation, which T07
says it must never be, and there was no double-fire guard at all.

Now: onPressIn fires the haptic, the drum and e1's rings on the same
frame as the finger, before the route is asked for. A second press
within 600ms is swallowed - not for tidiness, but because a person
mid-panic-attack who sees no immediate change taps again, which without
the guard pushes a second /panic, restarts the breath from zero and
leaves behind a session record nobody breathed (review R1).

Adds e1's two rings: concentric with the button at 136/72 and 200/72,
expressed as ratios so they stay right if control.panicFab moves. They
are pointerEvents="none" so an expanding ring can never eat the second
tap it was drawn for.
'@

Write-Host ''
Write-Host 'Commits made:' -ForegroundColor Cyan
$script:shas.GetEnumerator() | Sort-Object Name | ForEach-Object {
  Write-Host ("  {0,-12} {1}" -f $_.Key, $_.Value)
}

Write-Host ''
Write-Host 'Now write these SHAs into plans/07-panic-button.md.' -ForegroundColor Cyan
Write-Host 'T08 stays UNTICKED - it needs a device on both platforms.' -ForegroundColor Yellow
Write-Host ''
Write-Host 'Then, before anything else:' -ForegroundColor Cyan
Write-Host '  pnpm check-types'
Write-Host '  pnpm test          # still never executed, 12 sessions in'
Write-Host '  pnpm --filter native android'
