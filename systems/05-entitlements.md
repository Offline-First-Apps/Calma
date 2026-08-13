# Entitlements — Free & Calma Plus

The rule that governs everything here: **no hard blocks, and never a paywall between someone and calm.** Panic, paced breathing, and the physiological sigh are unlimited forever on free. What Plus buys is depth, memory, and configurability.

---

## Tier matrix

| Capability | Free | Plus |
|---|---|---|
| Panic button | Unlimited | Unlimited |
| Paced breathing | Unlimited, all 3 presets | Unlimited + custom ratio builder |
| Physiological sigh | Unlimited | Unlimited |
| Worry capture | 3/day | Unlimited |
| Worry window | 15 min, fixed | 15 / 20 / 30 min, configurable |
| Journal entries | 2/week | Unlimited |
| Journal history & search | Current week only | Full history + search |
| Progress dashboard | Current week + streak | Full history, monthly trends, session stats |
| Breathing visuals | Orb | Orb + wave + bloom *(backlogged)* |
| Notifications | Worry window reminder | + streak nudges, weekly check-in |

---

## Limit accounting (D-009)

Pure functions in `@calma/domain/tier.ts`, so they're unit-testable with no device.

```ts
const LIMITS = {
  free: { worriesPerDay: 3, journalEntriesPerWeek: 2, worryWindowMinutes: [15] },
  plus: { worriesPerDay: Infinity, journalEntriesPerWeek: Infinity,
          worryWindowMinutes: [15, 20, 30] },
};
```

- **Day key:** `YYYY-MM-DD` in the device's current timezone, computed at read time.
- **Week key:** ISO week `YYYY-Www`, **Monday start**.
- Counts derive from the repository day-indexes — there is no separate counter to drift out of sync.
- A **draft** journal entry does not consume the weekly allowance. Only a save does. Someone can start writing whenever they want.
- A **released** or **processed** worry does not free up a capture slot. The limit is on capture, not on pending volume.
- Timezone travel may shorten a period. Accepted. Counts never go negative and an allowance already granted is never revoked mid-session.

---

## What happens at a limit

Never a disabled button. Never a lock icon. The action is attempted, then a gentle card appears.

**Sequence:** user taps → `tierLimit` sound at 0.5 volume + `Soft` haptic → paywall card animates up as a bottom sheet.

**Card contents:**
- An acknowledgement of what they *did*, before anything about the limit.
- One sentence on what Plus adds.
- **"See Plans"** — primary, `amber.400`.
- **"Not Now"** — quiet text button, dismisses and returns home.

Journal example, verbatim from the blueprint:

> "You've done 2 entries this week — that's solid. With Calma Plus, you can write as often as you like and look back on your progress over time."

Worry capture:

> "That's 3 for today. You can still open your window and work through them. With Calma Plus, you can capture as many as you need."

Note that the worry version points at something the user can still do. A limit should never be a dead end.

**Rules.**
- The paywall appears at most **once per limit type per day**. Hitting the limit a second time shows a one-line inline note instead of the sheet. Repeated selling to an anxious person is not acceptable.
- "Not Now" is never smaller, greyer, or slower to appear than "See Plans".
- No countdown timers, no "limited offer", no fake scarcity, no guilt copy.
- **No free trial.** The free tier is the ongoing demonstration.

---

## RevenueCat integration (D-002)

`react-native-purchases`.

```
apps/native/src/features/entitlement/
├── purchases.ts        SDK init, offerings, purchase, restore
├── store.ts            useEntitlementStore
├── useTier.ts          () => 'free' | 'plus'
├── useLimit.ts         (kind) => { used, allowed, atLimit, record() }
├── PaywallSheet.tsx
└── PlansScreen.tsx
```

### Initialisation

- `configure({ apiKey })` at boot, **non-blocking** — boot does not wait on it (`01-architecture.md`).
- **Anonymous mode only.** `logIn()` is never called. No user identifier is ever sent. Calma has no accounts and must not create a pseudo-identity.
- API keys come from `@calma/env`, validated with zod, injected at build time. Public SDK keys only.

### Offline & failure posture

The entitlement is cached in `calma.cache` as `{ tier, checkedAt }`.

| Situation | Behaviour |
|---|---|
| No network at boot | Cached tier stands, indefinitely. A paying user is never downgraded because their train went into a tunnel. |
| SDK init fails | Treat as free, but **suppress all paywall prompts** — don't sell to someone whose purchase would fail anyway. |
| Purchase fails | Plain sentence, no error code, no red. "That didn't go through. Nothing was charged." |
| Purchase cancelled | Silent dismissal. No "are you sure?", no retention offer. |

Entitlement is refreshed on app foreground, throttled to once per hour.

### Products

| Identifier | Type |
|---|---|
| `calma_plus_monthly` | auto-renewing monthly |
| `calma_plus_annual` | auto-renewing annual |
| `calma_plus_lifetime` | non-consumable |

Entitlement identifier: **`plus`**. All three grant it. Prices are read from the RevenueCat offering and rendered with `product.priceString` — never hardcoded, never converted client-side.

**Lifetime is offered and is not buried.** For a local-first, no-account app, a subscription-only model sits badly with the product's own promise. Someone who wants to buy this once and be done should be able to.

### Restore purchases

A visible row on the Plans screen and in Settings. Required by both stores, and genuinely necessary here — with no accounts, restore is the *only* recovery path after a device change. Settings states this plainly.

---

## Testing entitlements

`__DEV__`-only Settings rows (hidden behind a 5-tap on the version number):

- Force tier: free / plus / auto
- Reset today's worry count
- Reset this week's journal count
- Reset "paywall shown" markers

This must never ship enabled in production. A build-time assertion in `plans/11-entitlements-paywall.md` guards it.
