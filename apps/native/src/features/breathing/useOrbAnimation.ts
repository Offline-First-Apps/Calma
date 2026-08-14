import {
  type BreathTimeline,
  SCALE_EXHALED,
} from '@calma/domain';
import { useCallback, useEffect, useRef } from 'react';
import {
  Easing,
  cancelAnimation,
  runOnJS,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/**
 * The orb's animation, scheduled once and then left alone.
 *
 * ---------------------------------------------------------------------------
 * WHY THE WHOLE SESSION IS ONE `withSequence`.
 *
 * The obvious implementation is a tick: a timer advances the phase, React
 * re-renders, the orb animates to the next target. Every part of that is
 * wrong here.
 *
 *   - A JS timer drifts under load, and it drifts most when the device is
 *     busy -- which, on a phone someone just grabbed at 3am, it is.
 *   - A re-render per phase puts animation state in React, and from there it
 *     is one refactor away from Zustand, which D-004 forbids for exactly this
 *     reason: a store write during an inhale is a dropped frame someone can
 *     feel in their chest.
 *   - Anything crossing the bridge mid-breath can be late. The haptic budget
 *     is 30ms; the bridge does not promise that.
 *
 * Because the timeline is fully known up front (`buildTimeline`), the entire
 * session can be handed to Reanimated as one sequence of timed steps at the
 * moment it starts. After that the UI thread owns the breath completely. No
 * timers, no ticks, no re-renders, nothing to drop. The JS thread finds out
 * what happened via `runOnJS` callbacks, and if the JS thread is busy the
 * label arrives late while the breath itself stays perfect -- which is the
 * right way round.
 * ---------------------------------------------------------------------------
 */

/** Halo lag, in ms. Long enough to read as soft, short enough not to smear. */
export const HALO_LAG_MS = 120;

/**
 * Ambient drift: +/-1.5% on a ~7s cycle, independent of the breath.
 *
 * This is the difference between an orb and a circle. A perfectly still shape
 * reads as frozen, and frozen reads as broken -- people tap a frozen thing to
 * see if the app has hung, which is not what should be happening during a
 * held breath. The cycle is deliberately coprime-ish with every pattern's
 * cycle length so the two never lock into a visible rhythm.
 */
export const DRIFT_PERIOD_MS = 7000;
export const DRIFT_AMOUNT = 0.015;

export interface OrbAnimation {
  /**
   * The breath, in orb-scale units (0.62 exhaled .. 1.0 inhaled).
   *
   * Kept in scale units rather than normalised 0..1 so the physiological
   * sigh's mid-point is the literal 0.85 from the design spec everywhere it
   * appears, instead of a fraction that has to be decoded.
   */
  breath: SharedValue<number>;
  /** The same breath, {@link HALO_LAG_MS} behind. */
  haloBreath: SharedValue<number>;
  /** Ambient multiplier, ~0.985..1.015. Never part of the breath. */
  drift: SharedValue<number>;
}

export interface UseOrbAnimationOptions {
  /** The session's schedule, or `null` before one has started. */
  timeline: BreathTimeline | null;
  /**
   * Paused sessions keep their shared values where they are. Used by the
   * "Stop here?" question, which dims the room rather than leaving it.
   */
  paused?: boolean;
  /**
   * Under Reduce Motion the orb shifts opacity and colour instead of scale.
   * The breath VALUE still animates on exactly the same schedule -- only its
   * visual expression changes, so the guidance stays usable and the haptics
   * stay in step. Slowing or skipping the breath would break the one thing
   * the screen is for.
   */
  reduceMotion?: boolean;
  /** Fired as each phase begins, on the JS thread. */
  onPhaseStart?: (stepIndex: number) => void;
  /** Fired once, when the last phase of the last cycle finishes. */
  onFinished?: () => void;
}

export function useOrbAnimation({
  timeline,
  paused = false,
  reduceMotion = false,
  onPhaseStart,
  onFinished,
}: UseOrbAnimationOptions): OrbAnimation {
  const breath = useSharedValue(SCALE_EXHALED);
  const haloBreath = useSharedValue(SCALE_EXHALED);
  const drift = useSharedValue(1);

  /*
   * THE LATEST-REF PATTERN, AND THE BUG THAT MADE IT NECESSARY.
   *
   * These used to be `useCallback(..., [onPhaseStart])`, with a comment
   * claiming the identity was stable. It was not: `useCallback` returns a new
   * function whenever its dependency changes, and `SessionScreen` rebuilds
   * `onPhaseStart` on every render. The effect below lists these as
   * dependencies, so every render rebuilt the whole `withSequence` — which
   * RESTARTS THE BREATH FROM PHASE ZERO.
   *
   * And phase changes cause renders, because the phase word is state. So the
   * sigh went "Breathe in" (2s) -> phase change -> re-render -> sequence
   * restarts -> "Breathe in" again, and the label jumped between "Breathe in"
   * and "One sip of air" instead of moving through the cycle once. The owner
   * reported it as the breath being jumpy and words repeating; it was the
   * animation being silently rebuilt underneath them, several times a second.
   *
   * A ref holds the newest callback while the wrapper identity never changes,
   * so the sequence is built exactly once per timeline. `useEffect` with no
   * dependency array updates the ref after every commit, which is what keeps
   * the callbacks current without making them a dependency.
   */
  const phaseRef = useRef(onPhaseStart);
  const finishedRef = useRef(onFinished);

  useEffect(() => {
    phaseRef.current = onPhaseStart;
    finishedRef.current = onFinished;
  });

  const notifyPhase = useCallback((index: number) => phaseRef.current?.(index), []);
  const notifyFinished = useCallback(() => finishedRef.current?.(), []);

  // --- the breath -------------------------------------------------------
  useEffect(() => {
    if (timeline === null || paused) return;

    const steps = timeline.steps;
    if (steps.length === 0) return;

    // Phase 0 has no predecessor to announce it, so it is announced here.
    notifyPhase(0);

    breath.value = steps[0]!.fromScale;
    haloBreath.value = steps[0]!.fromScale;

    const easing = Easing.inOut(Easing.sin);

    const leg = (index: number, announce: boolean) => {
      const step = steps[index]!;

      return withTiming(
        step.toScale,
        { duration: step.seconds * 1000, easing },
        (completed) => {
          'worklet';
          // `completed` is false when the animation was cancelled -- someone
          // stopped, or the screen went away. Announcing a phase that never
          // ran would fire a haptic into an empty room.
          if (!completed) return;

          if (announce && index + 1 < steps.length) {
            runOnJS(notifyPhase)(index + 1);
          }
          if (index === steps.length - 1) {
            runOnJS(notifyFinished)();
          }
        },
      );
    };

    const legs = steps.map((_, index) => leg(index, true));
    // The halo is the same journey, started late. It carries no callbacks:
    // the breath is what happened, the halo is only how it looked.
    const haloLegs = steps.map((_, index) => leg(index, false));

    breath.value =
      legs.length === 1
        ? legs[0]!
        : withSequence(legs[0]!, ...legs.slice(1));

    haloBreath.value = withDelay(
      HALO_LAG_MS,
      haloLegs.length === 1
        ? haloLegs[0]!
        : withSequence(haloLegs[0]!, ...haloLegs.slice(1)),
    );

    return () => {
      cancelAnimation(breath);
      cancelAnimation(haloBreath);
    };
  }, [timeline, paused, breath, haloBreath, notifyPhase, notifyFinished]);

  // --- ambient drift ----------------------------------------------------
  useEffect(() => {
    // Drift is scale motion, so Reduce Motion switches it off entirely.
    // Under Reduce Motion the orb is kept alive by its colour instead.
    if (reduceMotion) {
      drift.value = withTiming(1, { duration: 200 });
      return;
    }

    // Start at the bottom of the drift cycle rather than the middle, so the
    // first thing the orb does on appearing is grow very slightly. Set before
    // the repeat, not in a second effect -- a later assignment would cancel
    // the animation this one just started.
    drift.value = 1 - DRIFT_AMOUNT;

    drift.value = withRepeat(
      withTiming(1 + DRIFT_AMOUNT, {
        duration: DRIFT_PERIOD_MS / 2,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    return () => cancelAnimation(drift);
  }, [drift, reduceMotion]);

  return { breath, haloBreath, drift };
}
