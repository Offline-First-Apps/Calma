import { describe, expect, it } from 'vitest';

import { RETURNING_AFTER_DAYS, isReturning } from '../returning';

describe('isReturning', () => {
  const today = '2026-08-14';

  /** Onboarding owns the first launch. This must never claim it. */
  it('is false on a first launch, when nothing has been stored', () => {
    expect(isReturning(undefined, today)).toBe(false);
  });

  it('is false for someone who was here yesterday', () => {
    expect(isReturning('2026-08-13', today)).toBe(false);
  });

  it('is false the day before the threshold', () => {
    expect(isReturning('2026-07-25', today)).toBe(false);
  });

  it('is true once the gap passes three weeks', () => {
    expect(isReturning('2026-07-23', today)).toBe(true);
  });

  /**
   * Six months and three weeks get the same screen. There is no escalation,
   * because escalating would be the app grading how long someone was away.
   */
  it('treats a very long absence exactly like a just-long-enough one', () => {
    expect(isReturning('2026-02-01', today)).toBe(isReturning('2026-07-23', today));
  });

  it('uses a threshold of three weeks, not a calendar month', () => {
    expect(RETURNING_AFTER_DAYS).toBe(21);
  });
});
