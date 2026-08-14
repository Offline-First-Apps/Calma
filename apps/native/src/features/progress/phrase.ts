import type { Phrase } from './phrasing';

/**
 * Resolves a `Phrase` through i18next.
 *
 * One line, and it lives in its own module because it was exported from
 * `WeekCard.tsx` and the new `calma/no-logic-in-component-files` rule caught
 * it on the rule's very first run — a third instance of the same mistake,
 * after `dotColour` and `isReturning`, and one I had not noticed in either of
 * the two audits that went looking for exactly this.
 *
 * Worth keeping as evidence: two sessions of writing the rule down did not
 * stop me breaking it a third time. The lint rule did, in under a second.
 */
export function phrase(
  t: (key: string, params?: Record<string, unknown>) => string,
  value: Phrase,
): string {
  return t(value.key, value.params);
}
