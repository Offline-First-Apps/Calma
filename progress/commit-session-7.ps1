# Session 7 -- i18n (plan 18) and the storage layer (plan 03).
#
# Everything is already written to disk. This stages, commits, and ticks the
# plan-file checkboxes with each short SHA.
#
# ASCII only, on purpose: Windows PowerShell 5.1 reads a .ps1 as ANSI unless it
# has a BOM, which is how session 6's commit script mangled every em dash it
# wrote into a file.

$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\kinzi\Desktop\projects\calma'
Set-Location $repo

function Assert-Ok($what) {
  if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" }
}

function Commit-Todo {
  param([string]$Plan, [string]$Tag, [string]$Message, [string[]]$Paths)

  git add -- $Paths
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

# --- 0. locks -----------------------------------------------------------
# The sandbox cannot delete files, so git strands its lock files there.
Remove-Item -Force -ErrorAction SilentlyContinue '.git\index.lock'
Remove-Item -Force -ErrorAction SilentlyContinue '.git\HEAD.lock'
Get-ChildItem '.git\objects' -Recurse -Filter 'tmp_obj_*' -ErrorAction SilentlyContinue |
  Remove-Item -Force -ErrorAction SilentlyContinue

git reset -q

# --- 1. finish plan 01 --------------------------------------------------
# Session 6's script wrote this file through PowerShell and doubly-encoded the
# em dashes in it. Its own commit, because it belongs to no todo.
git add -- 'packages/domain/src/index.ts'
$tmp = [System.IO.Path]::GetTempFileName()
[System.IO.File]::WriteAllText($tmp, @'
fix(domain): repair mojibake in the package doc comment

Windows PowerShell 5.1 reads a .ps1 as ANSI unless it carries a BOM, so the
em dashes in the previous session's commit script were written into this file
doubly-encoded. Rewritten as UTF-8; session scripts are ASCII-only from now on.
'@ -replace "`r`n", "`n")
git commit -q -F $tmp
Assert-Ok 'commit mojibake fix'
Remove-Item $tmp -Force

git checkout -q main
Assert-Ok 'checkout main'
git merge --no-ff -m "Merge branch 'chore/foundation'" chore/foundation
Assert-Ok 'merge chore/foundation'

# --- 2. plan 18: i18n ---------------------------------------------------
Write-Host 'Plan 18 -- i18n' -ForegroundColor Cyan
git checkout -q -b feat/i18n
Assert-Ok 'checkout -b feat/i18n'

Commit-Todo '18-i18n.md' 'T01' @'
chore(i18n): scaffold i18n package

Only `index.ts` touches i18next. The registry, the fallback chain, the
formatters and the pseudo-locale are plain TypeScript with no dependencies at
all, so they can be unit-tested in Node and reused from the web app, which has
no i18next instance.

Plan: plans/18-i18n.md#T01
'@ @('packages/i18n/package.json', 'packages/i18n/tsconfig.json')

Commit-Todo '18-i18n.md' 'T02' @'
feat(i18n): add language registry and fallback chain

The registry carries each language's name in its own language. Someone
looking for their language does not read the current one, so "Deutsch" is
right and "German" is not.

`degradationChain` and `fallbackChain` are separate deliberately. English is
the fallback of every tag, so appending it per tag makes a phone set to Welsh
then German resolve to English -- the first tag's fallback wins before German
is ever considered. Degradation runs across every device tag first; English
comes last, once.

Nothing here can return a blank string. A missing translation shows English.

Plan: plans/18-i18n.md#T02
'@ @(
  'packages/i18n/src/supported.ts',
  'packages/i18n/src/detect.ts',
  'packages/i18n/src/detect.test.ts'
)

Commit-Todo '18-i18n.md' 'T03' @'
feat(i18n): initialise i18next with typed resource keys

Bundles are compiled in rather than fetched, so resolution is synchronous and
there is no window in which a screen can render untranslated.

The module augmentation makes a mistyped key a check-types failure instead of
a raw key on someone's screen.

Plan: plans/18-i18n.md#T03
'@ @(
  'packages/i18n/src/resources.ts',
  'packages/i18n/src/index.ts',
  'packages/i18n/src/types.d.ts'
)

Commit-Todo '18-i18n.md' 'T04' @'
test(i18n): assert intl availability at boot

The failure worth catching is not a missing Intl -- a truthiness check finds
that. It is an Intl that exists and carries no locale data, which degrades to
English-formatted dates inside a translated interface and reads as broken
rather than untranslated. So the check formats the same date in two languages
and compares.

Fails loudly in dev, silent in production: an English date is bad, a boot loop
is worse.

Plan: plans/18-i18n.md#T04
'@ @('packages/i18n/src/intl.ts')

Commit-Todo '18-i18n.md' 'T07' @'
refactor(i18n): migrate copy modules to locale json

Every string from systems/07-copy-and-tone.md, in nine namespaces mirroring
the feature folders.

The doc's global key prefixes become namespaces: `breathe.phase.inhale` is
`breathing:phase.inhale`, and `panic.*` and `suds.*` join it there. `skip` and
`continue` moved to `common` -- duplicating a button label per namespace is a
translation smell.

`window.summary` became four keys. ICU pluralises on `count` and nothing else,
so one string carrying three counts would have read "1 were within your
control". Each key is now a whole sentence with its own plural forms; the
amendment is recorded in the copy doc.

The three feeling faces stay in the component, which lets the tone test forbid
emoji absolutely instead of maintaining an exception list.

Plan: plans/18-i18n.md#T07
'@ @('packages/i18n/src/locales/en')

Commit-Todo '18-i18n.md' 'T08' @'
feat(i18n): add icu plural forms for count-bearing strings

Plus a test that fails if a string containing {{count}} has no plural forms.
"1 things waiting" is a tone failure, not just a grammar one, and it is the
kind that survives review because everyone reads the plural case.

Plan: plans/18-i18n.md#T08
'@ @('packages/i18n/src/bundles.test.ts')

Commit-Todo '18-i18n.md' 'T09' @'
feat(i18n): add locale-aware date, time and number formatters

12h versus 24h is a locale property. Hardcoding HH:mm is how an app shows
19:00 to someone whose phone has said 7:00 pm their whole life.

The formatters reject `dayKey` and `weekKey` outright. Those are storage
formats, and one reaching a display component should be a loud failure in a
test rather than a wrong-looking date on someone's screen -- `dayKeyToDate` is
the way through.

No duration helper: "4 minutes" is a plural key, not string maths.

Plan: plans/18-i18n.md#T09
'@ @('packages/i18n/src/format.ts', 'packages/i18n/src/format.test.ts')

Commit-Todo '18-i18n.md' 'T10' @'
chore(i18n): enforce externalised strings and key parity

The JSX rule is hand-written rather than pulled from eslint-plugin-react: one
small rule, no fifty unasked-for opinions. It catches both <Text>Hi</Text> and
<Text>{'Hi'}</Text>.

Parity and tone run as tests, which means the plan 16 tone audit is mechanical
and cannot be skipped: zero exclamation marks, no all-caps, no emoji, no
diagnosis, no guilt, and nothing anywhere about losing a streak.

Plan: plans/18-i18n.md#T10
'@ @(
  'packages/config/eslint/calma-plugin.js',
  'packages/config/eslint/base.js',
  'packages/i18n/src/pseudo.ts'
)

Commit-Todo '18-i18n.md' 'T11' @'
chore(i18n): forbid i18n imports in domain package

A pure function that returns "3 days in a row" is a pure function that cannot
be translated. Domain returns keys and data; the sentence is assembled where
the locale is known.

Plan: plans/18-i18n.md#T11
'@ @('packages/config/eslint/base.js')

Commit-Todo '18-i18n.md' 'T12' @'
docs(i18n): add translator brief

A translator working from bare strings will produce something accurate and
cold, which is the wrong product. The brief carries the tone guide, the word
list, the hard rules, and per-key notes for the dozen keys whose intent is
invisible from the key alone -- why "Nothing yet" keeps its "yet", why the
journal asks what you would tell a friend, why the privacy line is blunt.

Plan: plans/18-i18n.md#T12
'@ @('packages/i18n/TRANSLATORS.md')

git checkout -q main
git merge --no-ff -m "Merge branch 'feat/i18n'" feat/i18n
Assert-Ok 'merge feat/i18n'

# --- 3. plan 03: storage ------------------------------------------------
Write-Host 'Plan 03 -- storage' -ForegroundColor Cyan
git checkout -q -b feat/storage-layer
Assert-Ok 'checkout -b feat/storage-layer'

Commit-Todo '03-storage-layer.md' 'T01' @'
chore(db): scaffold db package with ports and adapters structure

Repositories are written against a small KeyValueStore interface rather than
against MMKV. The MMKV adapter provides one and MemoryStore provides another,
which is what lets indexes, validation, repair, aggregates and migrations all
be tested in Node with no simulator.

MemoryStore.failWritesAfter exists for one reason: the index invariant is only
believable if a write can actually be interrupted.

Plan: plans/03-storage-layer.md#T01
'@ @(
  'packages/db/package.json',
  'packages/db/tsconfig.json',
  'packages/db/src/kv.ts',
  'packages/db/src/keys.ts'
)

Commit-Todo '03-storage-layer.md' 'T04' @'
feat(db): define repository port interfaces

Async signatures over a synchronous store. It costs nothing today and means a
SQLite adapter would need no call-site changes.

Plan: plans/03-storage-layer.md#T04
'@ @('packages/db/src/ports')

Commit-Todo '03-storage-layer.md' 'T05' @'
feat(db): add index maintenance helpers

MMKV has no transactions, so ordering is the only guarantee available: write
the record first, then the index. A crash between the two leaves an orphan
record, which is invisible and repairable, rather than a dangling pointer,
which is a crash on read.

Deletion reverses it for the same reason.

Ids are ULID-style, so a sorted index is a chronological one and no index
needs to store a timestamp.

Plan: plans/03-storage-layer.md#T05
'@ @('packages/db/src/adapters/mmkv/indexes.ts')

Commit-Todo '03-storage-layer.md' 'T06' @'
feat(db): implement prefs repository

Prefs outlive app versions, so the stored object is treated as a bag of
maybe-valid fields. If the whole thing fails to parse, each field is validated
on its own and the good ones are kept -- losing someone's chosen worry window
because an unrelated field went bad would be a poor trade.

Plan: plans/03-storage-layer.md#T06
'@ @(
  'packages/db/src/adapters/mmkv/prefs.mmkv.ts',
  'packages/db/src/adapters/mmkv/validate.ts'
)

Commit-Todo '03-storage-layer.md' 'T07' @'
feat(db): implement worry repository

Counts come from the day index rather than a stored counter, so there is
nothing that can drift out of sync with the records.

A released worry keeps its record and loses its place in the pending index.
The day's summary can still say how many were let go; what stops is the
waiting.

Plan: plans/03-storage-layer.md#T07
'@ @('packages/db/src/adapters/mmkv/worry.mmkv.ts')

Commit-Todo '03-storage-layer.md' 'T08' @'
feat(db): implement journal repository

Search scans the record keys rather than an index, so an entry whose index
entry was lost is still findable. It is deliberately not indexed: an inverted
index of someone's private journal is an extra copy of sensitive text on disk,
and a linear scan over a few hundred short records is sub-millisecond.

Drafts are excluded from the week list. A draft is someone mid-thought; it
does not consume the weekly allowance and does not belong in the list.

Plan: plans/03-storage-layer.md#T08
'@ @('packages/db/src/adapters/mmkv/journal.mmkv.ts')

Commit-Todo '03-storage-layer.md' 'T09' @'
feat(db): implement breathing session repository

A skipped pre-session rating is absent, not zero. Averaging null as 0 would
say that someone who declined to rate was perfectly calm, which would flatter
every number on the Progress tab.

Plan: plans/03-storage-layer.md#T09
'@ @('packages/db/src/adapters/mmkv/breathing.mmkv.ts')

Commit-Todo '03-storage-layer.md' 'T10' @'
feat(db): add weekly aggregate cache and streak calculation

Aggregates are recomputed on write. The Progress tab then renders from two
keys instead of thirty index reads, and the cost lands when someone finishes
something, where a few milliseconds are invisible.

Breathing does not qualify a day. Not because it matters less, but because it
is the one thing you can do in ten seconds without engaging, and a streak that
can be farmed stops meaning anything.

idx:window:completed is new. The streak needs to know a window was carried to
the end; state:worryWindow is transient, and it cannot be derived from the
worries because a window processes whatever was pending, which may all have
been captured on other days. Recorded in systems/02-data-layer.md.

Plan: plans/03-storage-layer.md#T10
'@ @(
  'packages/domain/src/streak.ts',
  'packages/domain/src/streak.test.ts',
  'packages/domain/src/time.ts',
  'packages/domain/src/index.ts',
  'packages/db/src/adapters/mmkv/aggregates.ts',
  'packages/db/src/keys.ts'
)

Commit-Todo '03-storage-layer.md' 'T11' @'
feat(db): add forward-only migration runner

A migration that throws leaves the version unincremented, so the next boot
retries that same step rather than skipping it. Destroying someone's journal
to recover from a bad release is not a trade available to us.

Plan: plans/03-storage-layer.md#T11
'@ @('packages/db/src/migrations/index.ts')

Commit-Todo '03-storage-layer.md' 'T12' @'
feat(db): validate records on read and add index repair

A corrupt record drops out of the collection and is de-indexed, so it is met
once rather than on every read. One malformed journal entry must never take
down the Progress tab.

The key is recorded, never the content. The content is someone's private
writing and does not belong in a log, a crash report, or a dev buffer -- there
is a test asserting exactly that.

repairIndexes rebuilds everything from a key scan. Indexes are derived data,
so running it can only improve matters.

Plan: plans/03-storage-layer.md#T12
'@ @(
  'packages/db/src/adapters/mmkv/repair.ts',
  'packages/db/src/adapters/mmkv/validate.ts'
)

Commit-Todo '03-storage-layer.md' 'T13' @'
feat(db): wire repository factory and add integration test suite

The factory takes stores rather than creating them, so the same line serves
the app, the tests, and the degraded read-only boot that happens when
SecureStore is unavailable.

storage.ts and key.ts stay out of the barrel: they import MMKV and Expo, and
re-exporting them here would drag React Native into every consumer, including
these tests. The app reaches them through @calma/db/native.

Plan: plans/03-storage-layer.md#T13
'@ @(
  'packages/db/src/index.ts',
  'packages/db/src/repositories.test.ts',
  'packages/db/src/adapters/mmkv/key.ts',
  'packages/db/src/adapters/mmkv/storage.ts'
)

git checkout -q main
git merge --no-ff -m "Merge branch 'feat/storage-layer'" feat/storage-layer
Assert-Ok 'merge feat/storage-layer'

Write-Host ''
Write-Host 'Committed. Now run: pnpm install; pnpm check-types; pnpm test; pnpm lint' -ForegroundColor Yellow
Write-Host 'Then commit pnpm-lock.yaml as: chore(deps): lock i18next and mmkv' -ForegroundColor Yellow
git log --oneline -12
