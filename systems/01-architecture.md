# Architecture

## Monorepo

Turborepo + pnpm workspaces. Existing scaffold, extended — not replaced.

```
calma/
├── apps/
│   ├── native/          Expo 57 · RN 0.86 · expo-router · uniwind · heroui-native
│   └── web/             Next 16 — marketing site only (D-005)
├── packages/
│   ├── config/          shared tsconfig / lint config
│   ├── env/             zod-validated env (RevenueCat keys only)
│   ├── ui/              web-only components (Next.js)
│   ├── db/              NEW — repository ports + MMKV adapter
│   ├── domain/          NEW — entities, tier rules, breathing patterns, pure logic
│   └── tokens/          NEW — design tokens shared by native + web
├── plans/               gitignored
└── systems/             gitignored
```

### Package boundaries

| Package | May import | Must never import |
|---|---|---|
| `domain` | nothing (zero deps except `zod`) | React, React Native, MMKV, anything platform |
| `db` | `domain`, `react-native-mmkv`, `expo-secure-store` | React, any `features/` code |
| `tokens` | nothing | anything |
| `apps/native` | all of the above | `react-native-mmkv` directly |

`domain` being dependency-free is the point: tier rules, streak calculation, breathing pattern maths, and limit-window logic are all pure functions that can be unit-tested in Node with no simulator.

**Enforcement.** An ESLint `no-restricted-imports` rule blocks `react-native-mmkv` outside `packages/db`. Added in `plans/01-foundation.md`.

---

## Native app structure

```
apps/native/src/
├── app/                      expo-router routes only — thin, no logic
│   ├── _layout.tsx           providers, font gate, storage boot gate
│   ├── (tabs)/
│   │   ├── _layout.tsx       tab bar + PanicButton overlay
│   │   ├── index.tsx         Home
│   │   ├── breathe.tsx       Breathe
│   │   ├── write.tsx         Write — new entry, drafts, past entries
│   │   ├── worries.tsx       Worries
│   │   └── progress.tsx      Progress
│   ├── session/[pattern].tsx full-screen breathing (modal, no tab bar)
│   ├── panic.tsx             full-screen panic session
│   ├── worry-window.tsx      full-screen guided triage
│   ├── journal/[id].tsx      journal editor
│   ├── onboarding.tsx        twelve-step onboarding, visual-first
│   ├── settings/…
│   └── paywall.tsx           modal
├── features/
│   ├── breathing/            engine, orb, patterns, SUDS
│   ├── worry/                capture, window, triage
│   ├── journal/              template, editor, drafts
│   ├── progress/             stats, streak, charts
│   ├── entitlement/          RevenueCat, tier gates, paywall
│   ├── onboarding/
│   └── settings/
├── components/               cross-feature primitives (Button, Card, Sheet…)
├── lib/                      audio, haptics, notifications, time, ids
└── theme/                    uniwind config consuming @calma/tokens
```

### The route/feature split

`app/` files are routes. They read params, render one feature component, and nothing else. A route file over ~40 lines is a smell. This keeps expo-router's file conventions from leaking into domain code and makes features testable without a router.

---

## Navigation

Five tabs, plus full-screen presentations that hide the tab bar.

| Tab | Route | Contents |
|---|---|---|
| Home | `/` | Greeting, one obvious next thing, today's state |
| Breathe | `/breathe` | Pattern picker: 4-7-8, 5-5-5-5, physiological sigh, custom (Plus) |
| Write | `/write` | Start writing, drafts, past entries |
| Worries | `/worries` | Capture field, pending count, window countdown, "Open window" |
| Progress | `/progress` | Streak, this week, history (Plus) |

**Why Write is a tab** (D-015). Journaling was originally reachable only as an offer after a high-distress breathing session, which made it structurally *"what you do when breathing didn't work"*. It isn't — for some people it's the primary tool. The post-session offer remains; it's just no longer the only door.

**Full-screen (no tab bar, no panic FAB):** `session/[pattern]`, `panic`, `worry-window`, `onboarding`, `paywall`.

**Panic FAB** renders in `(tabs)/_layout.tsx` as a sibling of the Slot, so it survives tab switches without remounting. Bottom-right, above the tab bar, respects safe area. See D-006.

### Back-navigation rules

- During an active breathing session, hardware back / swipe-down asks *"Stop here?"* — it never dumps the user out mid-cycle without acknowledgement.
- During the worry window, back leaves the window with remaining worries still pending. No confirmation, no penalty.
- The panic session is dismissible at any time with a single visible "I'm okay" button. Never trap someone in a screen.

---

## Boot sequence

`app/_layout.tsx` gates render until all of these resolve. Splash screen stays up throughout.

1. `SplashScreen.preventAutoHideAsync()`
2. Load Figtree fonts (`expo-font`)
3. Read or generate the MMKV encryption key from SecureStore → initialise storage (`packages/db`)
4. Run schema migrations
5. Hydrate Zustand stores from repositories (prefs, pending worry count, streak)
6. Initialise RevenueCat and read cached entitlement — **non-blocking**, boot does not wait on network
7. Rehydrate any interrupted session state
8. `SplashScreen.hideAsync()` → route to `/onboarding` if first launch, else `/`

**Failure policy.** If step 3 fails (SecureStore unavailable, e.g. no device passcode on some Android configurations), the app boots into a degraded read-only state with a plain explanation rather than crashing. Storage failure never presents a stack trace to someone in distress.

---

## State

Zustand, one store per feature, `useShallow` selectors at every call site.

| Store | Holds |
|---|---|
| `usePrefsStore` | name, locale, worry window time & duration, breath ratios, theme, sound/haptics toggles, onboarding answers |
| `useEntitlementStore` | tier, limit counters, RevenueCat offering cache |
| `useSessionStore` | active breathing session — pattern, phase, cycle count, pre-SUDS |
| `useWorryStore` | pending worries, window status, triage progress |
| `useJournalStore` | drafts, this-week count |

**Hard rule (D-004).** Animation state never lives in Zustand. The orb reads Reanimated shared values and derived values on the UI thread. A store write during an inhale is a dropped frame the user can feel.

**Persistence.** Stores do not auto-persist. Writes are explicit: action → repository → store update. This keeps the write path auditable, which matters when the data is someone's private worries.

---

## Session lifecycle & interruption

A breathing session must survive backgrounding, a phone call, and a hard kill.

- On phase transition, write a lightweight `session:active` record to MMKV (synchronous, cheap).
- On `AppState` → background, keep the session logically running but pause the animation and haptics.
- On foreground, if elapsed time exceeds the session length, close it out gracefully rather than resuming into the middle.
- On cold boot with an orphaned `session:active`, discard it silently. Never confront someone with *"you abandoned a session."*

---

## Offline & failure posture

There is no network layer to fail. The only failure modes that exist:

| Failure | Behaviour |
|---|---|
| RevenueCat unreachable | Cached entitlement stands. Free users unaffected. Plus users stay Plus. |
| Notification permission denied | Everything works; worry window is opened manually. Never re-prompt more than once. |
| Storage write fails | Retry once, then show *"Couldn't save that just now."* Content stays on screen so it isn't lost. |
| Audio session unavailable | Silently skip the sound. Never surface an audio error. |

---

## Testing

- **Unit (Vitest, Node):** `packages/domain` — tier limits, streak calc, ISO week keys, pattern timing, triage state machine. Fast, no simulator.
- **Repository (Vitest + MMKV mock):** `packages/db` — CRUD, index integrity, migrations.
- **Component (RN Testing Library):** capture flows, triage flow, paywall gate.
- **Manual matrix:** every feature verified on one iOS device and one mid-range Android device before its plan file is closed.

No E2E harness in V1.
