import type { Language } from '@calma/i18n';

/**
 * Whether Settings offers a language row at all (plan 14 T02).
 *
 * THE OWNER'S STANDING INSTRUCTION: no row that leads nowhere, and no setting
 * that is not implemented yet. A language picker while English ships alone
 * offers "Match my phone" and "English", and both resolve to English — it is
 * a question whose two answers are identical, on the screen where every other
 * switch does exactly what it says.
 *
 * SO IT IS A CONDITION RATHER THAN A DELETION, and the condition is the one
 * that is actually true: the row appears when there is more than one language
 * to choose between. `supported.ts` promises that adding a language is "an
 * entry in this list plus a folder of JSON — never a code change anywhere
 * else", and this keeps that promise. The day a second locale lands, the row
 * appears, the picker is already built, and nobody has to remember this file
 * exists.
 *
 * The picker itself is NOT conditional. It is shared with onboarding's b2 and
 * is reachable from there the moment the same condition holds.
 */
export function offersLanguageChoice(
  languages: readonly Language[],
): boolean {
  return languages.length > 1;
}
