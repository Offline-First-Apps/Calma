import { DEFAULT_WORRY_WINDOW, worryWindowFor } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import { sameSelection, suggestedWindowMove } from '../answerEdits';

/**
 * Plan 14 T08: changing "when is it hardest" OFFERS to move the worry window
 * rather than moving it silently. These are the conditions under which the
 * offer appears at all — and, more importantly, the ones under which it must
 * not.
 */
describe('suggestedWindowMove', () => {
  it('offers the window a new answer would seed', () => {
    expect(suggestedWindowMove(['night'], '19:00')).toBe('20:00');
    expect(suggestedWindowMove(['morning'], '19:00')).toBe('08:00');
    expect(suggestedWindowMove(['day'], '19:00')).toBe('18:00');
  });

  it('agrees with the mapping onboarding used', () => {
    for (const option of ['night', 'morning', 'day'] as const) {
      expect(suggestedWindowMove([option], '00:00')).toBe(
        worryWindowFor([option]),
      );
    }
  });

  /** A question with one answer is not a question. */
  it('says nothing when the seeded window is the one they already have', () => {
    expect(suggestedWindowMove(['night'], '20:00')).toBeNull();
    expect(suggestedWindowMove(['morning'], '08:00')).toBeNull();
  });

  /**
   * Clearing an answer is not a statement about when things are hard.
   * `worryWindowFor([])` returns the app default, and proposing it on the
   * strength of an absence would be the app inventing an opinion.
   */
  it('says nothing when the question has been cleared', () => {
    expect(suggestedWindowMove([], '20:00')).toBeNull();
    expect(suggestedWindowMove([], DEFAULT_WORRY_WINDOW)).toBeNull();
    expect(suggestedWindowMove([], '03:00')).toBeNull();
  });

  it('follows the same collision rules, not the tap order', () => {
    expect(suggestedWindowMove(['morning', 'night'], '19:00')).toBe('20:00');
    expect(suggestedWindowMove(['night', 'morning'], '19:00')).toBe('20:00');
  });

  it('lets a specific answer beat "it is hard to say"', () => {
    expect(suggestedWindowMove(['unpredictable', 'morning'], '19:00')).toBe(
      '08:00',
    );
  });

  /**
   * The offer is a proposal, never an edit. Nothing in this module writes,
   * which is what makes "declining leaves the window exactly as it was" true
   * by construction rather than by remembering.
   */
  it('never returns the current window as a move', () => {
    for (const when of [['night'], ['morning'], ['day'], ['unpredictable']]) {
      const current = worryWindowFor(when);
      expect(suggestedWindowMove(when, current)).toBeNull();
    }
  });
});

/**
 * The cards are multi-select, so the same answers can be tapped in several
 * orders. Comparing arrays directly would make a re-tap look like a change.
 */
describe('sameSelection', () => {
  it('ignores order', () => {
    expect(sameSelection(['night', 'day'], ['day', 'night'])).toBe(true);
  });

  it('separates different lengths', () => {
    expect(sameSelection(['night'], ['night', 'day'])).toBe(false);
    expect(sameSelection([], ['night'])).toBe(false);
  });

  it('treats two empty selections as the same', () => {
    expect(sameSelection([], [])).toBe(true);
  });

  it('separates different options', () => {
    expect(sameSelection(['night'], ['day'])).toBe(false);
  });
});
