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
  hydrate: (repo: PrefsRepo) => Promise<void>;
  update: (repo: PrefsRepo, patch: Partial<Prefs>) => Promise<void>;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  prefs: defaultPrefs,
  hydrated: false,

  async hydrate(repo) {
    set({ prefs: await repo.get(), hydrated: true });
  },

  async update(repo, patch) {
    set({ prefs: await repo.set(patch) });
  },
}));

/** Whether this device has been through onboarding. */
export const selectOnboarded = (state: PrefsState): boolean =>
  state.prefs.onboardingCompletedAt !== null;
