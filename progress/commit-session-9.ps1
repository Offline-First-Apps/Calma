# Session 9 -- the breathing engine (plan 06), audio and haptics (plan 04),
# and the theme fix that plan 06 turned out to be sitting on.
#
# ASCII ONLY. Windows PowerShell 5.1 reads a .ps1 as ANSI unless it has a BOM,
# so a single em dash in a here-string lands in the repo doubly encoded. This
# has already happened once (see session 7).

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\kinzi\Desktop\projects\calma'
Set-Location $repo

function Assert-Ok($what) {
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

# Commits one unit of work and writes the resulting short SHA into the plan
# file, replacing every `pending-TXX` placeholder listed in -Tags.
#
# Several todos share a commit this session. That is not sloppiness: the code
# was written in full before any of it could be committed (the sandbox cannot
# run git), and some todos are different requirements on the SAME file --
# T02, T03 and T08 of plan 06 are all "the orb", written once. Splitting them
# after the fact would mean fabricating intermediate states that never
# existed, which is worse than an honest shared SHA. Precedent: plan 18 T11.
function Commit-Todo {
  param(
    [string]   $Plan,
    [string[]] $Tags,
    [string]   $Message,
    [string[]] $Paths
  )

  git add -A -- $Paths
  Assert-Ok "git add for $($Tags -join ',')"

  # Nothing staged means nothing changed. Say so rather than failing.
  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  $($Tags -join ',')  (nothing to commit)" -ForegroundColor DarkYellow
    return
  }

  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, ($Message -replace "`r`n", "`n"))
  git commit -q -F $tmp
  Assert-Ok "git commit for $($Tags -join ',')"
  Remove-Item $tmp -Force

  $sha = (git rev-parse --short HEAD).Trim()

  if ($Plan) {
    $file = Join-Path $repo "plans\$Plan"
    $body = [System.IO.File]::ReadAllText($file)
    foreach ($tag in $Tags) { $body = $body -replace "pending-$tag", $sha }
    [System.IO.File]::WriteAllText($file, $body)
  }

  Write-Host "  $($Tags -join ',')  $sha" -ForegroundColor Green
}

Remove-Item -Force -ErrorAction SilentlyContinue '.git\index.lock'
Remove-Item -Force -ErrorAction SilentlyContinue '.git\HEAD.lock'
git reset -q

Write-Host ''
Write-Host 'Fixes first' -ForegroundColor Cyan

# --- fix(nav) -----------------------------------------------------------
Commit-Todo -Plan '' -Tags @('fix-theme') -Paths @(
  'apps/native/global.css',
  'packages/tokens/src/tailwind.ts',
  'packages/tokens/src/theme-parity.test.ts',
  'packages/tokens/package.json',
  'apps/native/src/ui/Text.tsx',
  'apps/native/src/ui/Screen.tsx',
  'apps/native/app/(tabs)/_layout.tsx'
) -Message @'
fix(nav): wire the design tokens into the uniwind theme

packages/tokens/src/tailwind.ts exported calmaPreset, a Tailwind v3
theme.extend object. Uniwind runs Tailwind v4, which is CSS-first and never
loads a JS config, so nothing imported it and nothing ever had.

Every semantic class in the app -- bg-accent, text-foreground, h-button --
was therefore resolving against heroui-native's stock palette, or against
nothing where heroui has no such name. The app would have rendered as a
blue-on-grey component library demo while the tokens described a warm,
lamp-lit room.

The theme is now real CSS in apps/native/global.css. It overrides heroui's
bare custom properties per theme, which restyles heroui's own internals too,
and adds the Calma-only names on top. tailwind.ts becomes the token to
variable name map, and theme-parity.test.ts reads the stylesheet and fails if
a single hex drifts -- two copies of one truth is the arrangement that rots,
and this is the test that would have caught it three sessions ago. It also
pins the rules that outlive any visual revision: no pure black or white, no
danger colour, amber quieter in dark mode, and dark mode's warm serif colour
never collapsing into the cool sans one.

Two more things that were silently wrong:

- (tabs)/_layout.tsx asked for useThemeColor('mutedForeground'), which is not
  a heroui colour name. It resolved to undefined, so all four inactive tabs
  were tinted by a React Navigation default.

- Weight was selected as `font-sans font-medium`. expo-font registers each
  face under its own family and neither platform synthesises weights, so that
  renders regular on iOS and can fall back to Roboto on Android, with no
  error anywhere. Weight is now part of the family name (font-sans-medium),
  which cannot be got wrong.
'@

Commit-Todo -Plan '' -Tags @('fix-button') -Paths @(
  'apps/native/src/ui/Button.tsx'
) -Message @'
fix(ui): rebuild Button on Pressable so the quiet variant compiles

Button's props were ComponentProps<typeof HeroButton> & { variant }.
heroui-native declares a `variant` of its own, so the intersection narrowed
ours to the overlap -- 'primary' | 'secondary'. That made variant="quiet" a
type error at all eight of its call sites, and quiet is the variant behind
every "Not now", "Skip" and "I'm done" in the product.

Omitting `variant` did not help: ButtonRootProps is a discriminated union
keyed on feedbackVariant, and removing a member breaks the discrimination.

Dropping to Pressable removes the conflict instead of working around it, and
costs nothing. Every visual property was already overridden by className, and
heroui's scale-and-ripple press feedback is forbidden by the motion rules
regardless: no bounce, no overshoot, no elastic.
'@

Commit-Todo -Plan '' -Tags @('fix-i18n') -Paths @(
  'packages/i18n/src/index.ts'
) -Message @'
fix(i18n): correct the pseudo-locale resource cast

en was cast to Record<string, Record<string, unknown>>, which is not
assignable to pseudoResources' Record<string, Bundle> -- unknown is not
string | Bundle. Latent since session 7 and failing check-types.

Expressed in terms of the function's own parameter rather than a hand-written
approximation, because Bundle is recursive and not exported.
'@

Write-Host ''
Write-Host 'Plan 04 -- audio and haptics' -ForegroundColor Cyan

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T01') -Paths @(
  'apps/native/package.json',
  'apps/native/app.json',
  'pnpm-lock.yaml',
  'apps/native/src/lib/audio/session.ts'
) -Message @'
feat(audio): install expo-audio and configure audio session

playsInSilentMode: false, because if someone has silenced their phone at 2am
we do not override that to play a singing bowl. Haptics still fire.

interruptionMode: mixWithOthers, because someone may be breathing along to
their own music and a 0.8 second pebble should not lower it. With the voice
track gone (D-012) nothing in Calma ever ducks anything.

Versions taken from expo's own bundledNativeModules.json for SDK 57.
expo-keep-awake is added in the same change; the breathing session needs it
to stop the screen sleeping mid-breath, and it was only present transitively.

app.json gains the expo-audio config plugin. Note that expo-keep-awake needs
no plugin entry, which is why only one name is added there.
'@

# The six converted sources come out of the repo (systems/08-git-workflow.md).
# The sandbox cannot unlink, so it is done here rather than in the working
# tree. The panic source stays: it is the only artifact of a sound that still
# needs regenerating, and deleting it would lose the evidence.
$convertedSources = @(
  'apps/native/assets/audio/Soft,_low-pitched_si_#3-1786277318909.mp3',
  'apps/native/assets/audio/Tiny_pebble_plink_in_#2-1786277481299.mp3',
  'apps/native/assets/audio/Crisp,_dry_rustle_of_#4-1786278055011.mp3',
  'apps/native/assets/audio/Soft_whispery_pencil_#3-1786278247286.mp3',
  'apps/native/assets/audio/Two_soft_glass_notes_#2-1786278340228.mp3',
  'apps/native/assets/audio/A_single_small_brass_#2-1786278866176.mp3'
)
foreach ($src in $convertedSources) {
  git ls-files --error-unmatch -- $src 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    # -f, not --cached: the file has to leave the working tree too, or the
    # `git add -A` in the commit below puts it straight back.
    git rm -q -f -- $src
    Assert-Ok "git rm for $src"
  }
}
$LASTEXITCODE = 0

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T02') -Paths @(
  'apps/native/assets/audio'
) -Message @'
chore(audio): normalise and rename six of the seven sound assets

AAC 128kbps mono m4a, peak normalised to -3 dBFS, click free at both ends.

PANIC IS DELIBERATELY NOT AMONG THEM. The file assigned to it by elimination
measures a fundamental near 31 Hz, with 86 percent of its energy between 30
and 60 Hz and only 1.9 percent in the specified 80-120 Hz band. Nearly 90
percent of it sits below 300 Hz, which no phone speaker reproduces. On a
laptop with a subwoofer it is a convincing drum; on the device it is meant
for it is close to silence with a faint click in it.

This is the one sound a person hears at their worst moment, and T02 says to
stop and flag rather than ship the wrong one. Its source mp3 is kept rather
than deleted, since it is the only artifact and it needs regenerating.

Two deviations from the ffmpeg command in systems/04, both recorded in the
plan file:

- loudnorm normalises LOUDNESS, not peak. Applied as written it left the six
  files spread from -2.1 to -23.1 dBFS, while the same document asks for -3
  dBFS peak and specifies per-key relative volumes that assume it. Using both
  would correct twice. Converted with measured per-file gain instead.

- The gain was iterated against the DECODED AAC peak rather than the source
  peak, because the encoder moves it by several dB. All six land within
  0.15 dB of target.
'@

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T03') -Paths @(
  'apps/native/src/lib/audio/manifest.ts'
) -Message @'
feat(audio): add sound manifest

require() is resolved by metro at build time, so a renamed or missing file is
a bundler error rather than a sound that silently does not play.

panic carries module: null. A null is louder than an absent key: the call
sites can be written, SoundBank treats it as a silent no-op, and the gap
stays visible in exactly one place with the measurements next to it.
'@

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T04', 'T05') -Paths @(
  'apps/native/src/lib/audio/SoundBank.ts'
) -Message @'
feat(audio): add sound bank with preloading and playback arbitration

Preloaded at boot because the first play of an unloaded sound costs tens to
hundreds of milliseconds of decode. For worryCaptured that is the difference
between the pebble landing on the same beat as the text dissolving and
landing just after it, which reads as the app being slow rather than as one
event.

Three arbitration rules, all failing closed:

  1. Nothing plays during an active breathing session except sessionEnd.
  2. Nothing plays over sessionEnd or panic while they are sounding.
  3. A repeat of the same key restarts it rather than layering.

Playback failure is swallowed with no return value and no error path, on
purpose. A caller that has to think about whether the sound worked is a
caller that will eventually surface an audio failure to someone having a hard
evening.

T04 and T05 share a commit: the arbitration is not a layer over the bank, it
is four lines inside its play path, and separating them would mean inventing
an intermediate state that never existed.
'@

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T06') -Paths @(
  'apps/native/src/lib/haptics/index.ts'
) -Message @'
feat(haptics): add haptics service with named vocabulary

Every moment in the systems doc's table is a named function with its
platform-specific mapping. selectionAsync is inconsistent across Android OEMs
(D-003), so the Android path substitutes a Light impact rather than relying
on it.

Error, Warning and Rigid are not exported and not wrapped. They are
unreachable, not merely discouraged: the first place someone will reach for
an Error haptic is a validation failure, which is precisely the moment Calma
has promised not to feel sharp.

During breathing this is not decoration. A whole session has to be followable
with the screen off, which is why the vocabulary is small and has to stay
small to remain legible through a pocket.
'@

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T07') -Paths @(
  'apps/native/src/lib/audio/index.ts',
  'apps/native/src/lib/boot.ts'
) -Message @'
feat(audio): gate sound and haptics on user preferences

Preferences push into module-level flags; nothing pulls. Both subsystems are
triggered from places React cannot reach -- animation completion callbacks on
the UI thread -- and T07 requires the gate to take effect with no re-render
of the calling screen. A useSoundEnabled() hook would do the opposite: every
screen capable of making a noise would re-render when someone touched a
switch in Settings.

Initialised from the boot gate once prefs are hydrated, before language, and
never blocking: audio failure is swallowed and boot cannot fail.
'@

Commit-Todo -Plan '04-audio-haptics.md' -Tags @('T08') -Paths @(
  'apps/native/src/lib/haptics/worklet.ts'
) -Message @'
feat(haptics): add worklet-safe haptic triggering for breath phases

UI thread animation callback, runOnJS, expo-haptics. One scheduled hop, no
re-render and no timer, so it lands inside a frame against a 30ms budget.

A setInterval version would be correct on a quiet phone and wrong on a busy
one, and the busy one is the phone someone just grabbed at 3am.
'@

Write-Host ''
Write-Host 'Plan 06 -- the breathing engine' -ForegroundColor Cyan

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T01') -Paths @(
  'packages/domain/src/breathing.machine.ts',
  'packages/domain/src/breathing.machine.test.ts',
  'packages/domain/src/index.ts'
) -Message @'
feat(breathe): add breathing phase state machine

A precomputed timeline rather than a ticking machine. A session's whole
schedule is knowable when it starts -- the pattern cannot change mid-session
-- so buildTimeline expands it into a flat array of phases carrying absolute
start times, scale targets and labels.

That removes the timer, the per-phase re-render and the bridge hop in one
decision. The UI thread receives plain numbers and searches them; the phase
at any elapsed time is a pure function, so there is no state to hold and
nothing for D-004 to be violated by.

It also makes the entire engine testable in Node with no frame loop, which is
the only reason any of this could be verified before running on a device.

Two things live here that a reader might expect in the component, both so
they can be tested: the orb's scale targets per phase (including the
physiological sigh's two-sip curve), and label suppression for phases under
600ms. The second is what stops the sigh's 180ms micro-hold flashing the word
"Hold" for a sixth of a second -- written as a general rule rather than a
special case, so a custom ratio cannot reintroduce it.

cyclesCompletedAt rounds down. The number feeds the Progress tab, and
inflating it would make the app's record of someone's week into a flattering
fiction.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T02', 'T03', 'T08') -Paths @(
  'apps/native/src/features/breathing/Orb.tsx',
  'apps/native/assets/images/grain.png'
) -Message @'
feat(breathe): add the orb, its grain, and its reduce-motion variant

Four layers, each load bearing: halo, body, offset highlight, grain.

The soft edge is gradient stops fading to zero alpha well inside each radius,
NOT a blur. react-native-svg has no blur cheap enough to run at 60fps on a
mid-range Android, and a real one on the largest moving element on screen is
the fastest way to make a breathing app stutter. Do not tidy away the
transparent last stop of any gradient; it is the edge.

The grain is what stops it looking like a CSS circle. It is also the layer
most likely to be dropped as something nobody notices -- people do not notice
it, they notice its absence. Generated deterministically at 128x128 and
tiled, never stretched: scaled up to 320 it becomes soft blobs.

Under Reduce Motion the orb does not scale at all. It brightens and warms on
exactly the same schedule, so the breath stays fully followable and the
haptics stay in step. The ambient drift switches off with it, since drift is
scale motion; the colour keeps the orb from reading as frozen instead.

T02, T03 and T08 share a commit -- they are three requirements on one file
that was written once.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T04', 'T05') -Paths @(
  'apps/native/src/features/breathing/useOrbAnimation.ts'
) -Message @'
feat(breathe): drive the orb from reanimated shared values

The whole session is handed to Reanimated as a single withSequence when it
starts. After that the UI thread owns the breath: no timer, no tick, no
re-render, nothing to drop.

The JS thread learns what happened through animation completion callbacks, so
when JS is busy the LABEL arrives late and the BREATH stays perfect. That is
the right way round, and it is the opposite of what a JS-timer implementation
does under exactly the load where it matters.

The halo runs the same sequence 120ms behind and carries no callbacks: the
breath is what happened, the halo is only how it looked.

Ambient drift is a separate repeating value multiplied into scale, 1.5
percent on a 7 second cycle, deliberately not a factor of any pattern's cycle
length so the two never lock into a visible rhythm.

The sigh's curve itself is in packages/domain (T05), not here, so it can be
unit tested. This file only plays the numbers it is given.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T06') -Paths @(
  'apps/native/src/features/breathing/useBreathHaptics.ts'
) -Message @'
feat(breathe): wire haptic cues to breath phase transitions

Rides the same animation callback as the visual rather than a parallel clock,
so the two cannot drift apart: they are one event, not two things scheduled
to agree.

A phase that does not change the word on screen does not get a cue either.
The case that exists for is the sigh's micro-hold -- a tap there would sit
between the two sips and blur the exact distinction the 140ms double tap is
there to make.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T07') -Paths @(
  'apps/native/src/features/breathing/PhaseLabel.tsx'
) -Message @'
feat(breathe): add cross-fading phase label

One word, cross-fading, never a countdown. Counting down turns a breath into
a deadline, and someone watching a number is someone who has stopped
breathing and started waiting.

accessibilityLiveRegion="polite" on this element is how the guidance reaches
VoiceOver and TalkBack. The orb is marked decorative precisely so this can be
the single announcement -- a live region on a shape changing sixty times a
second would be unusable, and a session that cannot be followed with your
eyes shut fails a stated goal of the product.

Serif, because it is meant to be felt. "Breathe out" in Figtree reads like a
system instruction (D-017).
'@

Commit-Todo -Plan '' -Tags @('i18n-breathing') -Paths @(
  'packages/i18n/src/locales/en/breathing.json'
) -Message @'
feat(i18n): add breathing keys for the picker, stop and journal offer

picker.title / picker.subtitle, stop.keepGoing / stop.stop, and
suds.post.writeAbout.

patterns.*.name is rewritten to the spoken forms from D1 -- "Even breathing"
rather than "5-5-5-5" -- and each pattern gains a `purpose` line saying what
it is FOR rather than what it is. A screen full of digits reads as a
protocol, and "for right now" is a decision someone can make where "two
breaths in, one long breath out" is homework.

The existing `description` strings are kept for Settings and the custom
rhythm screen, which do need to say what the ratios are.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T09', 'T11') -Paths @(
  'apps/native/src/features/breathing/SessionScreen.tsx',
  'apps/native/app/session/[pattern].tsx',
  'apps/native/app/panic.tsx'
) -Message @'
feat(breathe): build the breathing session screen with extend and stop

One orb, one word, nothing else. No timer, no progress ring, no cycle count,
no chrome. Each of those is a thing to look at instead of breathing, and a
progress indicator in particular converts a breath into a wait. The screen
stays awake, because someone following the orb is not touching it, which is
exactly what the idle timer watches for.

"Stop here?" is not a modal. It is the same room dimmed, with the orb still
breathing behind it, and its two buttons are identical -- stopping is never
the smaller or the harder target. No "are you sure", no "you are almost
there", no mention of an unfinished session.

The extension is offered once, with no recommended length and neither answer
favoured, and the orb carries on behind the question so the question does not
end the session before the answer does. Extending rebuilds the timeline with
more cycles and identical start times for the phases already animated, so the
orb does not jump at the moment someone chooses to continue. Ratios cannot
change mid-session.

Panic runs the same engine: the sigh, sixty seconds, no intensity question,
no modal of any kind, one visible way out (D-006).

T09 and T11 share a commit; the stop and extend handling is the same
component's state machine, not a layer on top of it.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T10') -Paths @(
  'apps/native/src/features/breathing/SudsSlider.tsx'
) -Message @'
feat(breathe): add pre-session suds intensity slider

NO NUMBER IS SHOWN. This diverges from systems/03, which allows the current
value; D2's caption is explicit that "the value is a position, not a score",
and the design wins on presentation. A number invites comparison -- with
yesterday, with a threshold, with what you think you ought to be feeling --
and none of those help someone who is about to breathe. Still stored 0-10,
because the Progress tab has to average something. Simply never shown back.

Amber into clay, never green into red. "Overwhelming" is not a failing grade.

Skip is full size and full weight, directly under the primary action, never
greyed and never delayed: declining to rate your own distress must cost
nothing. A skipped rating stores null, never 0 (D-007).

Built on gesture-handler rather than adding @react-native-community/slider.
A gradient track, a 40px thumb and no numerals is the entire component, and
a tap anywhere on the band moves the thumb, because requiring a drag from a
small circle is a fine motor task and hands shake.

Never mounted on the panic path.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T12') -Paths @(
  'apps/native/src/features/breathing/FeelingPicker.tsx'
) -Message @'
feat(breathe): add post-session feeling check

"Worse" is the same card as "better" -- same size, same fill, same border.
The moment one is smaller or duller the screen is telling someone which
answer it hoped for, and the person most likely to notice is the one about to
tap "Worse". Nothing is shown about last time, nothing is compared, nothing
is scored.

sessionEnd plays once as the session closes; it is the only sound permitted
during breathing.

The three faces live in the component, not the JSON. That is deliberate and
load bearing: the i18n bundle test forbids emoji in translation files
absolutely, which is what keeps a well-meaning translator from putting a
smiley in a sentence about panic.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T13') -Paths @(
  'apps/native/src/features/breathing/useSession.ts'
) -Message @'
feat(breathe): persist sessions and trigger the journaling offer

durationSec is what happened, not what was intended. Someone who stops forty
seconds into a three minute session did forty seconds, and the Progress tab
says forty seconds.

Every session is written, including abandoned ones. completed: false is a
fact, not a failure: there is no threshold below which a session stops
counting, because forty seconds of trying to breathe on a bad night is a
thing that happened.

The write happens exactly once. An early stop writes here and leaves; a
completed session is written by the feeling check, so the answer lands in the
same record rather than as a second row.

The journaling offer appears when preSuds >= 7 or the check came back same or
worse, is dismissible without friction, and cannot re-prompt for the same
session -- the stage machine has no route back to it. It stays an offer and
never a redirect: journaling reached only through "that didn't work" would be
structurally the consolation prize, when for some people it is the main tool
(D-015).

Storage failure is swallowed. Someone who has just finished breathing at 3am
does not need to be told a local database write failed, and could do nothing
about it if they were.
'@

Commit-Todo -Plan '06-breathing-engine.md' -Tags @('T14') -Paths @(
  'apps/native/app/(tabs)/breathe.tsx'
) -Message @'
feat(breathe): build pattern picker screen

Four siblings, not a ladder. Identical cards, identical marks, no
recommended badge, no durations, and no padlock on the Plus one -- marking
the locked row would turn a menu into a shop. The moment one card is styled
as the right answer, choosing becomes a small test, and this screen is often
reached by someone with no spare capacity for tests.

Row order follows D1, which is not PRESET_PATTERNS' order: the sigh leads,
because the likeliest reason to be on this screen is needing something to
work soon. Names are spoken rather than numeric and each row says what it is
for.

Custom is present but inert until plan 11 gates it. Every entry launches with
entryPoint: breathe-tab.
'@

Write-Host ''
Write-Host 'Design audit' -ForegroundColor Cyan

Commit-Todo -Plan '' -Tags @('fix-fidelity') -Paths @(
  'packages/tokens/src/colors.ts',
  'packages/tokens/src/layout.ts',
  'packages/tokens/src/typography.ts',
  'packages/tokens/src/tailwind.ts',
  'apps/native/global.css',
  'apps/native/src/ui/Button.tsx',
  'apps/native/src/ui/Text.tsx',
  'apps/native/src/components/PanicFab.tsx',
  'apps/native/src/features/breathing/SessionScreen.tsx',
  'apps/native/src/features/breathing/FeelingPicker.tsx',
  'apps/native/src/features/breathing/SudsSlider.tsx',
  'apps/native/app/(tabs)/breathe.tsx'
) -Message @'
fix(design): match the breathing screens to the delivered designs

Audited all six screens against designs/extracted/ rather than from memory.
Most of it was already exact. Five things were not, and the cause was the same
each time: the screens were built from @calma/tokens instead of from the
design files, and inherited the token layer's gaps.

1. THE LIGHT-MODE IMMERSIVE GROUND WAS WRONG. d3, d4 and d5 use #F2E7D6, a
   warmer and deeper sand. --immersive was set to the ordinary #FBF7F1, with a
   justification written into global.css about a room not needing dimming when
   the lights are already on. The designer disagreed: it is the ground on five
   screens, including b7-first-breath, which is onboarding's aha moment.

   colors.ts had no light bgImmersive and TOKEN-CENSUS.md never recorded the
   colour, so nothing downstream could have caught it. Everything agreed with
   everything else and all of it was wrong together.

2. Buttons standing ON that ground have their own surface pair -- #EADCC7 /
   #DFCEB4 light, #1C2733 / #2A3644 dark -- because `surface` is mixed against
   `background` and reads washed out on the warmer sand. Added as
   surface-immersive / border-immersive with a Button variant. They are 64px
   tall, not 62.

3. Amber fills lost their gradient. Every amber surface in the designs is a
   three-stop linear gradient with a glow in the accent's own colour; these
   had shipped as flat bg-accent, which reads as dead. Amber is the one thing
   in this app that gives off light. Drawn with react-native-svg rather than
   adding expo-linear-gradient, since svg is already here for the orb.

4. The orb's proportions are LEFT ALONE, by decision. d3 draws a 276px body in
   a 452px glow (about 1.64); systems/03 says 35% halo at 1.35R. Raised as a
   real conflict rather than resolved unilaterally, and the systems doc was
   chosen. Recorded in plan 06 T02 as the one deliberate exception, so it does
   not get re-litigated later.

5. Rounded-off values corrected: orb size and the gap beneath it are per-state
   (320/46 breathing, 268/48 extending, 240/54 stopping) rather than one
   shared value; d5 and d6 headings are 34px, needing a titleSm step the scale
   did not have; the SUDS thumb ring is its own token rather than the nearest
   one; d6 card padding and d1 card offset now match.
'@

Commit-Todo -Plan '' -Tags @('docs-design') -Paths @(
  'systems/03-design-system.md',
  'designs/TOKEN-CENSUS.md'
) -Message @'
docs(design): state that the design files outrank the written specs

systems/ and designs/ are gitignored, so this is a no-op in the tree and
exists so the message is in the log.

systems/03 now opens by saying the design files win on appearance, and names
the three places it has already lost: the SUDS slider showing no number, light
mode having its own immersive ground, and amber being a gradient rather than a
flat fill. The orb's proportions are named as the single deliberate exception.

TOKEN-CENSUS.md opens with a warning that it is incomplete, naming #F2E7D6 as
the colour it missed and how far that got.
'@

Write-Host ''
Write-Host 'Notes and handoff' -ForegroundColor Cyan

Commit-Todo -Plan '' -Tags @('docs') -Paths @(
  'plans/04-audio-haptics.md',
  'plans/06-breathing-engine.md',
  'progress/00-START-HERE.md',
  'progress/04-changelog.md',
  'progress/commit-session-9.ps1'
) -Message @'
docs(plan): record session 9 divergences and rewrite the handoff

plans/ and progress/ are gitignored, so this commit is a no-op in the tree
and exists only so the message is in the log.

Recorded divergences: the suds slider shows no number (D2 overrules
systems/03), the pattern picker leads with the sigh, the ffmpeg command in
systems/04 uses loudnorm where the same document asks for peak normalisation,
and panic.m4a is flagged rather than shipped.
'@

Write-Host ''
Write-Host 'Remaining source mp3s (the six converted ones are removed):' -ForegroundColor Cyan
git ls-files 'apps/native/assets/audio'

Write-Host ''
Write-Host 'Done. Now, in this order:' -ForegroundColor Cyan
Write-Host '  pnpm install       <- REQUIRED, expo-audio and expo-keep-awake are new'
Write-Host '  pnpm check-types'
Write-Host '  pnpm test'
Write-Host '  pnpm dev:native'
Write-Host ''
Write-Host 'Then open a breathing session before anything else.' -ForegroundColor Yellow
Write-Host 'See progress/00-START-HERE.md for the four things to look for.'
