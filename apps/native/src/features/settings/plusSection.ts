import type { Tier } from '@calma/domain';

/**
 * What the Calma Plus section of Settings is allowed to say (plan 14 T09).
 *
 * Pure, because "does this build mention money at all" is a rule and not a
 * rendering detail — and because `apps/native/vitest.config.ts` runs Node
 * with no renderer, a rule inside a component is a rule that stops being
 * checked.
 */
export type PlusSectionState =
  /** Nothing at all. Not a disabled row, not a greyed price — absent. */
  | 'hidden'
  /** Free, with a plain way to look at what Plus is. */
  | 'free'
  /** Plus, with a way to manage it. */
  | 'active';

/**
 * HIDDEN IS A DESIGNED STATE, NOT A FAILURE.
 *
 * `suppressed` means no purchase could succeed on this build — no RevenueCat
 * key, or the SDK failed to configure. A build in that state must show no
 * prices and no paywalls at all (systems/05-entitlements.md, and the note in
 * `packages/env/src/native.ts`). "See plans" leading to a screen that says
 * Plus is unavailable is a worse answer than never raising the subject.
 *
 * It stays hidden on `'plus'` too, and that combination is not hypothetical:
 * a paying user's tier is cached indefinitely and survives a build that has
 * lost its keys. There is nothing useful to offer them either — the manage
 * link needs the store, and restore needs an SDK that configured.
 */
export function plusSectionState(
  tier: Tier,
  suppressed: boolean,
): PlusSectionState {
  if (suppressed) return 'hidden';
  return tier === 'plus' ? 'active' : 'free';
}
