# commit-session-13.ps1
#
# Session 13 - plan 09 finished (the G block), and plan 11 started (i1, i2, d7).
#
# ASCII ONLY. Windows PowerShell 5.1 reads a script as ANSI unless it has a
# BOM, so a single em dash in a here-string lands in the repo doubly encoded.
# Verify before editing:
#   python -c "print(sum(1 for b in open('progress/commit-session-13.ps1','rb').read() if b>127))"
#
# Safe to re-run: every step skips when there is nothing staged.
#
# RUN commit-session-12.ps1 FIRST. Session 12's work is still uncommitted in
# the working tree - panic.tsx, PanicFab.tsx, PanicSession.tsx, PanicEnding.tsx
# and breathing.json all show as modified or untracked. This script's paths do
# not overlap them, but committing session 13 on top of an uncommitted session
# 12 makes the log lie about the order things were built in.
#
# Run from the repository root:
#   powershell -ExecutionPolicy Bypass -File progress\commit-session-13.ps1

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

# Replaces `pending-TXX` in a plan file with the SHA that todo actually got.
# plans/ is gitignored, so this is a local edit only - which is exactly why it
# has to happen here rather than in a commit.
function Write-Sha {
  param(
    [Parameter(Mandatory = $true)][string] $PlanFile,
    [Parameter(Mandatory = $true)][string] $Placeholder,
    [Parameter(Mandatory = $true)][string] $Todo
  )

  if (-not $script:shas.ContainsKey($Todo)) { return }
  if (-not (Test-Path $PlanFile)) { return }

  $sha  = $script:shas[$Todo]
  $body = Get-Content -Raw -Encoding UTF8 $PlanFile
  if ($body -notmatch [regex]::Escape($Placeholder)) { return }

  $body = $body.Replace($Placeholder, $sha)
  Set-Content -Path $PlanFile -Value $body -Encoding UTF8 -NoNewline
  Write-Host "     $PlanFile  $Placeholder -> $sha" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# The tokens come first. Every screen below stands on them, and a screen
# committed before its ground is a commit that renders wrong at that SHA.
# ---------------------------------------------------------------------------

Commit-Todo -Todo 'T00-tokens' -Paths @(
  'packages/tokens/src/colors.ts',
  'packages/tokens/src/tailwind.ts',
  'apps/native/global.css'
) -Message @'
feat(tokens): add the grounds for g1, g4, g7, i1, i2 and d7

Twenty values, in colors.ts, global.css and the name map together so
theme-parity.test.ts spans all three. Checked: all 82 mapped vars agree
across the three files, and the check was made to fail once first.

  --saved            #FBF4E7 / #17202A   g4, and only g4
  --offer            #F5EDE0 / #131B24   g1's ground
  --surface-offer    #FDF8EF / #1E2731   the card, brighter than its ground
  --border-offer     #EADFC9 / #2D3844
  --highlight        #F7E3C4 / rgba(209,146,73,.26)   g7's matched term
  --surface-price    #F8F0E3 / #1B242E   i1
  --border-price     #E9DAC2 / #2A3542
  --surface-tile-*   three tinted tiles on i1
  --surface-plus     #F1F2EB / #1E2620   i2's active panel
  --plus-foreground  #36402E / #DDE6D3
  --plus-muted       #46523C / #B7C6AB
  --separator-row    #ECE2D4 / #232E3A   i2's row rules
  --surface-stepper  #EADCC7 / #26313E   d7
  --stepper-glyph    #7A6552 / #A9B4BF

--saved is within two points of --lift (#FBF4E9) and --ending (#FBF3E6)
and is none of them. That is the fourth session running in which a
feature turned out to have its own ground, so it is worth naming the
shape: g4 is a notebook closing and --ending is the panic path lifting.
Tying them together would mean fixing one silently moved the other.

--highlight is a wash at highlighter weight rather than --accent, and
--stepper-glyph is not the text colour. In both cases the full-strength
value reads as an alert or a delete control at the size it appears.

i1's three tiles are tinted by the feature each one names: amber for
breathing, neutral for the longer view, clay for worry. One neutral tile
three times would be cheaper and would also be the only place in Calma
where a colour that means something everywhere else means nothing.

There is exactly ONE price surface and deliberately no highlighted
variant of it. i1's caption forbids savings maths, strike-through,
timers and "most popular"; a --surface-price-featured appearing in this
file later is the bug.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T07' 'T00-tokens'

# ---------------------------------------------------------------------------
# The formatter next, for the same reason: three screens date entries with it.
# ---------------------------------------------------------------------------

Commit-Todo -Todo 'T00-days' -Paths @(
  'packages/i18n/src/format.ts',
  'packages/i18n/src/day-label.test.ts'
) -Message @'
feat(i18n): describe a day the way a person would

"Friday night", "Last Sunday", "2 weeks ago". g6's caption: "Days feel
like days - 'Tuesday evening', not a timestamp." A journal is not a log.
Someone scrolling back is looking for the night they remember, and an
exact timestamp on a bad evening reads back like evidence.

describeDay returns a descriptor, not a string. The phrasing is
translatable copy and belongs in journal.json; the branching is calendar
logic that has to be identical in every locale and testable in Node.
Keeping them apart means a locale can rephrase "Last Sunday" without
touching calendar logic, and calendar logic cannot be changed by editing
a translation.

15 assertions, all executed. Two boundaries are pinned from both sides
because they are the ones that slide by accident: six days back is still
"Saturday afternoon", seven is "last Saturday". 3am is night, not
morning - the hour this app exists for is the one case where getting
that word wrong matters most. Days are counted by calendar day rather
than elapsed hours, so 23:50 and 00:10 are two days apart.

Past four weeks it becomes a plain date. "Nine weeks ago" is arithmetic
about someone's life rather than a memory of it.

DIVERGENCE: g6 writes "Two weeks ago" in words. No JavaScript Intl API
spells a number out, and a hand-written table of number words per locale
is a translation bug waiting to happen, so it renders "2 weeks ago".
'@

# ---------------------------------------------------------------------------
# Plan 09, in the order the screens depend on each other.
# ---------------------------------------------------------------------------

Commit-Todo -Todo 'T07' -Paths @(
  'apps/native/src/features/journal/DraftList.tsx',
  'apps/native/src/features/journal/dayLabel.ts',
  'apps/native/app/journal/drafts.tsx'
) -Message @'
feat(journal): add draft resumption (g5)

The dashed edge is the entire signal. g5's caption: "A dashed edge says
in-progress without saying broken. Human days, no counts, no badges, no
expiry, and never the words incomplete or unfinished." So there is no
amber here, no "1 of 3", no age, and nothing that reads as a chore list.
The closing line gives drafts explicit permission to stay drafts, which
is the opposite of a nudge.

Resuming lands on the first EMPTY prompt (firstEmptyStep), not the
first. Re-reading four answers you already gave to reach the one you did
not is a tax on having been interrupted, and being interrupted is the
normal case for this screen.

DIVERGENCE: g5 draws a list and no delete affordance, and T07 requires
one behind "a single honest confirmation". It is a long press that turns
the card itself into the question, published through accessibilityActions
because VoiceOver cannot long-press. NOT swipe-to-delete: a list of
half-written thoughts is the last place in the app for a gesture that
destroys something when a thumb slips. Not a system Alert either - an OS
dialog is a modal in a foreign material, and it is the one control style
the designs never use.

DraftCard is shared with the Write tab, so g0 and g5 cannot drift.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T07' 'T07'

Commit-Todo -Todo 'T08' -Paths @(
  'apps/native/src/features/journal/SaveConfirmation.tsx'
) -Message @'
feat(journal): add entry save with confirmation feedback (g4)

"Saved. That's yours." The component has no data in it and cannot get
any: no length, no count, no delta, no analysis, no share, no suggestion
to come back tomorrow. g4's caption calls it closing a notebook. The
moment after writing something hard is the worst possible moment to be
handed a statistic about it.

It leaves on a 1600ms timer AND the whole screen is a target. A "Done"
button would make closing a notebook into one more thing to dismiss; a
timer alone would be a screen someone is stuck in the first time it
fails to fire.

The warm rule is svg. Amber in Calma is light rather than paint, and a
flat 8px band of --accent across the middle of a screen reads as a
status indicator. The dark mid-stop drops 0.55 to 0.5 alongside the
dimmer base - the 2am rule, applied twice.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T08' 'T08'

Commit-Todo -Todo 'T11' -Paths @(
  'apps/native/src/features/journal/EntryList.tsx',
  'apps/native/src/features/journal/entries.ts',
  'apps/native/src/features/journal/WriteScreen.tsx'
) -Message @'
feat(journal): build entry list with day grouping (g6)

The Write tab's "Earlier" section showed "Nothing written yet" even when
entries existed - a screen telling someone their writing does not exist.
It now waits for the first page and then renders it.

Every card is the same colour. g6's caption is a rule rather than a
preference: "intensity is never encoded as colour, so a bad week can't
become a heat map". No SUDS tint, no severity band, no calendar density.
A draft differs by a dashed edge and nothing else. Nothing is surfaced
unprompted - no "on this day", no resurfacing - which is why search
exists and a memories feature does not.

Thirty days at a time, behind a "Show more" button rather than infinite
scroll. A list that keeps producing more of your worst nights as you
scroll is not something to hand someone at 3am.

previewOf falls through the text fields rather than showing a
placeholder: someone who skipped "what happened" and wrote a paragraph
under "what went through your mind" has not written an untitled entry.
emotionIntensity is not a candidate - a bare "7" as a list heading would
be the app labelling someone's night with a score.

The grouping, preview and match-splitting live in entries.ts rather than
in the component, because vitest here runs pure Node with no renderer
and those are the three places this feature could quietly start
misrepresenting someone's writing back to them.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T11' 'T11'

Commit-Todo -Todo 'T09+T10' -Paths @(
  'apps/native/src/features/journal/JournalOffer.tsx',
  'apps/native/src/features/breathing/SessionScreen.tsx',
  'apps/native/src/features/breathing/useSession.ts',
  'packages/db/src/ports/journal.repo.ts',
  'packages/db/src/adapters/mmkv/journal.mmkv.ts',
  'packages/db/src/index.ts'
) -Message @'
feat(journal): wire the post-session offer and link it to its session

One commit because the link is the reason the offer exists in this
shape: the draft is created at the moment "Let's write" is tapped, in
SessionScreen, carrying the session id. Splitting them would fabricate a
state in which the offer created an unlinked entry, which never existed.

g1 rather than the full-screen heading-and-buttons that stood in before.
The orb is still visible at 40% behind a card in the lower third, so
accepting is continuing and declining is simply the end of what was
already happening. A full-screen prompt makes "no" a thing you have to
do rather than a thing you can just not do.

Three prompts, not two. "Worse" and "same" each get their own sentence;
arrived-at-7-but-came-out-better gets g1's own line, because "sometimes
writing helps untangle things" contradicts someone who has just said
they feel better.

SessionOutcome gains sessionId, null when the write failed. A link to a
session that was never stored is worse than no link - it is a claim the
app cannot honour later.

Deleting a session must not touch the writing. JournalRepo.unlinkSession
clears the pointer and leaves the entry completely intact;
deleteBreathingSession() in @calma/db does both in the safe order.
It is a function over the repositories rather than a method on
BreathingRepo, because a repository reaching into another repository is
how a storage layer stops being swappable. Nothing deletes a session
yet - this exists so plan 14's "delete everything" gets it for free
instead of remembering.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T09' 'T09+T10'
Write-Sha 'plans/09-journaling.md' 'pending-T10' 'T09+T10'

Commit-Todo -Todo 'T14' -Paths @(
  'apps/native/src/features/journal/SearchScreen.tsx',
  'apps/native/app/journal/search.tsx'
) -Message @'
feat(journal): build entry search (g7)

Still a linear scan, deliberately. An inverted index of someone's
journal is a second copy of the most sensitive text on the device, in a
shape that makes it easy to read out of order
(systems/02-data-layer.md). A few hundred short records scan in well
under the 100ms the plan asks for.

The 220ms debounce carries a generation counter, so a slow scan cannot
land on top of the results of a later, faster one. Typing is never gated
on a scan finishing.

The match is highlighted, never counted. No relevance score, no "best
match", no ordering by frequency - newest first, always. Ranking
someone's own diary by how much it is "about" a word would be the app
forming an opinion about their year.

splitOnMatch takes the matched text from the ORIGINAL string rather than
from the query, so searching "priya" highlights "Priya" as the person
wrote it. Handing someone their own sentence back with the
capitalisation changed reads as the app having edited them.

DIVERGENCE: g7 exists and no design draws the way in. A search glyph
sits beside the Write tab's "Earlier" label - there is no header bar,
and that is the only place on the screen where looking backwards is what
someone is doing. A glyph rather than a labelled button so it cannot
compete with "Start writing" for attention.

Not gated. Plan 11 T10 gates search for free tier and is not built.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T14' 'T14'

Commit-Todo -Todo 'T13' -Paths @(
  'apps/native/src/features/journal/__tests__/entries.test.ts',
  'apps/native/src/features/journal/__tests__/retention.test.ts'
) -Message @'
fix(journal): never clear typed content on error or limit

Eleven assertions that read the source rather than rendering. "No code
path clears the editor without an explicit discard" is a claim about
every path including the ones a future commit adds; a render test only
ever shows that the paths it happened to try were fine, which is the
weaker statement and stops being true the moment someone adds a branch.
Same shape and same reasoning as onboarding/__tests__/guards.test.ts.

What is pinned: the editor never assigns an empty string to a field and
holds no reset or clear of its own; repo.delete appears exactly once in
the whole feature, inside store.discard; save is idempotent for 600ms;
autosave is a debounce plus AppState plus unmount, never onBlur.

It also carries plan 07's rule rather than plan 09's: PanicSession and
PanicEnding must not import JournalOffer, shouldOfferJournaling, or
anything under journal/. Session 12 removed the mechanism that had
quietly put an offer on the panic path; this is what keeps it removed.

Every assertion was made to fail once before being kept. Inserting
update({ situation: '' }) into onSave and an import of JournalOffer into
PanicEnding both went red, and both went green again on revert.

Also 23 assertions on entries.ts - grouping across local midnight,
preview fall-through, and splitOnMatch reassembling to exactly the
original text.
'@
Write-Sha 'plans/09-journaling.md' 'pending-T13' 'T13'

Commit-Todo -Todo 'T-i18n' -Paths @(
  'packages/i18n/src/locales/en/journal.json'
) -Message @'
feat(i18n): add the journal block's remaining copy

Drafts, discard, the day phrasings, search, and the two empty states.

The discard confirmation states what is lost in one sentence and does
not warn: "What you wrote here won't be kept. Nothing else changes."
No "are you sure", no second confirmation, no red - nothing in Calma is
ever an error.

searchNone is "Nothing here matches that", not "no results found". The
app failing to find a word is not a failure of the person who typed it.
'@

# ---------------------------------------------------------------------------
# Plan 11. The layer first, then the two screens that stand on it, then d7.
# ---------------------------------------------------------------------------

Commit-Todo -Todo 'P11-T01' -Paths @(
  'packages/env/src/native.ts',
  'apps/native/src/features/entitlement/purchases.ts'
) -Message @'
feat(entitlement): install and configure revenuecat sdk

Anonymous mode only. logIn() appears nowhere and configure() is called
with no appUserID: passing one, even a random one, is how an app without
accounts acquires an identity by accident, and that identity would then
travel with every receipt - a stable handle on a person's use of an
anxiety app, held by a third party. The cost is accepted and is real:
with no identity, restore is the only recovery path after a device
change.

Both API keys are OPTIONAL in @calma/env. A missing key is a legitimate
state, not a misconfiguration - it is what this repo looks like before
anyone has a RevenueCat project. Requiring them would mean the app
cannot boot without a billing account, which for an app whose entire
relief path is free is the wrong dependency. An absent key resolves to
the same place as an SDK failure: free tier, every paywall suppressed.

Nothing here throws. Every failure path returns null or an empty list,
because there is nothing a person could do about it and nothing they
need to know.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T01' 'P11-T01'

Commit-Todo -Todo 'P11-T02' -Paths @(
  'apps/native/src/features/entitlement/store.ts',
  'apps/native/app/_layout.tsx'
) -Message @'
feat(entitlement): add entitlement store with offline cache

The cache STANDS INDEFINITELY with no network. No staleness window, no
expiry: the failure mode of a wrong expiry is that someone who paid
opens the app on a plane and finds their features gone, and the opposite
error costs a few pence and upsets nobody. It lives in calma.cache, the
one unencrypted store - a tier is not sensitive and nothing about what
someone wrote goes near it.

Hydration is deliberately NOT part of boot(). Boot decides whether the
app can open at all, and a billing SDK has no business in that chain.
It runs from a useEntitlement() effect in the root layout alongside the
foreground refresh, which the store throttles to once an hour, so
calling it on every foreground is not polling. Nothing has a timer.

A corrupt cache entry is not worth a word to anyone: free tier is the
safe default and the next refresh corrects it.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T02' 'P11-T02'

Commit-Todo -Todo 'P11-T07+T12' -Paths @(
  'apps/native/src/features/entitlement/paywallGate.ts',
  'apps/native/src/features/entitlement/gateStore.ts',
  'apps/native/src/features/entitlement/__tests__/paywallGate.test.ts'
) -Message @'
feat(entitlement): gate the paywall on frequency and on interruption

Two rules, deliberately not merged. Frequency: a limit shows the sheet
at most once per calendar day and later hits get one inline line.
Interruption: while anything is in flight, nothing commercial appears at
all, not even the line. "Not now" and "not again today" are different
states, and collapsing them would let a deferred sheet count as shown.

Blockers are a deny-list of moments rather than an allow-list of
screens, so a new screen is blocked the moment it registers a hold and
nobody has to remember to add it to a list. 'field' covers "any text
field in the app has focus", which catches the cases nobody enumerates.

An in-flight blocker returns 'silent', not 'inline'. "That's 3 for
today" is still the app talking about money while someone is mid-task.

Markers reset at LOCAL midnight rather than after 24 hours, and each
limit kind is on its own schedule - hitting the worry limit does not
spend the journal limit's one showing.

15 assertions, all executed, one per condition T12 names plus two it
does not: a completion timestamp in the FUTURE (clock changes move
Date.now() backwards, and this must fail toward silence rather than
toward selling), and a suppressed build staying silent on a repeat hit.

paywallDecision is pure and gateStore holds the zustand half. That split
is not tidiness - vitest here runs pure Node with no renderer, and a
rule that can only be checked by mounting a component tree is a rule
that stops being checked. R4 is why this file exists at all: the 1-star
review that ended "I hope no one ever downloads this game again" was
about something commercial appearing mid-task, not about monetisation.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T07' 'P11-T07+T12'
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T12' 'P11-T07+T12'

Commit-Todo -Todo 'P11-T05' -Paths @(
  'apps/native/src/features/entitlement/useLimit.ts'
) -Message @'
feat(entitlement): add uselimit hook

used is recomputed from the repository day and week indexes on every
read. There is no stored counter anywhere: a counter drifts the first
time a write half-succeeds, a timezone changes, or someone deletes a
worry - and it drifts in the direction of telling a person they have
used something they have not. Recomputing is a length of an index array.

atLimit is not permission to disable anything. Never a disabled button,
never a lock icon: the action is attempted and a gentle card follows.
decide() says what that card is allowed to be, and often the answer is
nothing at all.

Not yet called from anywhere - T08 and T09 are the call sites.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T05' 'P11-T05'

Commit-Todo -Todo 'P11-T06' -Paths @(
  'apps/native/src/features/entitlement/PaywallSheet.tsx'
) -Message @'
feat(entitlement): build paywall sheet

No design exists for this card - i1 is the Plans screen, not the limit
sheet. Built from systems/05-entitlements.md's "Card contents" list, in
g1's sheet material, which is the only sheet the design set draws.

Acknowledgement first, then the limit, then one sentence about Plus. A
card that opens with what you cannot do has told an anxious person they
ran out of something, and the acknowledgement afterwards then reads as
consolation. The worry copy points at something still available; a limit
is never a dead end.

"Not now" is the same height, the same moment and no slower. No
countdown, no scarcity, no guilt copy, and no free trial to dangle - the
free tier is the ongoing demonstration.

The bell's 0.5 volume lives in soundManifest, not at the call site. A
call site that could raise it is a call site where someone eventually
will.

It is not a route. A screen would have to be navigated away from, and
navigation is a thing that can go wrong while someone is upset.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T06' 'P11-T06'

Commit-Todo -Todo 'P11-T13' -Paths @(
  'apps/native/src/features/entitlement/PlansScreen.tsx',
  'apps/native/src/features/entitlement/PlusActiveScreen.tsx',
  'apps/native/app/paywall.tsx',
  'packages/i18n/src/locales/en/entitlement.json'
) -Message @'
feat(entitlement): build plans screen and plus-active screen (i1, i2)

app/paywall.tsx was a title and two buttons. It now renders i1 or i2 by
tier - one route, because they are the same destination and splitting
them would mean every caller had to know which applied and would get it
wrong the moment a purchase completed. The sheet detent goes 0.55 ->
0.92; i1 is a full screen.

i1 opens by reassuring rather than tempting: "Everything you use stays
free." comes before anything about money, because it is true and it is
the thing worth saying first. No strike-through, no timer, no "most
popular", no savings maths, no free trial. "Not now" is a full-width
target, not fine print.

Prices come from product.priceString or they do not appear. Never a
hardcoded number, never a client-side conversion: a screen that says
"GBP 4" to someone who will be charged in zloty is a screen that lied at
the moment they were deciding whether to trust the app with their worst
thoughts. With no offerings the list is absent and one plain sentence
takes its place.

DESIGN / SYSTEMS CONFLICT, resolved by the owner. i1 draws ONE price row
and its caption forbids comparison furniture; systems/05 says "lifetime
is offered and is not buried" and plan 11 T13 asks for three at equal
prominence. Design wins on appearance, systems wins on behaviour
spanning screens, and "which products exist" is the second kind. Three
identical rows in i1's exact treatment, with none of the furniture.

i2 DROPS TWO ROWS, also on the owner's decision. It draws "Payment
method  4417" and "Receipts"; anonymous-mode RevenueCat means the app
never sees a card number and has no receipt list. Rendering masked
digits would mean inventing them. "Stop Plus" survives and deep-links to
the platform subscription page, which is the only place either store
allows a cancellation - and it is a plain row in the same ink as
everything else, with no "are you sure you want to lose everything".

Cancellation dismisses silently. Failure is one plain sentence with no
error code and no red.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T13' 'P11-T13'

Commit-Todo -Todo 'P11-T11' -Paths @(
  'apps/native/src/features/breathing/CustomRatio.tsx',
  'apps/native/app/custom-rhythm.tsx',
  'apps/native/app/(tabs)/breathe.tsx',
  'packages/i18n/src/locales/en/breathing.json'
) -Message @'
feat(entitlement): build custom breathing ratio builder (d7)

d1's custom row was inert. It now opens the builder.

"The one screen allowed to feel like an instrument", which is why the
numbers are legible here and hidden everywhere else: a person here is
deliberately setting something, not trying to follow it. During a
session a visible number is a countdown, and a countdown turns a breath
into a wait.

Steppers, not a slider. Whole seconds, every value an exact number of
taps away. A slider makes 4 seconds a thing to hunt for with a thumb,
and the point of a custom rhythm is that someone already knows the
numbers they want.

Bounds come from customRatioProblem in @calma/domain - the same
validation patternFromCustomRatio uses - so a ratio this screen accepts
can never be one the engine rejects. Out of range is PREVENTED by the
steppers rather than reported afterwards: the plus stops adding and a
plain sentence says why. Nothing turns red.

The ratio can only be changed outside a session, which is what the
screen's existence enforces: a timeline is scheduled whole, so changing
the numbers mid-breath would either do nothing - worse, because it looks
like it did something - or restart the breath under someone.

BUILT UNGATED, on the owner's decision. The useTier check is a one-line
addition at the row and at "Use this one" when the rest of plan 11
lands.

DIVERGENCE: d7's caption says the orb follows as you change it, and the
orb here runs its own ambient loop. Driving it from the live numbers
would restart the animation on every tap, which is the one thing an orb
must never do (D-004). Making it genuinely follow means rescheduling a
timeline on a settled value - real work, and worth doing, but not worth
a stuttering orb in the meantime.
'@
Write-Sha 'plans/11-entitlements-paywall.md' 'pending-T11' 'P11-T11'

# ---------------------------------------------------------------------------
# The two transfer archives this session used to get files onto the machine.
# `git rm -f` rather than --cached, or the next `git add -A` puts them back.
# They were never tracked, so this is a working-tree delete.
# ---------------------------------------------------------------------------

foreach ($archive in @('_session13.tgz', '_session13b.tgz', 'progress\_session13-changelog.md')) {
  if (Test-Path $archive) {
    Remove-Item -Force $archive
    Write-Host "removed $archive" -ForegroundColor DarkGray
  }
}

Write-Host ''
Write-Host 'Commits made:' -ForegroundColor Cyan
$script:shas.GetEnumerator() | Sort-Object Name | ForEach-Object {
  Write-Host ("  {0,-14} {1}" -f $_.Key, $_.Value)
}

Write-Host ''
Write-Host 'Left UNTICKED on purpose:' -ForegroundColor Yellow
Write-Host '  plan 11 T03  offerings and purchase - needs store products to exist'
Write-Host '  plan 11 T04  restore - needs a Settings screen (plan 14)'
Write-Host '  plan 11 T08  gate worry capture - the call site'
Write-Host '  plan 11 T09  gate journal saves - the call site'
Write-Host '  plan 11 T10  gate history, search and trends'
Write-Host '  plan 09 T14  the "under 100ms with 500 entries" clause needs a device'
Write-Host ''
Write-Host 'Then, before anything else:' -ForegroundColor Cyan
Write-Host '  pnpm check-types   # DID NOT FINISH in session 13 - see the changelog'
Write-Host '  pnpm test          # still never executed, 13 sessions in'
Write-Host '  pnpm --filter native android'
