import { describe, expect, it } from 'vitest';

import { plusSectionState } from '../plusSection';

/**
 * Plan 14 T09, and the clause that matters most is the one about saying
 * nothing: a build with no RevenueCat key must show no prices and no paywalls
 * at all.
 */
describe('plusSectionState', () => {
  it('offers plans to free', () => {
    expect(plusSectionState('free', false)).toBe('free');
  });

  it('offers management to Plus', () => {
    expect(plusSectionState('plus', false)).toBe('active');
  });

  it('says nothing at all when nothing can be purchased', () => {
    expect(plusSectionState('free', true)).toBe('hidden');
  });

  /**
   * Not hypothetical. The cached tier stands indefinitely with no network and
   * never expires, so a paying user survives a build that has lost its keys —
   * and on that build neither the manage link nor restore can work.
   */
  it('says nothing to a cached Plus user on a build that cannot sell', () => {
    expect(plusSectionState('plus', true)).toBe('hidden');
  });

  it('never shows a section that could offer a price when suppressed', () => {
    for (const tier of ['free', 'plus'] as const) {
      expect(plusSectionState(tier, true)).not.toBe('free');
      expect(plusSectionState(tier, true)).not.toBe('active');
    }
  });
});
