import { STATE_SESSION_ACTIVE } from '@calma/db';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useStorage } from './repositories';
import { refreshLocale } from './boot';

/**
 * Foreground and background behaviour.
 *
 * Three things happen here, and one thing deliberately does not.
 *
 * On **cold boot**, an orphaned `state:session:active` is discarded in silence.
 * Someone whose phone died mid-session is not greeted with "you abandoned a
 * session" — there is nothing to apologise for and nothing to resume into.
 *
 * On **foreground**, the language is re-resolved, because `'system'` is a live
 * binding and the phone's language can change while we are backgrounded.
 *
 * On **background**, animation and haptics pause but session *logic* does not.
 * The clock keeps running; only the pretty parts stop.
 *
 * What does not happen: no re-engagement anything. No "welcome back".
 */

export interface ActiveSessionSnapshot {
  startedAt: number;
  durationSec: number;
  pattern: string;
}

export function useAppStateEffects(): void {
  const { stores } = useStorage();
  const previous = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Cold boot: anything still marked active belongs to a run that is over.
    stores.data.delete(STATE_SESSION_ACTIVE);
  }, [stores]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasBackground = previous.current.match(/inactive|background/);
      previous.current = next;

      if (next === 'active' && wasBackground) {
        void refreshLocale();
      }
    });

    return () => subscription.remove();
  }, []);
}

/**
 * Whether a session that was running when we left has since run out.
 *
 * Resuming into the middle of a breath someone was not taking is worse than
 * closing the session out — so on return we check the clock rather than the
 * screen.
 */
export function sessionHasElapsed(
  snapshot: ActiveSessionSnapshot,
  now: number,
): boolean {
  return now - snapshot.startedAt >= snapshot.durationSec * 1000;
}
