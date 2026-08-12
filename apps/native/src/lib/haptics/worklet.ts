import type { BreathLabel } from '@calma/domain';
import { runOnJS } from 'react-native-reanimated';

import {
  hapticCycleComplete,
  hapticExhale,
  hapticHold,
  hapticInhale,
  hapticSecondInhale,
  hapticSessionComplete,
} from './index';

/**
 * Firing haptics from the UI thread.
 *
 * The budget is 30ms from the visual transition (systems/04). A haptic that
 * lags the orb by 100ms breaks the illusion that the two are the same thing
 * -- and once that illusion breaks, the person is following two guides
 * instead of one, which is worse than following none.
 *
 * The route is: Reanimated's animation-completion callback (UI thread) ->
 * `runOnJS` -> expo-haptics. That is one scheduled hop, not a re-render and
 * not a timer, so it lands inside a frame. A `setInterval` version of this
 * was never written and should not be: under load the timer slips, and it
 * slips exactly when the phone is busiest, which is when someone is most
 * likely to be using this.
 */

/** Maps a phase label to its haptic. Pure lookup, safe to call from anywhere. */
export function hapticForPhase(label: BreathLabel): () => void {
  switch (label) {
    case 'inhale':
      return hapticInhale;
    case 'secondInhale':
      return hapticSecondInhale;
    case 'holdFull':
    case 'holdEmpty':
      return hapticHold;
    case 'exhale':
      return hapticExhale;
  }
}

/** Called on the JS thread by {@link firePhaseHapticFromWorklet}. */
function firePhase(label: BreathLabel, endsCycle: boolean): void {
  hapticForPhase(label)();

  // The cycle-complete cue rides on the same hop as the phase that closed
  // it rather than getting a hop of its own, so the two cannot drift apart.
  if (endsCycle) hapticCycleComplete();
}

/**
 * Fire the haptic for a phase, from inside a worklet.
 *
 * Must be called from the UI thread -- that is the whole point. Calling it
 * from the JS thread works but wastes the hop.
 */
export function firePhaseHapticFromWorklet(
  label: BreathLabel,
  endsCycle: boolean,
): void {
  'worklet';
  runOnJS(firePhase)(label, endsCycle);
}

/** The session has ended. Fired once, from the last phase's completion. */
export function fireSessionCompleteFromWorklet(): void {
  'worklet';
  runOnJS(hapticSessionComplete)();
}
