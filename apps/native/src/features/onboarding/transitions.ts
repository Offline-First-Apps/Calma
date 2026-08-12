import { duration, reducedMotion } from '@calma/tokens';
import { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * How one onboarding step becomes the next.
 *
 * THREE RULES, AND THE THIRD IS THE ONE THAT WOULD OTHERWISE BE FOUND LATE.
 *
 * 1. NO BOUNCE, NO OVERSHOOT, NO SPRING. Calma's metronome is the orb's
 *    eleven-second breath. A screen that springs into place belongs to a
 *    different app, and to a different mood than the one the person is in.
 *
 * 2. UNDER REDUCE MOTION, A SHORTER FADE — not no fade. An instant cut
 *    between two full-screen layouts is its own jolt, and Reduce Motion asks
 *    for less movement rather than less continuity. Breath timing is never
 *    reduced, which is why this is separate from the orb's animation.
 *
 * 3. NO HORIZONTAL DIRECTIONAL MOTION, EVER. A step sliding in from the right
 *    encodes "forward is rightward" — true in English, false in Arabic and
 *    Hebrew. The day RTL is added (`systems/10-i18n.md`) a horizontal
 *    transition becomes a bug in every screen at once, and nobody will
 *    remember that it was decided here. A fade has no direction to get wrong,
 *    so it is a problem the app simply never has.
 *
 *    This is also why onboarding does not reuse `transitionFor` from
 *    `lib/motion.ts`. That one slides from the right, correctly, for a
 *    navigation stack being pushed and popped. Onboarding is one screen
 *    changing its mind, not a stack — and a step going *back* must not look
 *    like a rewind, so both directions get the identical fade.
 */

export function stepFadeDuration(reduceMotion: boolean): number {
  return reduceMotion ? reducedMotion.transition : duration.transition;
}

/**
 * Entering and leaving are the same length, and they overlap.
 *
 * A sequential out-then-in reads as two events with a blank moment between
 * them; a cross-fade reads as one screen becoming another. The second is what
 * "breath-paced" means here — nothing in this flow should feel like a page
 * turn.
 */
export function stepEntering(reduceMotion: boolean) {
  return FadeIn.duration(stepFadeDuration(reduceMotion));
}

export function stepExiting(reduceMotion: boolean) {
  return FadeOut.duration(stepFadeDuration(reduceMotion));
}
