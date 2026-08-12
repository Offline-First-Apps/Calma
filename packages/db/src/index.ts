/**
 * @calma/db — the only door into storage.
 *
 * Feature code imports a port type and this factory, never an adapter. That is
 * the line that lets a SQLite adapter arrive later without touching a single
 * call site, and it is why the ESLint boundary forbids `react-native-mmkv`
 * anywhere but here.
 *
 * See systems/02-data-layer.md.
 */
import { createBreathingRepo } from './adapters/mmkv/breathing.mmkv';
import { createJournalRepo } from './adapters/mmkv/journal.mmkv';
import { createPrefsRepo } from './adapters/mmkv/prefs.mmkv';
import { createWorryRepo } from './adapters/mmkv/worry.mmkv';
import type { Stores } from './kv';
import type { BreathingRepo } from './ports/breathing.repo';
import type { JournalRepo } from './ports/journal.repo';
import type { PrefsRepo } from './ports/prefs.repo';
import type { WorryRepo } from './ports/worry.repo';

// `storage.ts` and `key.ts` are deliberately absent from this barrel. They
// import MMKV and Expo modules; re-exporting them here would drag React Native
// into every consumer, including the tests. The app reaches them through
// `@calma/db/native`.
export * from './keys';
export * from './kv';
export type * from './ports/index';
export * from './adapters/mmkv/aggregates';
export * from './adapters/mmkv/repair';
export {
  clearCorruptionEvents,
  corruptionEvents,
  type CorruptionEvent,
} from './adapters/mmkv/validate';
export * from './migrations/index';

export interface Repositories {
  worry: WorryRepo;
  journal: JournalRepo;
  breathing: BreathingRepo;
  prefs: PrefsRepo;
}

export interface RepositoryOptions {
  now?: () => number;
  createId?: () => string;
}

/**
 * The single line that swaps adapters.
 *
 * Takes stores rather than creating them, so the same factory serves the app,
 * the tests, and the degraded read-only boot that happens when SecureStore is
 * unavailable.
 */
export function createRepositories(
  stores: Stores,
  options: RepositoryOptions = {},
): Repositories {
  return {
    worry: createWorryRepo(stores.data, options),
    journal: createJournalRepo(stores.data, options),
    breathing: createBreathingRepo(stores.data, options),
    prefs: createPrefsRepo(stores.prefs),
  };
}
