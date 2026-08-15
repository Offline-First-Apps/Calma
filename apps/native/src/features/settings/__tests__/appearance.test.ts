import { defaultPrefs, prefsSchema } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import {
  AVAILABLE_ORB_THEMES,
  ORB_OPTIONS,
  THEME_OPTIONS,
  isOrbThemeAvailable,
} from '../appearance';

describe('the theme options', () => {
  it('offers exactly system, light and dark', () => {
    expect(THEME_OPTIONS).toEqual(['system', 'light', 'dark']);
  });

  /**
   * The sentinel, not a resolved value. Someone whose phone goes dark at
   * sunset expects Calma to follow, and `Uniwind.setTheme` takes `'system'`
   * directly rather than needing it flattened here.
   */
  it('leads with the live binding, and it is the default', () => {
    expect(THEME_OPTIONS[0]).toBe('system');
    expect(defaultPrefs.theme).toBe('system');
  });

  it('offers only values prefs will accept', () => {
    for (const theme of THEME_OPTIONS) {
      expect(prefsSchema.safeParse({ ...defaultPrefs, theme }).success).toBe(
        true,
      );
    }
  });
});

/**
 * T06: wave and bloom read as "coming soon" rather than as broken options.
 * Enforced here rather than by remembering to disable two rows.
 */
describe('the orb themes', () => {
  it('lists every one the schema knows', () => {
    for (const option of ORB_OPTIONS) {
      expect(
        prefsSchema.safeParse({ ...defaultPrefs, orbTheme: option }).success,
      ).toBe(true);
    }
    expect(ORB_OPTIONS).toHaveLength(3);
  });

  it('has built exactly one of them', () => {
    expect(AVAILABLE_ORB_THEMES).toEqual(['orb']);
  });

  it('refuses the two that do not exist', () => {
    expect(isOrbThemeAvailable('orb')).toBe(true);
    expect(isOrbThemeAvailable('wave')).toBe(false);
    expect(isOrbThemeAvailable('bloom')).toBe(false);
  });

  /** A default nobody can select would be a screen with no selection on it. */
  it('has a default that is one of the available ones', () => {
    expect(isOrbThemeAvailable(defaultPrefs.orbTheme)).toBe(true);
  });

  it('lists every available theme', () => {
    for (const option of AVAILABLE_ORB_THEMES) {
      expect(ORB_OPTIONS).toContain(option);
    }
  });
});
