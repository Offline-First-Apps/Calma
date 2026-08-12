import type { Prefs } from '@calma/domain';
import { defaultPrefs } from '@calma/domain';
import type { PrefsRepo } from '@calma/db';
import { create } from 'zustand';

/**
 * Preferences, hydrated once at boot.
 *
 * Stores do not auto-persist. Every write goes action → repository → store, so
 * the write path stays auditable — which matters when the data is someone's
 * private worries (systems/01-architecture.md § State).
 */
interface PrefsState {
  prefs: Prefs;
  hydrated: boolean;
  /**
   * Frozen at boot, deliberately.
   *
   * "A later launch" is a statement about launches, so it is evaluated once,
   * at one. Deriving it live from `prefs` would let the offer appear under
   * someone mid-session the moment the clock passed midnight, which is both
   * startling and not what was promised.
   */
  reOfferOnboarding: boolean;
  hydrate: (repo: PrefsRepo) => Promise<void>;
  update: (repo: PrefsRepo, patch: Partial<Prefs>) => Promise<void>;
  setReOfferOnboarding: (value: boolean) => void;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  prefs: defaultPrefs,
  hydrated: false,
  reOfferOnboarding: false,

  async hydrate(repo) {
    set({ prefs: await repo.get(), hydrated: true });
  },

  setReOfferOnboarding(value) {
    set({ reOfferOnboarding: value });
  },

  async update(repo, patch) {
    set({ prefs: await repo.set(patch) });
  },
}));

/** Whether this device has been through onboarding. */
export const selectOnboarded = (state: PrefsState): boolean =>
  state.prefs.onboardingCompletedAt !== null;
