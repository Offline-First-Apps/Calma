import { MMKV } from 'react-native-mmkv';

import { MemoryStore, type KeyValueStore, type Stores } from '../../kv';
import { getOrCreateEncryptionKey, type KeyFailure } from './key';

/**
 * The three MMKV instances.
 *
 * `calma.data` and `calma.prefs` are encrypted. `calma.cache` is not, and holds
 * only the entitlement cache, the last-seen app version, and the
 * onboarding-complete flag. **Sensitive content never touches the cache.**
 *
 * This file is the only place in the repository allowed to import
 * `react-native-mmkv`; the ESLint boundary enforces it.
 */

/** MMKV's surface, narrowed to what a repository actually uses. */
function wrap(mmkv: MMKV): KeyValueStore {
  return {
    getString: (key) => mmkv.getString(key),
    set: (key, value) => mmkv.set(key, value),
    delete: (key) => mmkv.delete(key),
    getAllKeys: () => mmkv.getAllKeys(),
    clearAll: () => mmkv.clearAll(),
  };
}

export type StorageResult =
  | { ok: true; stores: Stores; firstRun: boolean }
  /**
   * Boot continues in memory. Nothing persists, and the app says so plainly —
   * far better than a crash, and far better than silently pretending to save
   * someone's writing.
   */
  | { ok: false; reason: KeyFailure; stores: Stores };

export async function openStores(): Promise<StorageResult> {
  const key = await getOrCreateEncryptionKey();

  if (!key.ok) {
    return {
      ok: false,
      reason: key.reason,
      stores: {
        data: new MemoryStore(),
        prefs: new MemoryStore(),
        cache: new MemoryStore(),
      },
    };
  }

  return {
    ok: true,
    firstRun: key.created,
    stores: {
      data: wrap(new MMKV({ id: 'calma.data', encryptionKey: key.key })),
      prefs: wrap(new MMKV({ id: 'calma.prefs', encryptionKey: key.key })),
      cache: wrap(new MMKV({ id: 'calma.cache' })),
    },
  };
}

/**
 * Clears all three instances. The caller destroys the key afterwards, in that
 * order — clearing first means nothing is left encrypted-but-present.
 */
export function clearAllStores(stores: Stores): void {
  stores.data.clearAll();
  stores.prefs.clearAll();
  stores.cache.clearAll();
}
