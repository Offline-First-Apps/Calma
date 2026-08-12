import type { Prefs } from '@calma/domain';

export interface PrefsRepo {
  /** Always returns something — defaults fill any gap. */
  get(): Promise<Prefs>;
  /** Merges a patch over what is stored. */
  set(patch: Partial<Prefs>): Promise<Prefs>;
  /** Back to first-launch state. Used by "erase everything". */
  reset(): Promise<Prefs>;
}
