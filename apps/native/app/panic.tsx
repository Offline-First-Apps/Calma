import { PanicSession } from '@/src/features/breathing/PanicSession';

/**
 * The panic route.
 *
 * The physiological sigh, because it is the fastest of the three to do
 * anything at all -- two breaths in and one long breath out, and the nervous
 * system has already started to move.
 *
 * The activation drum and the Heavy haptic do NOT fire here. They fire on the
 * touch, inside `PanicFab`, one frame before this route is even asked for
 * (plan 07 T07): the acknowledgement must never be the *result* of the
 * navigation. A button that hesitates gets tapped again, and the person doing
 * the tapping is having a panic attack.
 *
 * Everything else lives in `PanicSession`, including the rule that nothing is
 * ever asked on this path.
 */
export default function Panic() {
  return <PanicSession />;
}
