# 11 — Entitlements & Paywall

Gates added to features that already work. No hard blocks anywhere.

**Branch:** `feat/entitlements`
**Depends on:** 06, 08, 09, 10
**Reference:** `systems/05-entitlements.md`, D-002

> **Blocked on you:** RevenueCat project created, `calma_plus_monthly` / `calma_plus_annual` / `calma_plus_lifetime` configured in App Store Connect and Google Play Console, and the `plus` entitlement mapped to all three. T03 cannot start until this exists.

---

## T01 — Install and configure RevenueCat

- [x] `5eee604`
- **Commit:** `feat(entitlement): install and configure revenuecat sdk`
- **Touches:** `apps/native/package.json`, `apps/native/src/features/entitlement/purchases.ts`, `packages/env/src/index.ts`
- **Done when:** `react-native-purchases` is configured in **anonymous mode** at boot without blocking it, `logIn()` is never called anywhere in the codebase, and API keys are zod-validated through `@calma/env` with no key committed.


**Note (session 13):** `react-native-purchases` was already in
`apps/native/package.json` and in `node_modules` (session 12 verified it), so
this todo is really the configure call and the env validation.

Both API keys are OPTIONAL in `@calma/env`. A missing key is a legitimate
state, not a misconfiguration -- it is what this repo looks like before anyone
has a RevenueCat project, and what CI looks like. Requiring them would mean
the app cannot boot without a billing account, which for an app whose entire
relief path is free is the wrong dependency. An absent key resolves to exactly
the same place as an SDK failure: free tier, every paywall suppressed.

`logIn()` appears nowhere and `configure` is called with no `appUserID`.
Passing one -- even a random one -- is how an app without accounts acquires an
identity by accident, and that identity would then travel with every receipt.

---

## T02 — Build the entitlement store with caching

- [x] `62461fe`
- **Commit:** `feat(entitlement): add entitlement store with offline cache`
- **Depends on:** T01
- **Touches:** `apps/native/src/features/entitlement/store.ts`
- **Done when:** tier is cached in `calma.cache`, a cached Plus user stays Plus with no network indefinitely, refresh on foreground is throttled to once per hour, and SDK init failure yields free tier **with paywalls suppressed**.


**Note (session 13):** the cache STANDS INDEFINITELY with no network. There
is no staleness window and no expiry, deliberately: the failure mode of a
wrong expiry is that someone who paid opens the app on a plane and finds
their features gone, and the opposite error costs a few pence and upsets
nobody.

Hydration is not part of `boot()`. Boot decides whether the app can open at
all and a billing SDK has no business in that chain. It runs from a
`useEntitlement()` effect in `app/_layout.tsx`, alongside the foreground
refresh, which the store throttles to once an hour -- so calling it on every
foreground is not polling.

---

## T03 — Wire offerings and purchase flow

- [ ]
- **Commit:** `feat(entitlement): wire offerings and purchase flow`
- **Depends on:** T02 · **Blocked on:** store configuration
- **Touches:** `apps/native/src/features/entitlement/purchases.ts`
- **Done when:** offerings load and render `product.priceString` with no hardcoded prices; purchase completes and updates the tier; cancellation dismisses silently with no retention prompt; failure shows "That didn't go through. Nothing was charged." with no error code.


**Note (session 13):** the code is written -- `fetchPackages`, `purchase` and
the failure/cancel handling are all in `purchases.ts` and wired into
`PlansScreen`. It is left UNTICKED because the "Done when" clause is about
behaviour that cannot exist yet: with no RevenueCat project and no configured
products, `getOfferings()` returns nothing, no purchase can complete, and none
of it has been executed once.

What can be said: no price is hardcoded anywhere, `product.priceString` is the
only source, cancellation returns `{ kind: 'cancelled' }` and is dismissed
silently with no retention prompt, and failure shows one plain sentence with
no error code. Tick this when the store products exist and a sandbox purchase
has actually gone through.

---

## T04 — Add restore purchases

- [ ]
- **Commit:** `feat(entitlement): add restore purchases`
- **Depends on:** T03
- **Touches:** `PlansScreen.tsx`, `apps/native/src/features/settings/*`
- **Done when:** restore is reachable from both the Plans screen and Settings, succeeds without an account, and Settings explains in one sentence that restore is the only recovery path after a device change.


**Note (session 13):** restore IS on the Plans screen and works without an
account. It is NOT in Settings, because there is no Settings screen (plan 14
is 0/11), and that is half of what this todo asks for -- including the
sentence explaining that restore is the only recovery path after a device
change. Left unticked.

---

## T05 — Build the `useLimit` hook

- [x] `c2f99f1`
- **Commit:** `feat(entitlement): add uselimit hook`
- **Depends on:** T02, `01-foundation` T05
- **Touches:** `apps/native/src/features/entitlement/useLimit.ts`
- **Done when:** `useLimit('worry' | 'journal')` returns `{ used, allowed, atLimit, record() }` derived from the repository day-indexes, with no separate counter that could drift.


**Note (session 13):** `used` is recomputed from the repository day/week
indexes on every read. There is no stored counter anywhere, which is what the
"no separate counter that could drift" clause asks for -- and the direction it
would drift is toward telling someone they have used something they have not.

`useLimit` returns `decide()` as well as `atLimit`, because those answer
different questions: whether the allowance is spent, and whether this is a
moment when anything commercial may be shown at all. The second is usually
"no".

**Not yet called from anywhere.** T08 and T09 are the call sites and are not
built. The hook and the gate are, and both are tested.

---

## T06 — Build the paywall sheet

- [x] `c2f99f1`
- **Commit:** `feat(entitlement): build paywall sheet`
- **Depends on:** T03
- **Touches:** `apps/native/src/features/entitlement/PaywallSheet.tsx`
- **Done when:** the sheet leads with acknowledgement before the limit, "See plans" and "Not now" are equal in weight and timing, the tier-limit bell plays at 0.5 volume with a `Soft` haptic, and there are no countdowns or scarcity cues.


**Note (session 13):** there is no design for this sheet -- i1 is the Plans
screen, not the limit card. Built from `systems/05-entitlements.md`'s "Card
contents" list, in g1's sheet material (the only sheet the design set draws):
`surface-offer` on `border-offer`, radius 32, shadow cast upward.

The 0.5 volume lives in `soundManifest`, not at the call site. A call site
that could raise it is a call site where someone eventually will.

Acknowledgement first, then the limit, then one sentence about Plus. A card
that opens with what you cannot do has told an anxious person they ran out of
something, and the acknowledgement afterwards then reads as consolation.

---

## T07 — Add paywall frequency capping

- [x] `62461fe`
- **Commit:** `feat(entitlement): cap paywall frequency to once per limit per day`
- **Depends on:** T06
- **Touches:** `apps/native/src/features/entitlement/paywallGate.ts`
- **Done when:** each limit type shows the sheet at most once per calendar day; subsequent hits show a single inline line instead; markers reset at local midnight.


**Note (session 13):** built as `paywallDecision`, a pure function returning
`'sheet' | 'inline' | 'silent'`, with the live registry split into
`gateStore.ts`. The split is not tidiness: `apps/native/vitest.config.ts` runs
pure Node with no renderer, and a rule that can only be checked by mounting a
component tree is a rule that stops being checked.

Markers reset at LOCAL midnight rather than after 24 hours -- a new day
replaces the list instead of appending to it. Each limit kind is on its own
schedule, so hitting the worry limit does not spend the journal limit's one
showing.

---

## T08 — Gate worry capture

- [ ]
- **Commit:** `feat(entitlement): gate worry capture at three per day`
- **Depends on:** T05, T06, `08-worry-postponement` T02
- **Touches:** `apps/native/src/features/worry/CaptureField.tsx`
- **Done when:** the field is never disabled; the 4th capture attempt triggers the worry paywall copy; the window and all pending worries remain fully usable; and the count resets at local midnight.

---

## T09 — Gate journal entries

- [ ]
- **Commit:** `feat(entitlement): gate journal saves at two per week`
- **Depends on:** T05, T06, `09-journaling` T08
- **Touches:** `apps/native/src/features/journal/EditorScreen.tsx`
- **Done when:** the editor always opens and drafts always save; the 3rd **save** in an ISO week triggers the paywall; the written content stays on screen and is retained as a draft rather than being lost.

---

## T10 — Gate history, search, and trends

- [ ]
- **Commit:** `feat(entitlement): gate history, search and trends`
- **Depends on:** T05, `10-progress-dashboard` T06, `09-journaling` T12
- **Touches:** `HistoryList.tsx`, `SearchScreen.tsx`, `TrendChart.tsx`
- **Done when:** free tier sees the current week fully and older sections show a soft prompt rather than blurred or teased content — no fake-blur dark pattern.

---

## T11 — Build the custom ratio builder

- [x] `c2f99f1`
- **Commit:** `feat(entitlement): build custom breathing ratio builder`
- **Depends on:** T05, `06-breathing-engine` T14
- **Touches:** `apps/native/src/features/breathing/CustomRatio.tsx`
- **Done when:** Plus users can set inhale/hold/exhale/hold within the bounds from `01-foundation` T06, the ratio persists to prefs, it can only be changed outside a session, and free users see the custom paywall copy.


**Note (session 13):** built as `features/breathing/CustomRatio.tsx` at
`/custom-rhythm`, and d1's custom row now opens it instead of being inert.

**BUILT UNGATED**, on the owner's session-13 decision: free users reach the
screen. The `useTier` check is a one-line addition at the row and at "Use this
one" when the rest of plan 11 lands. The row's own second line ("yours to set,
with Plus") is currently the whole of what d1 says about money.

Bounds come from `customRatioProblem` in `@calma/domain` -- the same
validation `patternFromCustomRatio` uses -- so a ratio this screen accepts can
never be one the engine rejects. Out of range is PREVENTED by the steppers
rather than reported after: the plus stops adding and a plain sentence says
why. Nothing turns red and there is no error state.

DIVERGENCE: d7's caption says "the orb follows as you change it" and the orb
here runs its own ambient loop instead. Driving it from the live numbers would
restart the animation on every tap, which is the one thing an orb must never
do (D-004, and the note in `useOrbAnimation`). Making it genuinely follow
means building a timeline from the draft ratio and rescheduling only on a
settled value -- real work, and worth doing, but not worth a stuttering orb in
the meantime.

---

## T12 — Add the paywall interruption guard

- [x] `62461fe`
- **Commit:** `fix(entitlement): prevent paywall from interrupting active tasks`
- **Depends on:** T06, T07
- **Touches:** `apps/native/src/features/entitlement/paywallGate.ts`
- **Done when:** the paywall is suppressed and queued to the next boundary whenever a breathing or panic session is running (including its ending), the worry window is open at any step, the journal editor is open at any step, **any text field in the app has focus**, an animation is mid-flight, or a session/window/entry completed within the last few seconds. A test asserts each condition. The one 1★ review that ended *"I hope no one ever downloads this game again"* was not about the existence of monetisation — the reviewer had accepted all of it — it was about something commercial appearing mid-task (`plans/19-review-findings.md` R4).


**Note (session 13):** every condition listed here has its own assertion in
`features/entitlement/__tests__/paywallGate.test.ts` -- fifteen in total,
including two the plan does not name: a completion timestamp in the FUTURE
(clock changes move `Date.now()` backwards, and this must fail toward silence
rather than toward selling), and a suppressed build staying silent even on a
repeat hit.

Blockers are a deny-list of moments rather than an allow-list of screens, so a
new screen is blocked the moment it registers a hold and nobody has to
remember to add it to a list. `'field'` covers "any text field in the app has
focus", which catches the cases nobody enumerates.

An in-flight blocker returns `'silent'`, not `'inline'`. "That's 3 for today"
is still the app talking about money while someone is mid-task.

**The holds are not yet placed.** `usePaywallHold` exists and no screen calls
it. Until the capture field, the session screens, the worry window and the
editor each register one, the gate is a correct mechanism with nothing feeding
it. That is the first thing to do when plan 11 resumes.

---

## T13 — Build the Plans screen and guard dev overrides

- [x] `c2f99f1`
- **Commit:** `feat(entitlement): build plans screen and guard dev overrides`
- **Depends on:** T03
- **Touches:** `apps/native/src/app/paywall.tsx`, `PlansScreen.tsx`, `apps/native/src/features/settings/DevMenu.tsx`
- **Done when:** monthly, annual, and lifetime are presented with equal prominence and lifetime is not buried; and a build-time assertion fails the release build if the `__DEV__` tier-override menu is reachable in production.


**Note (session 13):** `app/paywall.tsx` now renders `PlansScreen` (i1) or
`PlusActiveScreen` (i2) depending on tier. One route, because they are the
same destination -- "my Plus" -- and splitting them would mean every caller
had to know which applied and would get it wrong the moment a purchase
completed. The route's sheet detent went 0.55 -> 0.92; i1 is a full screen.

**DESIGN / SYSTEMS CONFLICT, RESOLVED BY THE OWNER.** i1 draws ONE price row
("Monthly GBP 4") and its caption says "one price, no annual-vs-monthly
savings maths". `systems/05-entitlements.md` says "Lifetime is offered and is
not buried", and this todo asks for three at equal prominence. Design wins on
appearance and systems wins on behaviour spanning screens -- "which products
exist" is the second kind. The owner chose three rows in exactly i1's row
treatment, all identical, with none of the comparison furniture the caption
forbids. If that is ever reversed, the place to change it is `PlansScreen`'s
`packages.map`, not the token layer: there is exactly one price surface and
deliberately no highlighted variant of it.

**i2 DROPS TWO ROWS, ALSO ON THE OWNER'S DECISION.** i2 draws "Payment
method  4417" and "Receipts". Anonymous-mode RevenueCat means the app
never sees a card number and has no receipt list; the store holds both.
Rendering masked digits would mean inventing them. "Stop Plus" survives and
deep-links to the platform subscription page, which is the only place either
store allows a cancellation.

The `__DEV__` tier override lives in the store behind an `if (!__DEV__)
return`. The build-time assertion this todo also asks for is NOT written --
there is no Settings screen to reach it from yet (plan 14), so there is
nothing to assert about reachability. Left explicitly undone rather than
faked.
