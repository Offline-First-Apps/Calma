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
  /**
   * Destroys the encryption key, and cancels anything scheduled.
   *
   * BOTH ARE INJECTED RATHER THAN IMPORTED, because both live behind
   * `@calma/db/native` and `expo-notifications` -- native modules that would
   * drag React Native into this file and make the single most destructive
   * function in the product impossible to test in Node. The call site passes
   * the real ones; the test passes spies and asserts they were called.
   *
   * Optional so a caller cannot half-wire this by forgetting one, and so the
   * test can prove the default is a no-op rather than a crash.
   */
  destroyKey?: () => Promise<void>;
  cancelNotifications?: () => Promise<void>;
}

/**
 * Erases everything on this device.
 *
 * ORDER, AND WHY IT IS THIS ORDER:
 *
 *   1. **Cancel notifications first.** A reminder that fires after the data it
 *      refers to is gone is the one way this operation can still speak to
 *      somebody afterwards. It goes first because it is the only step whose
 *      failure is visible to the person.
 *   2. **Clear the three stores.** Records gone.
 *   3. **Destroy the encryption key.** Only after the stores are empty:
 *      without the key their contents are unreadable, and unreadable is not
 *      the same as gone. Doing it first would leave an encrypted blob nobody
 *      can open, which is worse than either state on its own.
 *   4. **Re-seed prefs, then reset the in-memory stores.**
 *
 * Session 15 recorded the key and the notifications as not done, on the
 * belief that `key.ts` exposed no delete. It does -- `destroyEncryptionKey`
 * was there the whole time, written alongside the key itself and never
 * called. Worth remembering as its own small lesson: "not built" was a
 * guess, and reading the file would have cost less than the note did.
 */
export async function eraseEverything({
  stores,
  repositories,
  resetStores,
  destroyKey,
  cancelNotifications,
}: EraseDeps): Promise<void> {
  // Never let a scheduling failure block the erase. Somebody who pressed this
  // gets their data deleted whatever the notification layer is doing.
  try {
    await cancelNotifications?.();
  } catch {
    // Nothing to tell anyone. The deletion still happens.
  }

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

  // The key, after the stores and never before them.
  try {
    await destroyKey?.();
  } catch {
    // The records are already gone; a key that decrypts nothing is inert.
  }

  // Prefs are re-seeded rather than left absent: `defaultPrefs` is what a
  // first launch looks like, and an empty prefs record is not the same thing
  // -- every reader would fall back individually and onboarding would not
  // reliably re-run.
  await repositories.prefs.set(defaultPrefs);

  resetStores();
}
