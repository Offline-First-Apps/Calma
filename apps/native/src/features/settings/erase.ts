import { RECORD_PREFIXES, type Repositories, type Stores } from '@calma/db';
import { defaultPrefs } from '@calma/domain';

/**
 * "Delete everything", and what it actually has to touch.
 *
 * SEPARATED FROM THE SHEET SO IT CAN BE READ IN ONE PIECE. This is the one
 * irreversible action in the product, and a reviewer should be able to check
 * that it clears everything without reading a component. Plan 14 T11 lists
 * five things; the two this build cannot do are named rather than skipped
 * silently.
 *
 * ORDER MATTERS. Clear the stores first, then reset the in-memory stores that
 * mirror them. The other order leaves a window in which a store holds records
 * whose backing keys are gone, and any read in that window resurrects them.
 */

export interface EraseCounts {
  entries: number;
  worries: number;
}

/**
 * What the sheet says out loud before anything is touched.
 *
 * COUNTED FROM THE KEY SPACE, NOT THROUGH THE REPOSITORIES. Neither port has a
 * `listAll`, and adding one for a count would mean a method that loads and
 * validates every journal entry a person has ever written just to produce a
 * number — the most sensitive read in the app, performed for no reason.
 * `getAllKeys()` with a prefix is what `repairIndexes` already does, and it
 * touches no content at all.
 *
 * It also cannot disagree with what the erase clears, because both work on the
 * same key space. A count derived from an index could drift from the records;
 * this one is the records.
 */
export function countEverything(stores: Stores): EraseCounts {
  const keys = stores.data.getAllKeys();

  return {
    entries: keys.filter((key) => key.startsWith(RECORD_PREFIXES.journal)).length,
    worries: keys.filter((key) => key.startsWith(RECORD_PREFIXES.worry)).length,
  };
}

export interface EraseDeps {
  stores: Stores;
  repositories: Repositories;
  /** Store resets, injected so this module imports no zustand. */
  resetStores: () => void;
}

/**
 * Erases everything on this device.
 *
 * NOT DONE HERE, AND BOTH ARE DELIBERATE RATHER THAN FORGOTTEN:
 *
 *   - **The SecureStore encryption key is not destroyed.** Plan 14 T11 asks
 *     for it. Clearing the three MMKV instances removes every record; the key
 *     then decrypts nothing. Destroying it as well is correct and belongs
 *     here, but `key.ts` exposes no delete and adding one is a storage-layer
 *     change with its own test surface. Recorded in `plans/14` T11.
 *   - **Notifications are not cancelled**, because none are ever scheduled:
 *     `permission.ts` is still a stub and plan 12 is not built. When it lands,
 *     the cancel goes here.
 *
 * Neither gap leaves user content on the device, which is the promise the
 * screen makes.
 */
export async function eraseEverything({
  stores,
  repositories,
  resetStores,
}: EraseDeps): Promise<void> {
  /*
   * The three instances, cleared inline rather than through
   * `clearAllStores` from `@calma/db/native`.
   *
   * That helper is identical, but it lives in `storage.ts`, which imports
   * MMKV and is deliberately kept out of the barrel. Importing it here would
   * drag React Native into this module and make the single most destructive
   * function in the product untestable in Node. `KeyValueStore.clearAll` is
   * part of the port, so this works against a `MemoryStore` too -- which is
   * what `erase.test.ts` uses to prove it actually empties everything.
   */
  stores.data.clearAll();
  stores.prefs.clearAll();
  stores.cache.clearAll();

  // Prefs are re-seeded rather than left absent: `defaultPrefs` is what a
  // first launch looks like, and an empty prefs record is not the same thing
  // -- every reader would fall back individually and onboarding would not
  // reliably re-run.
  await repositories.prefs.set(defaultPrefs);

  resetStores();
}
