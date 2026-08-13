import { useEffect } from 'react';
import { create } from 'zustand';

import type { Blocker } from './paywallGate';

/**
 * The live half of the paywall gate.
 *
 * Split from `paywallGate.ts` so the decision itself imports nothing. That is
 * not tidiness: `apps/native/vitest.config.ts` runs pure Node with no
 * renderer, and plan 11 T12 requires a test asserting every condition under
 * which a paywall must not appear. A rule that can only be checked by
 * mounting a component tree is a rule that stops being checked.
 *
 * Registrations are additive and released on unmount. A hold that outlives
 * its screen means a paywall that never appears again -- which fails in the
 * direction of never selling, the right direction, but is still a bug.
 */
interface GateState {
  blockers: Set<Blocker>;
  completedAt: number | null;
  hold: (blocker: Blocker) => void;
  release: (blocker: Blocker) => void;
  /** Call when a session, window or entry finishes. */
  settled: (now?: number) => void;
}

export const usePaywallGate = create<GateState>((set) => ({
  blockers: new Set(),
  completedAt: null,

  hold(blocker) {
    set((state) => {
      const blockers = new Set(state.blockers);
      blockers.add(blocker);
      return { blockers };
    });
  },

  release(blocker) {
    set((state) => {
      const blockers = new Set(state.blockers);
      blockers.delete(blocker);
      return { blockers };
    });
  },

  settled(now = Date.now()) {
    set({ completedAt: now });
  },
}));

/**
 * Holds the gate for as long as the calling screen is mounted and `active`.
 *
 * Released on unmount, unconditionally. A hold that outlives its screen is a
 * paywall that never appears again, which fails quietly in the direction of
 * never selling -- the right direction to fail, but still a bug.
 */
export function usePaywallHold(blocker: Blocker, active = true): void {
  const hold = usePaywallGate((state) => state.hold);
  const release = usePaywallGate((state) => state.release);

  useEffect(() => {
    if (!active) return;

    hold(blocker);
    return () => release(blocker);
  }, [blocker, active, hold, release]);
}
