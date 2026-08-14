import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import { LockedScreen } from '@/src/features/states/LockedScreen';

import { useLock } from './useLock';

/**
 * k4's trigger. Wraps the writing, and only the writing.
 *
 * THE BREATHE BUTTON LEAVES THE GATE RATHER THAN OPENING IT. `onBreathe`
 * navigates to a session without authenticating, which is the entire point of
 * k4's caption and the reason rule 3 survives having a lock at all. If a
 * future change makes that button unlock first, the lock has quietly become a
 * gate on the panic path.
 *
 * The panic FAB is untouched here because it lives outside the tab navigator
 * — it is a sibling of the whole stack, so it floats over this gate exactly as
 * it floats over everything else, and reaches `/panic` without passing
 * through any of this.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locked, unlock } = useLock();

  if (!locked) return <>{children}</>;

  return (
    <LockedScreen
      onBreathe={() => router.push('/session/physiological-sigh')}
      onUnlock={() => void unlock()}
    />
  );
}
