import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
} from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

import { usePrefsStore } from '@/src/stores/prefs';

import { shouldLock } from './lock';

/**
 * The lock's runtime half.
 *
 * UNLOCKED STATE IS PER-LAUNCH AND IN MEMORY ONLY. Nothing about having
 * authenticated is written to disk: a stored "unlocked until" would be a
 * second source of truth about the person's own privacy, and the failure mode
 * — a stale timestamp leaving the journal open — is exactly what the feature
 * exists to prevent.
 *
 * `hardwareReady` is checked rather than assumed. A phone whose biometrics
 * were removed, or whose passcode was turned off, must not become a phone
 * whose owner cannot reach their own writing. No authenticator means no lock.
 */
export interface Lock {
  /** True when the gate should be shown instead of the content. */
  locked: boolean;
  unlock: () => Promise<void>;
}

export function useLock(): Lock {
  const enabled = usePrefsStore((state) => state.prefs.lockEnabled);
  const [hardwareReady, setHardwareReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    void (async () => {
      const ready = (await hasHardwareAsync()) && (await isEnrolledAsync());
      if (alive) setHardwareReady(ready);
    })();

    return () => {
      alive = false;
    };
  }, [enabled]);

  const unlock = useCallback(async () => {
    const result = await authenticateAsync({
      // The system sheet's own copy. Deliberately about the writing, not
      // about "Calma" -- it is the journal that is protected.
      promptMessage: 'Open your writing',
      // `false` so the OS offers the passcode fallback itself. Building our
      // own would mean handling a passcode, which this app must never do.
      disableDeviceFallback: false,
    });

    if (result.success) setUnlocked(true);
  }, []);

  return { locked: shouldLock(enabled, hardwareReady, unlocked), unlock };
}
