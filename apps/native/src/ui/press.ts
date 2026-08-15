import { duration } from '@calma/tokens';

/**
 * How everything in Calma responds to a finger.
 *
 * Pure, and in a `.ts` file, because it is the same three numbers used by
 * every pressable in the app and `apps/native/vitest.config.ts` runs Node with
 * no renderer. Values scattered across component files drift; a component that
 * presses 40ms faster than its neighbour is a thing nobody can name and
 * everybody feels.
 *
 * ---------------------------------------------------------------------------
 * WHAT REPLACED WHAT, AND WHY IT MATTERS MORE THAN IT SOUNDS.
 *
 * Every pressable used `active:opacity-90`, which is an INSTANT state swap:
 * the element is at 100% on one frame and 90% on the next, then snaps back the
 * frame after release. That is a flicker, not feedback. It is also the one
 * animation in the app that fires on literally every interaction, so it sets
 * the app's felt tempo more than any screen transition does.
 *
 * `duration.press` has been 120ms in `@calma/tokens` since session 2 and was
 * used by nothing.
 * ---------------------------------------------------------------------------
 *
 * PRESSING IN IS FASTER THAN RELEASING.
 *
 * 120ms down, 180ms up. A control should acknowledge a touch as close to
 * instantly as it can and let go unhurriedly — the asymmetry is what makes it
 * read as a physical thing settling rather than a state toggling. Reversed, it
 * feels sticky.
 *
 * IT SCALES DOWN AND RETURNS TO EXACTLY 1. NEVER PAST IT.
 *
 * `systems/03` forbids overshoot, and the reason given is precise: an element
 * that overshoots has to correct itself, and a correction is a small visual
 * surprise. So this is `withTiming` and never `withSpring`, and 1 is the
 * ceiling. 0.98 is deliberately small — at 62px that is about a pixel of
 * travel, which is felt rather than seen.
 *
 * UNDER REDUCE MOTION THE SCALE GOES AWAY AND THE FADE STAYS.
 *
 * Reduce Motion asks for less movement, not less feedback. A control that
 * stops responding when somebody turns on an accessibility setting is a
 * regression dressed as compliance.
 */

/** Milliseconds. Down fast, up unhurried. */
export const PRESS_IN_MS = duration.press;
export const PRESS_OUT_MS = 180;

/** About a pixel of travel on a 62px pill. Felt, not seen. */
export const PRESS_SCALE = 0.98;

/** Deep enough to read on a dimmed screen, shallow enough not to blink. */
export const PRESS_OPACITY = 0.88;

export interface PressTargets {
  opacity: number;
  scale: number;
  durationMs: number;
}

/**
 * Where a pressable should be right now.
 *
 * @param pressed whether a finger is currently down on it.
 * @param reduceMotion the device setting. Removes the scale, keeps the fade.
 */
export function pressTargets(
  pressed: boolean,
  reduceMotion: boolean,
): PressTargets {
  return {
    opacity: pressed ? PRESS_OPACITY : 1,
    scale: pressed && !reduceMotion ? PRESS_SCALE : 1,
    durationMs: pressed ? PRESS_IN_MS : PRESS_OUT_MS,
  };
}

/**
 * How long a selection takes to become visible.
 *
 * Longer than a press and shorter than a screen transition. A tick that
 * appears instantly reads as a form validating; one that takes as long as a
 * page turn reads as lag. This is the middle, and it is the same number for
 * the wash, the border and the mark so a selection arrives as one event.
 */
export const SELECT_MS = 200;
