# Session 10 -- onboarding (plan 13), the tokens its screens needed, and two
# things found on the way in that were wrong before it started.
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
# Some todos share a commit. That is not sloppiness: the sandbox cannot run
# git, so all the code was written before any of it could be committed, and
# several todos are different requirements on the SAME file. Splitting them
# afterwards would mean fabricating intermediate states that never existed,
# which is worse than an honest shared SHA. Precedent: session 9, plan 18 T11.
function Commit-Todo {
  param(
    [string]   $Plan,
    [string[]] $Tags,
    [string]   $Message,
    [string[]] $Paths,
    # For the docs commits. plans/ and progress/ are gitignored, so `git add`
    # stages nothing and the commit would be silently skipped -- which is what
    # happened to session 9's docs(plan) commit, and it is not in the log.
    # An empty commit is the whole point of those: the reasoning is the payload.
    [switch]   $AllowEmpty
  )

  git add -A -- $Paths
  Assert-Ok "git add for $($Tags -join ',')"

  # Nothing staged means nothing changed. Say so rather than failing.
  git diff --cached --quiet
  if ($LASTEXITCODE -eq 0 -and -not $AllowEmpty) {
    Write-Host "  $($Tags -join ',')  (nothing to commit)" -ForegroundColor DarkYellow
    return
  }

  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, ($Message -replace "`r`n", "`n"))
  if ($AllowEmpty) { git commit -q --allow-empty -F $tmp } else { git commit -q -F $tmp }
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

# The sandbox mount blocks unlink, so a probe file created while checking that
# fact could not be cleaned up there. Removed here instead.
Remove-Item -Force -ErrorAction SilentlyContinue 'packages\domain\src\onboarding\_probe.tmp'

# The duplicated expo-audio key that progress/00-START-HERE.md listed as the
# one uncommitted change is already in: e8a24e2, "fix(package): remove
# duplicate expo-audio dependency", which also carries an app.json change.
# Nothing to do for it here.

Write-Host ''
Write-Host 'Fixes found before plan 13 could start' -ForegroundColor Cyan

Commit-Todo -Plan '' -Tags @('fix-checktypes') -Paths @(
  'apps/native/package.json',
  'apps/native/tsconfig.json'
) -Message @'
fix(build): give apps/native a check-types script

`pnpm check-types` runs `turbo run check-types`, and turbo only runs a task in
a package that declares it. apps/native did not, so the command walked the four
packages and skipped the one containing every screen in the product.

The app has never been type-checked by the repo's own command. It does in fact
compile, which was luck rather than evidence -- and it means the handoff note
claiming check-types would fail on expo-keep-awake was describing a run that
could not have happened.

tsconfig gains `"types": ["node"]`. expo/tsconfig.base sets no types field and
@types/node was not being picked up, which would have failed the moment any
file in the app imported a node builtin.
'@

Commit-Todo -Plan '' -Tags @('fix-secondary') -Paths @(
  'packages/tokens/src/colors.ts',
  'packages/tokens/src/tailwind.ts',
  'apps/native/global.css',
  'apps/native/src/ui/Button.tsx'
) -Message @'
fix(ui): give secondary buttons the fill the designs give them

Button variant="secondary" used bg-surface, on the reasonable-sounding theory
that a card and a quiet button are the same material. Every screen in the
design set that has one disagrees: #EFE5D8 on #E2D5C3 in light, #212C39 on
#2E3B4A in dark, across b1, b10, b11, e4, f8, h1, h5 and j4. A card is
something to read and a button is something to press; it sits a step forward
of the surface behind it.

This is the same class of mistake as surface vs surface-immersive in session 9,
and it was found the same way -- by opening the design file rather than
trusting the token. Nothing downstream noticed, because everything downstream
agreed with itself.

Note the light pair is mixed against --background. On the lift ground the
designs shift it again (f8 uses #F1E7D8/#E6D9C4); nothing needs that yet.
'@

Write-Host ''
Write-Host 'Plan 13 -- onboarding' -ForegroundColor Cyan

Commit-Todo -Plan '' -Tags @('plan13-note') -AllowEmpty -Paths @(
  'plans/13-onboarding-walkthrough.md'
) -Message @'
docs(plan): record plan 13's divergences before building it

plans/ is gitignored, so this is a no-op in the tree and exists only so the
message is in the log.

Five, all recorded before a line was written:

1. There are ten steps, not eleven. The eleventh in systems/11's table is Home
   -- the app itself, not a step -- and B3 is cut (D-019). Design IDs are not
   renumbered.
2. T06's language step is built but unreachable while English ships alone.
   createOnboarding drops it rather than presenting a choice of one.
3. T12's notification step is built against a stub permission module. Plan 12
   T02 replaces one function body and nothing else.
4. T08's applyAnswers is in packages/domain, not apps/native. It is pure, and
   the plan's path had no test runner that could have run its test.
5. T15's tests are split: the pure flow assertions in packages/domain, the
   "no paywall can render" source guard in apps/native, which gains a
   node-only vitest for it.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T01') -Paths @(
  'packages/domain/src/onboarding/machine.ts',
  'packages/domain/src/onboarding/machine.test.ts',
  'packages/domain/src/onboarding/index.ts',
  'packages/domain/src/index.ts',
  'apps/native/src/features/onboarding/OnboardingFlow.tsx',
  'apps/native/src/features/onboarding/StepFrame.tsx',
  'apps/native/app/onboarding.tsx'
) -Message @'
feat(onboarding): add onboarding container and step machine

The machine is pure and lives in packages/domain. This is the one flow in the
app someone might meet while having a panic attack, and every claim made about
it -- that it advances and reverses without losing an answer, that skipping
everything still lands somewhere functional, that it terminates from any
starting point -- ought to be checkable in Node in a millisecond rather than by
tapping through a simulator ten times.

Ten steps, not eleven: the eleventh in systems/11's table is Home. B3 is cut
and the design IDs are NOT renumbered, or every reference into
designs/extracted breaks. There is a test for that too.

The container holds answers in local state and writes once, at the end. Not for
performance -- for the guarantee. A flow that persists as it goes has
intermediate states on disk and every one of them is a way for an interrupted
onboarding to leave the app in a shape nobody designed. One write from a value
the machine has already validated means "abandoned" and "finished" are the only
two outcomes.

StepFrame carries the furniture every step shares, in the same places every
time. The b5 caption is the reason it is one component rather than a pattern
each step repeats: "same furniture in the same places as B4, so the second ask
costs no new reading." Three questions in a row only feel like one conversation
if nothing moves between them.

It does not use ui/Screen. Screen pads content down from the safe area by a
fixed chrome height; onboarding puts the progress hairline ABOVE that inset,
because the hairline belongs to the flow rather than to the screen. That is the
only place in the app with anything above the content inset.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T02') -Paths @(
  'apps/native/src/features/onboarding/CrisisExit.tsx',
  'apps/native/src/ui/CrisisExit.tsx',
  'packages/i18n/src/locales/en/onboarding.json'
) -Message @'
feat(onboarding): add persistent crisis escape

A ten-step setup flow is a wall in front of someone having a panic attack. Some
people download Calma DURING the thing it is for -- the store listing promises
"the panic that hits at 2am" -- and someone acting on that promise must not
meet a quiz.

The exit is rendered by StepFrame and is NOT a prop. Every step goes through
the frame, so a step cannot express the idea of not having one. That is D-014
made structural rather than remembered, and it is what a future eleventh step
cannot forget.

Tapping it navigates before it writes. The write is a few milliseconds, but
they are milliseconds between someone asking for help and getting it, and the
write does not need to be awaited to be correct. Nothing else happens: no
confirmation, no save prompt, no permission dialog, no haptic, no sound.
Defaults are persisted, so the session ends on a working Home rather than back
in the flow they fled.

ui/CrisisExit's accessibility hint was a hard-coded English literal -- a string
no translator would ever have seen, and one the no-literal-jsx-text rule could
not catch because it only watches features/. It is a prop now.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T03') -Paths @(
  'apps/native/src/lib/boot.ts',
  'apps/native/src/stores/prefs.ts',
  'apps/native/src/features/onboarding/ReOffer.tsx',
  'apps/native/src/features/home/HomeScreen.tsx'
) -Message @'
feat(onboarding): route on first launch and track completion

onboardingCompletedAt is set on completion, on skipping to the end, AND on the
crisis escape, so onboarding shows exactly once whatever happened -- including
after an app update, because prefs survive one. Deliberately not "have they
answered the questions": someone who answered nothing has still been through
onboarding, and showing it again would be the app disagreeing with a decision
they already made.

An escaped flow buys exactly one gentle re-offer, and the interesting part is
when. shouldReOfferOnboarding compares day keys rather than counting hours:
someone who escaped at 2am and reopens at 9am is still inside that night, and
meeting a setup prompt then would be the app asking them to fill in a form
about the panic attack they just had. It is evaluated once at boot and frozen
in the store, so the card cannot appear under someone mid-session the moment
the clock passes midnight.

Either answer retires it. There is no "remind me later", because "later" is how
a single offer becomes a recurring one.

Home also now leads with what the third question said helped. That is derived
from the stored answers rather than kept as its own preference: a second copy
is a second thing to keep in step, and deriving means editing the answer in
Settings changes Home with no migration and no write path to get wrong.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T04') -Paths @(
  'apps/native/src/features/onboarding/Progress.tsx',
  'apps/native/src/ui/ProgressHairline.tsx'
) -Message @'
feat(onboarding): add quiet progress indication

The app-wide ban on progress indicators has exactly one carve-out and this is
it. The reasoning is not "onboarding is different" but something narrower: in a
breathing session a progress bar converts rest into a task being completed,
whereas in a setup flow NOT knowing how much is left is its own low-grade
anxiety, and removing that is the same job the rest of the app is doing.

It takes a fraction, not a step number. The obvious implementation is
index / total; the designs are 18, 38, 48, 58, 72, 84, 92, 99. Hand-placed, and
the b5 caption says what for: "the hairline has moved about a finger's width in
five screens -- enough to sense position, nowhere near enough to count." A
linear bar invites arithmetic. This one resists it, never reaches 1 so the last
screen is not a finish line, and is absent entirely on b1 and b7.

The fractions live in the machine beside the steps they belong to, with a test
that fails if the gaps ever become uniform -- because the obvious future
simplification is a division.

It was also 2px of --separator, which is a card border and far too present for
something meant to be sensed rather than seen. 3px on --hairline-track now,
per the design files. Hidden from screen readers entirely: a spoken step count
is exactly what systems/11 rules out, and VoiceOver already announces each
step's heading, which is the position information that actually helps.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T05') -Paths @(
  'apps/native/src/features/onboarding/steps/Welcome.tsx'
) -Message @'
feat(onboarding): build welcome step

Sell the outcome by showing it. The first thing a person sees is the orb,
already breathing, at 300px -- not a screenshot of it and not a headline about
it. Everything the app claims to do is visible before a word has been read.

No feature list, no carousel, no dot pagination, no explanation of the orb
(explaining it would make it a diagram), no sign-up, and no progress hairline:
per the b1 caption, position starts once the asking does, and nothing is being
asked here.

Continue is sand, not amber. It is the one primary action in onboarding that is
not the gradient, and the caption gives the reason: nothing on this screen is
allowed to out-shout the thing that is already breathing. An amber button here
would be a second light source competing with the orb on the one screen whose
entire job is the orb.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T06') -Paths @(
  'apps/native/src/features/onboarding/steps/Language.tsx'
) -Message @'
feat(onboarding): build language selection step

Pre-selected from the device and marked "Detected", never blank, so the step
reads as a checked box rather than a question. Each language in its own
language -- someone looking for theirs does not read the current one -- and no
flags, because flags are countries and getting that wrong tells a Swiss German
or Brazilian speaker which country the app thinks they should be in. Changing
it applies to the rest of onboarding immediately.

TODAY THIS SCREEN NEVER RENDERS, AND THAT IS CORRECT. English ships alone, so
createOnboarding drops the step rather than presenting a choice of one. Plan 13
calls this "auto-advance after a beat"; skipping it outright is better than a
screen that appears and disappears, which is a flicker a person has to
interpret.

It is built anyway because the alternative is discovering, on the day a second
language lands, that onboarding has no way to choose one. Unreachable, not
unwritten. Two pixel-level divergences are commented in the file to be settled
against the design on the day it can actually render.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T07') -Paths @(
  'apps/native/src/features/onboarding/steps/Question.tsx',
  'apps/native/src/ui/OptionCard.tsx'
) -Message @'
feat(onboarding): build personalisation question steps

One component for three screens, because the designs are identical and that is
the feature. The b5 caption: "same furniture in the same places as B4, so the
second ask costs no new reading." Three questions in a row are only tolerable
if they are visibly one conversation rather than three forms, and building them
as three files would let them drift apart one small improvement at a time.

Multi-select, nothing required, one question per screen, no clinical vocabulary
and nothing summed, weighted or turned into a profile. "Panic that comes out of
nowhere" is how a person says it; "panic disorder" is how a form says it.

Every option is identical in weight -- not approximately, identically. The
designer says it in three separate captions and means something specific by it:
none of these is the concerning answer, "Nothing yet" must never read as an
admission, and "It's hard to say" is an equal rather than a fallback. The moment
one option is styled as the healthy one, the screen has started grading the
person filling it in.

Selection is a wash plus an edge plus a filled mark. Three signals, none of them
brightness alone, because at 2am on a dimmed screen or in greyscale a
brightness step is invisible -- and those are the conditions this app is
designed around.

Skip CLEARS the question and moves on rather than carrying selections through.
Someone who taps two options and then Skip has changed their mind about
answering, and carrying them would be the app overriding the last thing they
did. Neither button is delayed, greyed or smaller than the other.

Card height is a floor, not a height: 76px minimum, growing with the text, so a
40% longer German or Finnish string wraps instead of truncating.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T08') -Paths @(
  'packages/domain/src/onboarding/answers.ts',
  'packages/domain/src/onboarding/answers.test.ts'
) -Message @'
feat(onboarding): apply personalisation answers to preferences

Personalisation that changes nothing is extraction. Someone typed their reasons
into a phone at 2am and is owed a mechanical consequence, which is also what
makes the reveal screen honest -- every sentence it shows would be false if this
file were not real.

The collision rules are rules rather than accidents of array order, and the same
set of taps in either order gives the same window. night beats day beats
morning, because an evening window serves someone whose mornings are also hard
where the reverse is not true; later collects more of the day. "It's hard to
say" is last and only wins alone -- paired with anything specific it is the less
informative answer, and taking it would throw away what the person actually
told us.

Home's lead tool is DERIVED on read rather than stored. No prefs.homeLeadTool,
so no second copy to keep in step, no migration, and editing the answer in
Settings changes Home with no write path to get wrong. breathing beats writing
when both are chosen, being the lower effort at the moment Home is looked at;
"nothing yet" yields to anything else, since it is the absence of a preference
rather than one.

An unrecognised option degrades to the default rather than throwing. Answers
survive across app versions, and an id retired in a later release must not be
an exception at 2am.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T09') -Paths @(
  'packages/domain/src/entities/breathing.ts',
  'apps/native/src/features/onboarding/steps/FirstBreath.tsx'
) -Message @'
feat(onboarding): build first breath aha moment

The aha moment, and the reason it is step six of ten rather than the finale.
For Airbnb it is the first booking; for Calma it is the first cycle where the
haptic pulses in someone's hand and they realise the app is doing something to
their body rather than showing them a screen. That is the whole product in
eight seconds, and putting it in the middle means everything after it is set-up
with an obvious reason to exist, done by someone calmer than they were four
screens ago.

It is a REAL session. Three physiological sighs, haptics on, written through
BreathingRepo with its own 'onboarding' entry point, counted in Progress like
any other. Letting someone try the core experience only works if it IS the core
experience -- a demo that does not count is a screenshot with a heartbeat.
Adding an enum member is safe for data already on disk; no record changes
shape, so there is no migration.

The session is owned by the flow, not by this step, because B7 runs the breath
and B8 asks how it was and both belong in ONE record. Same arrangement
SessionScreen already uses. Three consequences, all of them right: a breath
skipped before it started jumps the feeling check too ("How was that?" after
nothing happened is a question about nothing); a breath started and abandoned
is written with completed: false, a fact rather than a failure; and a breath
taken and then escaped from on the next screen is flushed on the way out.

The round amber button is the panic button, in its shape and its position, and
that is the tutorial. A coach mark pointing at the FAB would be the obvious
solution and is banned -- an arrow with a tooltip is exactly the corporate
register the tone guide exists to avoid. Instead the person performs the
gesture at the moment it first pays off, and step eight names it. 84px rather
than 72 because this is the one time the gesture is being learned rather than
reached for.

No rail, no counter, no cycle count, no progress hairline, and skippable: an
app that makes you breathe before it will let you past has misunderstood
itself.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T10') -Paths @(
  'apps/native/src/features/onboarding/steps/HowWasThat.tsx'
) -Message @'
feat(onboarding): build post-breath check

Three identical cards. No green tick on "Better", no grey on "Worse", no
ordering that makes one the correct answer. The moment one card is brighter or
larger, the screen has told the person which answer it was hoping for -- and the
person most likely to notice is the one about to tap "Worse".

One tap ends the screen. No confirm and no follow-up, because every extra tap
here is a tax on having answered honestly.

"Worse" is met with warmth, and specifically it is met with nothing at all. No
commentary, no escalation, no crisis resource, no "let's try something else". A
breath that did not help is allowed to have not helped, and reacting to it
would turn a one-tap question into an interview about how bad things are. The
warmth is in the absence of a response.

The three faces live in the component rather than the JSON, and that is
load-bearing: packages/i18n's bundle test forbids emoji in translation files
absolutely, which is what stops a well-meaning translator putting a smiley into
a sentence about panic. Keeping them here lets that rule stay a hard one.

A skipped answer is null, never "same" (D-007).
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T11') -Paths @(
  'apps/native/src/features/onboarding/steps/YourCalma.tsx'
) -Message @'
feat(onboarding): build personalisation reveal step

The screen that makes the three questions honest. Each card names one
consequence of one answer, in a sentence that would be false if the mapping
were not real.

What it is forbidden from saying: "we've personalised your experience", which
is a sentence with no content and how a product says nothing happened; anything
about outcomes, because Calma does not claim to treat, cure or reduce anything
as a medical matter and this is the screen where that temptation is strongest;
and anything countable about the person.

A fully-skipped flow gets an honest version rather than an invented one. The b9
caption is explicit: "if every question were skipped, this screen shows one
honest sentence instead of three invented ones." So the cards are conditional
on what was actually given, and someone who told us nothing is told that
nothing was assumed -- which is itself worth knowing, and true.

"It's hard to say" gets different copy from a specific answer. Telling someone
their window is set for 19:00 as though they had asked for it, when what they
said was that they did not know, is a small lie on a screen whose whole job is
to be specific.

Warmest ground in onboarding: --lift, a third ground that warms upward in light
and lifts off navy in dark. The direction reverses between themes, which is the
opposite of what --immersive does.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T12') -Paths @(
  'apps/native/src/lib/notifications/permission.ts',
  'apps/native/src/features/onboarding/steps/Notifications.tsx'
) -Message @'
feat(onboarding): build notification pre-prompt step

A permission can only be spent once. A denied OS prompt is final on both
platforms, and the fallback is a sentence asking someone to visit Settings,
which almost nobody does. So the expensive irreversible question is asked
second and only after a yes to the cheap reversible one. Declining our screen
never reaches the OS: the permission stays unspent and Settings can offer it
again later without having burnt anything. notificationsAsked is set only when
the dialog actually fires.

The preview is the real notification, not a mock-up of one: the same string,
from the same namespace the scheduler will use, with a real plural form. The
mono line underneath says "this is the whole notification, not an example",
and that sentence is only allowed to be there because it is true -- which is
why the preview pulls from i18n rather than restating the copy.

"No thanks" is the same height and shape as the yes. A spent permission cannot
be re-earned, so it is not worth a dark pattern.

The permission module is a stub, and the honest kind. plans/12 is not built and
expo-notifications is not a dependency, so requestNotificationPermission
returns 'unavailable' -- true, and a case every caller already has to handle
because a real user can decline. Someone who taps yes today gets their
preference recorded and no notifications, because there is no scheduler yet.
Nothing silently half-works. Plan 12 T02 replaces one function body.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T13') -Paths @(
  'apps/native/src/features/onboarding/steps/Name.tsx'
) -Message @'
feat(onboarding): build optional name step

Skip is a full-size pill directly beneath Continue. The designer is precise
about this -- "identical target, no pitch about personalising" -- so it is not a
grey word, not a smaller link, and not a "you can always add it later" nudge.

Every greeting in the app reads naturally with no name set, because
common:greeting carries plain and named as two whole sentences rather than one
sentence with a hole in it. An empty name is a different, equally finished
greeting rather than a missing word, and that is what makes skipping here
genuinely free rather than a slightly worse app.

Empty stays null, never an empty string: prefs.name is nullable and every
greeting branches on that, so an empty string would pass the check and render
"You're here, ." at someone.

No maxLength. A name is not a field to be validated, and a character limit is a
way of telling someone their name is wrong.

"Only stored on this phone" is literally true, which is why it can be said.
There is no network layer to send it over.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T14') -Paths @(
  'apps/native/src/features/onboarding/transitions.ts'
) -Message @'
feat(onboarding): add step transitions

Breath-paced cross-fades. No spring, no bounce, no overshoot: Calma's metronome
is the orb's eleven-second breath, and a screen that springs into place belongs
to a different app and to a different mood than the one the person is in.

No horizontal directional motion, ever. A step sliding in from the right
encodes "forward is rightward", which is true in English and false in Arabic
and Hebrew. The day RTL is added (systems/10-i18n.md) a horizontal transition
becomes a bug in every screen at once, and nobody will remember it was decided
here. A fade has no direction to get wrong, so it is a problem the app simply
never has.

This is also why onboarding does not reuse transitionFor from lib/motion.ts.
That one slides from the right, correctly, for a navigation stack being pushed
and popped. Onboarding is one screen changing its mind, not a stack -- and a
step going back must not look like a rewind, so both directions get the
identical fade.

Under Reduce Motion the fade shortens rather than disappearing. An instant cut
between two full-screen layouts is its own jolt, and Reduce Motion asks for
less movement rather than less continuity. Breath timing is never reduced,
which is why this is separate from the orb's animation.
'@

Commit-Todo -Plan '13-onboarding-walkthrough.md' -Tags @('T15') -Paths @(
  'packages/domain/src/onboarding/flow.test.ts',
  'apps/native/src/features/onboarding/__tests__/guards.test.ts',
  'apps/native/vitest.config.ts',
  'apps/native/package.json'
) -Message @'
test(onboarding): verify onboarding flow and escape paths

Two kinds of test, and the second needs explaining.

The flow assertions are pure and live in packages/domain: the complete walk, a
fully-skipped run, termination from every starting index, that no step requires
an answer, and that a flow abandoned at any point still produces a valid
complete set of preferences. That last one is the crisis escape's real
precondition -- if it were only true at the end, escaping from step three would
leave a broken app.

The guard reads the onboarding source as text. "No paywall, price, plan,
account prompt or review request can render during onboarding" is not a claim
about one code path; it is a claim about every possible one, including the ones
a future commit adds. A render test can only ever demonstrate that the paywall
did not appear on the paths it happened to try, which is the weaker statement
and the one that stops being true the moment someone adds a branch. Reading the
source proves the mechanism is absent. Comments are stripped first, or every
rule would be tripped by the comment explaining it -- and the fix people reach
for is deleting the explanation.

It also pins the arrangements the flow depends on: the crisis exit rendered by
the frame every step goes through, no step rendering its own frame, no
horizontal motion, no spring anywhere, the OS permission fired from exactly one
file, and ProgressHairline having exactly one user in the whole app.

This needed a test runner in apps/native, which now has a node-only vitest. No
jsdom, no RN preset, no renderer -- a limit worth naming, because the temptation
on seeing a runner here is to start rendering components, and a React Native
component test needs a mock of every native module the tree touches, at which
point the mocks are the thing under test.

It could not live in packages/domain, whose tsconfig sets types: [] to keep the
package genuinely platform-free and therefore has no node:fs. The boundary
doing its job.

NOT covered, and still outstanding: the flow walked by hand on iOS and Android
with VoiceOver on, at 200% font scale, and with Reduce Motion enabled, plus the
pseudo-locale check from plan 18 T14.
'@

Write-Host ''
Write-Host 'Tokens, copy and the handoff' -ForegroundColor Cyan

Commit-Todo -Plan '' -Tags @('tokens') -Paths @(
  'packages/tokens/src/colors.ts',
  'packages/tokens/src/typography.ts',
  'packages/tokens/src/layout.ts',
  'packages/tokens/src/tailwind.ts',
  'apps/native/global.css',
  'apps/native/src/ui/Text.tsx'
) -Message @'
feat(tokens): add the values onboarding's screens actually use

Taken from designs/extracted, not derived from what was already there.

--accent-wash and --accent-wash-border carry selection. They are a pair because
the b2-dark caption says so: selection carried by a brightness step vanishes on
a dimmed screen and in greyscale, which are the exact conditions this app is
designed around. The wash is flat in light and translucent in dark -- that is
the designs, not an inconsistency, since a solid tint over navy reads as a
second surface. The dark edge is duller than --accent so a selected row does
not glow at 2am.

--lift is a third ground, and the direction reverses between themes: light
warms upward from the background, dark lifts OFF navy rather than sinking below
it the way --immersive does. Used where the app is saying something back rather
than asking: the onboarding reveal, the worry-window summary, the streak
moment.

--accent-ink is amber as text. --accent is a fill colour and fails contrast at
body size on every ground we have.

Also --surface-quiet, --option-mark, --hairline-track, --radius-option, and a
76px option-card floor.

The 19px type step carries TWO leadings and that is not indecision. The designs
set 1.5 on prose and 1.35 on option rows, where the card's own padding already
supplies the air and a looser line pushes a wrapped German string past the
card. Session 9's audit found four values rounded off the scale; rounding this
one to 18 or 21 would quietly shrink or inflate every question in onboarding.
'@

Commit-Todo -Plan '' -Tags @('i18n') -Paths @(
  'packages/i18n/src/locales/en/onboarding.json'
) -Message @'
feat(i18n): add the onboarding strings the built screens needed

howWasThat.title, the three reveal lead-tool lines, the notification preview's
timestamp and disclaimer, the name field's placeholder, the crisis exit's
accessibility hint, and the re-offer.

The reveal needed three lines rather than one because what Home leads with is
a consequence of a different question than the worry window is, and the design
line conflates the two. Three specific sentences, each true on its own.

All of it passes the bundle rules: no exclamation marks, no all-caps, no emoji,
no diagnosis language, nothing that guilts or hurries, named interpolation
only.
'@

Commit-Todo -Plan '' -Tags @('handoff') -AllowEmpty -Paths @(
  'plans/13-onboarding-walkthrough.md',
  'progress/00-START-HERE.md',
  'progress/04-changelog.md',
  'progress/commit-session-10.ps1'
) -Message @'
docs(progress): record session 10 and rewrite the handoff

progress/ and plans/ are gitignored, so this commit is a no-op in the tree and
exists only so the message is in the log.

Recorded: plan 13 complete, the two fixes that preceded it (apps/native had no
check-types script, and secondary buttons used a card colour), the tokens the
B screens needed, and the five divergences from plan 13 as written.

Still true and still first: nothing has rendered.
'@

Write-Host ''
Write-Host 'Done. Now, in this order:' -ForegroundColor Cyan
Write-Host '  pnpm install       <- REQUIRED, vitest is new in apps/native'
Write-Host '  pnpm check-types   <- now actually checks the app'
Write-Host '  pnpm lint'
Write-Host '  pnpm test'
Write-Host '  pnpm dev:native'
Write-Host ''
Write-Host 'Then, before anything else:' -ForegroundColor Yellow
Write-Host '  1. Open a breathing session. Tab Breathe -> The sigh.'
Write-Host '     Four things, in order: does it look like Calma, does the orb'
Write-Host '     breathe, do the haptics land with it, does the sigh read as two'
Write-Host '     sips of air. See progress/00-START-HERE.md.'
Write-Host '  2. Then delete prefs and walk onboarding start to finish.'
Write-Host '     The first breath is the one to watch: it is a real session and'
Write-Host '     should appear in Progress afterwards.'
