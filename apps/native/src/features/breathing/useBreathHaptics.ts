import type { BreathTimeline } from '@calma/domain';
import { useCallback, useRef } from 'react';

import { hapticCycleComplete, hapticSessionComplete } from '@/src/lib/haptics';
import { hapticForPhase } from '@/src/lib/haptics/worklet';

/**
 * Haptics for a breathing session.
 *
 * This is the channel that makes the stated goal real: a whole session,
 * followable with the screen off. The orb is for eyes that are open; this is
 * for eyes that are shut, which at 3am is most of them.
 *
 * WHY IT HANGS OFF THE ANIMATION AND NOT OFF A CLOCK. `useOrbAnimation`
 * already fires a callback on the frame each phase begins, straight from
 * Reanimated's own completion handler on the UI thread. Riding that gets the
 * haptic inside one frame of the visual -- comfortably under the 30ms budget
 * -- and, more importantly, guarantees the two can never drift apart, because
 * they are the same event rather than two things scheduled to agree.
 *
 * A parallel `setInterval` would be correct on a quiet phone and wrong on a
 * busy one. The busy one is the one that matters.
 */
export function useBreathHaptics(timeline: BreathTimeline | null) {
  // Guards against a phase being announced twice -- a re-entrant callback
  // would double-tap, and a double tap means something specific here.
  const lastFired = useRef(-1);

  const onPhaseStart = useCallback(
    (stepIndex: number) => {
      if (timeline === null) return;
      if (stepIndex === lastFired.current) return;
      lastFired.current = stepIndex;

      const step = timeline.steps[stepIndex];
      if (step === undefined) return;

      // A phase that does not change the word on screen does not get its own
      // cue either. The sigh's 180ms micro-hold is the case this exists for:
      // a tap there would sit between the two sips and blur the very thing
      // the double tap is trying to distinguish.
      if (!step.labelChanges) return;

      hapticForPhase(step.label)();

      // The cycle cue rides on the phase that closed the cycle rather than
      // being scheduled separately, so they cannot separate.
      const previous = timeline.steps[stepIndex - 1];
      if (previous?.endsCycle) hapticCycleComplete();
    },
    [timeline],
  );

  const onFinished = useCallback(() => {
    lastFired.current = -1;
    hapticSessionComplete();
  }, []);

  const reset = useCallback(() => {
    lastFired.current = -1;
  }, []);

  return { onPhaseStart, onFinished, reset };
}
