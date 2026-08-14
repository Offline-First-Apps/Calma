import { describe, expect, it } from 'vitest';

import { LOCKED_ROUTES, isLockedRoute, shouldLock } from '../lock';

/**
 * RULE 3, AS ASSERTIONS.
 *
 * "No friction on the panic path. One tap to breathing from anywhere. No
 * paywall, no permission prompt, no modal may ever appear on it."
 *
 * A lock is the most obvious way to break that, so the scope of the lock is
 * pinned here rather than left to whoever next edits a route file.
 */
describe('the lock never covers the panic path', () => {
  const MUST_STAY_OPEN = [
    '/panic',
    '/session/physiological-sigh',
    '/session/4-7-8',
    '/(tabs)',
    '/(tabs)/index',
    '/(tabs)/breathe',
    '/(tabs)/worries',
    '/(tabs)/progress',
    '/worry-window',
    '/custom-rhythm',
    '/settings/crisis',
  ];

  it.each(MUST_STAY_OPEN)('leaves %s reachable while locked', (route) => {
    expect(isLockedRoute(route)).toBe(false);
  });

  /** The crisis lines are never behind authentication. Ever. */
  it('never locks the crisis resources', () => {
    expect(isLockedRoute('/settings/crisis')).toBe(false);
  });

  it('has no breathing or panic route in the allowlist at all', () => {
    const forbidden = LOCKED_ROUTES.filter((route) =>
      /panic|session|breathe/.test(route),
    );
    expect(forbidden).toEqual([]);
  });
});

describe('the lock covers the writing', () => {
  it.each([
    '/(tabs)/write',
    '/journal',
    '/journal/drafts',
    '/journal/search',
    '/journal/abc123',
    '/settings/privacy',
  ])('locks %s', (route) => {
    expect(isLockedRoute(route)).toBe(true);
  });

  /** Prefix-matched, so a new journal screen is covered without an edit. */
  it('covers a journal route that does not exist yet', () => {
    expect(isLockedRoute('/journal/some-future-screen')).toBe(true);
  });

  it('does not match a route that merely starts with the same letters', () => {
    expect(isLockedRoute('/journalling-elsewhere')).toBe(false);
  });
});

describe('shouldLock', () => {
  it('is off when the preference is off', () => {
    expect(shouldLock(false, true, false)).toBe(false);
  });

  /**
   * A phone whose biometrics were removed, or whose passcode was turned off,
   * must not become a phone whose owner cannot reach their own journal.
   */
  it('is off when the device cannot authenticate, rather than impassable', () => {
    expect(shouldLock(true, false, false)).toBe(false);
  });

  it('is on when enabled, ready, and not yet unlocked', () => {
    expect(shouldLock(true, true, false)).toBe(true);
  });

  it('stays off for the rest of the launch once unlocked', () => {
    expect(shouldLock(true, true, true)).toBe(false);
  });
});
