import { worryWindowFor } from '@calma/domain';

/**
 * Editing the three onboarding answers, and the one edit that has a
 * consequence somebody has to agree to.
 *
 * PURE, AND IN A `.ts` FILE. `apps/native/vitest.config.ts` runs Node with no
 * renderer, and "when does Calma offer to move your worry window" is exactly
 * the kind of rule that stops being checked the moment it lives inside a
 * component.
 */

/**
 * The window a changed "when is it hardest" would seed — or `null` for "say
 * nothing".
 *
 * THE OFFER IS THE WHOLE POINT OF THIS FUNCTION. Plan 14 T08: changing "when
 * is it hardest" *offers* to move the worry window rather than moving it
 * silently. Onboarding may seed a window from an answer, because at that
 * moment there is nothing to overwrite. Six weeks later there is: somebody has
 * a window they have arranged their evening around, and a tap on a card in
 * Settings is not consent to move it.
 *
 * Two cases return `null`, and both mean the same thing — there is nothing to
 * offer, so nothing appears:
 *
 *   - the seeded window is already the one they have, so the offer would be a
 *     question with one answer;
 *   - the question has been cleared entirely. `worryWindowFor([])` returns the
 *     app default, but clearing an answer is not a statement about when things
 *     are hard, and proposing 19:00 on the strength of an absence would be the
 *     app inventing an opinion.
 *
 * @param when the *new* selection, as option ids.
 * @param currentTime `prefs.worryWindowTime`, local `HH:mm`.
 */
export function suggestedWindowMove(
  when: readonly string[],
  currentTime: string,
): string | null {
  if (when.length === 0) return null;

  const suggested = worryWindowFor(when);
  return suggested === currentTime ? null : suggested;
}

/**
 * Whether two selections hold the same options, order aside.
 *
 * The cards are multi-select, so the same three answers can be tapped in six
 * orders. Comparing arrays directly would make re-tapping in a different order
 * look like a change and raise a window offer nobody caused.
 */
export function sameSelection(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) return false;
  return a.every((option) => b.includes(option));
}
