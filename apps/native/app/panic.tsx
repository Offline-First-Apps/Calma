import { useEffect } from 'react';

import { SessionScreen } from '@/src/features/breathing/SessionScreen';
import { hapticPanic } from '@/src/lib/haptics';

/**
 * The panic session.
 *
 * The physiological sigh, because it is the fastest of the three to do
 * anything at all -- two breaths in and one long breath out, and the nervous
 * system has already started to move. Sixty seconds, because a session has to
 * end before someone gives up on it.
 *
 * NOTHING IS ASKED HERE. No intensity slider, no permission prompt, no
 * paywall, no modal, ever (D-006). Someone who has just pressed the panic
 * button is not going to rate their distress out of ten first, and being
 * asked would be its own small cruelty.
 *
 * Dismissible at any moment with a single visible button.
 */
export default function Panic() {
  useEffect(() => {
    // Fires on activation, then the phone is silent for the whole minute.
    // The heaviest haptic in the app: it has to land through a shaking hand.
    hapticPanic();
  }, []);

  return (
    <SessionScreen pattern="physiological-sigh" entryPoint="panic" panic />
  );
}
