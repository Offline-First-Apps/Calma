import type { KeyValueStore } from '@calma/db';
import type { Tier } from '@calma/domain';
import { dayKey } from '@calma/domain';
import { create } from 'zustand';

import {
  configurePurchases,
  fetchTier,
  purchasesConfigurable,
} from './purchases';
import type { LimitKind } from './paywallGate';

/**
 * The entitlement, and the markers that keep it from being sold twice a day.
 *
 * A PAYING USER IS NEVER DOWNGRADED BY A TUNNEL.
 *
 * The tier is cached in `calma.cache` and the cache STANDS INDEFINITELY with
 * no network (systems/05-entitlements.md). There is no staleness window and
 * no expiry, because the failure mode of a wrong expiry is that someone who
 * paid opens the app on a plane and finds their features gone. The opposite
 * error -- a lapsed subscriber keeping Plus until their phone next has
 * signal -- costs a few pence and upsets nobody.
 *
 * The cache is in `cache`, not `data`: it is the one store that is not
 * encrypted, and a tier is not sensitive. Nothing about what someone wrote or
 * worried about goes near it.
 *
 * REFRESH IS THROTTLED TO ONCE PER HOUR, ON FOREGROUND ONLY.
 *
 * Nothing polls. There is no timer. The tier changes when someone buys
 * something or a subscription lapses, and neither of those needs to be
 * noticed within the minute.
 */

const CACHE_KEY = 'entitlement';
const MARKER_KEY = 'paywallShown';
const REFRESH_MS = 60 * 60 * 1000;

interface Cached {
  tier: Tier;
  checkedAt: number;
}

interface Markers {
  day: string;
  kinds: LimitKind[];
}

interface EntitlementState {
  tier: Tier;
  /** True when no purchase could succeed on this build. See `paywallGate`. */
  suppressed: boolean;
  hydrated: boolean;
  checkedAt: number | null;
  markerDay: string | null;
  shown: LimitKind[];
  /**
   * `__DEV__` only. Overrides the tier for testing
   * (systems/05-entitlements.md § Testing entitlements). Never settable in a
   * release build -- see the assertion in `PlansScreen`.
   */
  override: Tier | null;

  hydrate: (cache: KeyValueStore) => void;
  refresh: (cache: KeyValueStore, force?: boolean) => Promise<void>;
  setTier: (cache: KeyValueStore, tier: Tier) => void;
  markShown: (cache: KeyValueStore, kind: LimitKind, now?: number) => void;
  setOverride: (tier: Tier | null) => void;
}

function read<T>(cache: KeyValueStore, key: string): T | null {
  const raw = cache.getString(key);
  if (raw === undefined) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // A corrupt cache entry is not worth a word to anyone. Free tier is the
    // safe default and the next refresh corrects it.
    return null;
  }
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  tier: 'free',
  suppressed: true,
  hydrated: false,
  checkedAt: null,
  markerDay: null,
  shown: [],
  override: null,

  hydrate(cache) {
    const cached = read<Cached>(cache, CACHE_KEY);
    const markers = read<Markers>(cache, MARKER_KEY);

    // Configure here rather than in the boot gate's await chain: it is fired
    // and forgotten, and boot never waits on a billing SDK.
    const configured = purchasesConfigurable() && configurePurchases();

    set({
      tier: cached?.tier ?? 'free',
      checkedAt: cached?.checkedAt ?? null,
      markerDay: markers?.day ?? null,
      shown: markers?.kinds ?? [],
      suppressed: !configured,
      hydrated: true,
    });
  },

  async refresh(cache, force = false) {
    const { checkedAt, suppressed } = get();
    if (suppressed) return;

    const now = Date.now();
    if (!force && checkedAt !== null && now - checkedAt < REFRESH_MS) return;

    const tier = await fetchTier();
    // `null` means the SDK could not be reached. The cached tier stands.
    if (tier === null) return;

    cache.set(CACHE_KEY, JSON.stringify({ tier, checkedAt: now } satisfies Cached));
    set({ tier, checkedAt: now });
  },

  setTier(cache, tier) {
    const checkedAt = Date.now();
    cache.set(CACHE_KEY, JSON.stringify({ tier, checkedAt } satisfies Cached));
    set({ tier, checkedAt });
  },

  markShown(cache, kind, now = Date.now()) {
    const today = dayKey(new Date(now));
    const { markerDay, shown } = get();

    // A new day wipes the list rather than appending to it. Markers reset at
    // LOCAL midnight, which is what "once per day" means to a person.
    const kinds = markerDay === today ? [...new Set([...shown, kind])] : [kind];

    cache.set(MARKER_KEY, JSON.stringify({ day: today, kinds } satisfies Markers));
    set({ markerDay: today, shown: kinds });
  },

  setOverride(tier) {
    if (!__DEV__) return;
    set({ override: tier });
  },
}));

/** The tier as the app should treat it, dev override included. */
export const selectTier = (state: EntitlementState): Tier =>
  __DEV__ && state.override !== null ? state.override : state.tier;

export function useTier(): Tier {
  return useEntitlementStore(selectTier);
}
