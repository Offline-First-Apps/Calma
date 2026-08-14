import {
  dayKey,
  isAtJournalLimit,
  isAtWorryLimit,
  journalEntriesRemaining,
  weekKey,
  worriesRemaining,
} from '@calma/domain';
import { useCallback, useEffect, useState } from 'react';

import { useStorage } from '@/src/lib/repositories';

import { useEntitlementStore, useTier } from './store';
import { usePaywallGate } from './gateStore';
import {
  isDeferral,
  paywallDecision,
  type LimitKind,
  type PaywallContext,
} from './paywallGate';

/**
 * How much of an allowance is used, derived and never counted separately.
 *
 * THERE IS NO COUNTER.
 *
 * `used` comes from the repository day and week indexes every time it is
 * read. A stored `worriesToday: 2` would be a second source of truth that
 * drifts the first time a write half-succeeds, a timezone changes, or someone
 * deletes a worry -- and it drifts in the direction of telling a person they
 * have used something they have not. Recomputing is cheap: it is a length of
 * an index array.
 *
 * THE PERIOD BOUNDARY IS LOCAL AND COMPUTED AT READ TIME.
 *
 * `dayKey` and `weekKey` in the device's current timezone (D-009). Travel may
 * shorten a period; that is accepted and written down. What never happens is
 * a negative remainder -- `worriesRemaining` floors at zero, so a lapsed Plus
 * user who captured ten this morning is at their limit rather than eight in
 * debt.
 *
 * `atLimit` IS NOT PERMISSION TO DISABLE ANYTHING.
 *
 * Never a disabled button, never a lock icon. The action is attempted and a
 * gentle card follows (systems/05-entitlements.md). `decide()` says what that
 * card is allowed to be, and often the answer is nothing at all.
 */
export interface Limit {
  used: number;
  allowed: number;
  atLimit: boolean;
  /** What may be shown right now for this limit: a sheet, a line, or nothing. */
  decide: () => ReturnType<typeof paywallDecision>;
  /** Whether a `silent` answer will change later. See `isDeferral`. */
  deferrable: () => boolean;
  /** Records that the sheet was shown, so today's second hit gets a line. */
  record: () => void;
  refresh: () => void;
}

export function useLimit(kind: 'worry' | 'journal'): Limit {
  const { repositories, stores } = useStorage();
  const tier = useTier();

  const suppressed = useEntitlementStore((state) => state.suppressed);
  const markerDay = useEntitlementStore((state) => state.markerDay);
  const shown = useEntitlementStore((state) => state.shown);
  const markShown = useEntitlementStore((state) => state.markShown);

  const blockers = usePaywallGate((state) => state.blockers);
  const completedAt = usePaywallGate((state) => state.completedAt);

  const [used, setUsed] = useState(0);

  const refresh = useCallback(() => {
    const now = new Date();

    if (kind === 'worry') {
      void repositories.worry
        .listByDay(dayKey(now))
        .then((worries) => setUsed(worries.length));
    } else {
      void repositories.journal
        .listByWeek(weekKey(now))
        .then((entries) => setUsed(entries.length));
    }
  }, [kind, repositories.journal, repositories.worry]);

  useEffect(refresh, [refresh]);

  const atLimit =
    kind === 'worry' ? isAtWorryLimit(tier, used) : isAtJournalLimit(tier, used);

  const allowed =
    used +
    (kind === 'worry'
      ? worriesRemaining(tier, used)
      : journalEntriesRemaining(tier, used));

  /**
   * The gate's view of right now, built in one place.
   *
   * `decide` and `deferrable` are two questions about the same instant, so
   * they must not each assemble their own `now` — a few milliseconds apart is
   * enough for one to see the settle window closed and the other open.
   */
  const context = useCallback(
    (): PaywallContext => ({
      blockers,
      completedAt,
      now: Date.now(),
      today: dayKey(new Date()),
      shown,
      markerDay,
      suppressed,
    }),
    [blockers, completedAt, shown, markerDay, suppressed],
  );

  const decide = useCallback(
    () => paywallDecision(kind as LimitKind, context()),
    [kind, context],
  );

  const deferrable = useCallback(() => isDeferral(context()), [context]);

  const record = useCallback(
    () => markShown(stores.cache, kind as LimitKind),
    [markShown, stores.cache, kind],
  );

  return { used, allowed, atLimit, decide, deferrable, record, refresh };
}
