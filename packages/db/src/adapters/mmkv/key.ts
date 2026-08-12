import { getRandomBytesAsync } from 'expo-crypto';
import {
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  getItemAsync,
  setItemAsync,
} from 'expo-secure-store';

/**
 * The encryption key.
 *
 * Generated once, on first launch, and kept in the Keychain or Keystore. It is
 * read exactly once at boot, never logged, never held in a store, and never
 * crosses a package boundary.
 *
 * `WHEN_UNLOCKED_THIS_DEVICE_ONLY` means it is not synced to iCloud and not
 * restored onto a new device. **Device loss is data loss.** That is the correct
 * trade for an app whose entire promise is that nothing leaves the phone, and
 * Settings says so in one honest sentence rather than burying it
 * (systems/02-data-layer.md § Encryption & key custody).
 */

const STORAGE_KEY = 'calma.storage.key';
const KEY_BYTES = 32;

export type KeyFailure =
  | 'secure-store-unavailable'
  | 'generation-failed'
  | 'write-failed';

export type KeyResult =
  | { ok: true; key: string; created: boolean }
  | { ok: false; reason: KeyFailure };

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // btoa exists on Hermes; the key is bytes, so there is no unicode concern.
  return globalThis.btoa(binary);
}

/**
 * Reads the key, or makes one.
 *
 * Returns a typed failure rather than throwing. A phone with no passcode can
 * legitimately have no Keystore, and the app's answer to that is a plain
 * sentence and a read-only boot — not a stack trace in front of someone who
 * opened this because they were panicking.
 */
export async function getOrCreateEncryptionKey(): Promise<KeyResult> {
  let existing: string | null = null;

  try {
    existing = await getItemAsync(STORAGE_KEY, {
      keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    return { ok: false, reason: 'secure-store-unavailable' };
  }

  if (existing) return { ok: true, key: existing, created: false };

  let key: string;
  try {
    key = toBase64(await getRandomBytesAsync(KEY_BYTES));
  } catch {
    return { ok: false, reason: 'generation-failed' };
  }

  try {
    await setItemAsync(STORAGE_KEY, key, {
      keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Losing the key we just made is better than encrypting a store with a
    // key that was never persisted — that would be data written and
    // immediately unreadable.
    return { ok: false, reason: 'write-failed' };
  }

  return { ok: true, key, created: true };
}

/**
 * Deletes the key. Part of "erase everything", and only that.
 *
 * The stores must be cleared first: without the key their contents are
 * unreadable, and unreadable is not the same as gone.
 */
export async function destroyEncryptionKey(): Promise<void> {
  const { deleteItemAsync } = await import('expo-secure-store');
  try {
    await deleteItemAsync(STORAGE_KEY, {
      keychainAccessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  } catch {
    // Nothing to do and nothing to tell anyone. The data is already gone.
  }
}
