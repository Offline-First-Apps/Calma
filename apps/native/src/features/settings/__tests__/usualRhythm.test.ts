import { PRESET_PATTERNS, defaultPrefs, prefsSchema } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import { mayUseCustomRatio } from '../../entitlement/paywallGate';

import {
  FALLBACK_PATTERN,
  PATTERN_KEY,
  PICKER_ORDER,
  resolveUsualPattern,
} from '../usualRhythm';

/**
 * "Your usual rhythm", and the two ways it could hand Home a pattern that
 * cannot be started.
 */
describe('resolveUsualPattern', () => {
  it('returns a preset unchanged', () => {
    expect(resolveUsualPattern('4-7-8', null)).toBe('4-7-8');
    expect(resolveUsualPattern('5-5-5-5', null)).toBe('5-5-5-5');
    expect(resolveUsualPattern('physiological-sigh', null)).toBe(
      'physiological-sigh',
    );
  });

  it('keeps custom when there is a ratio to run it with', () => {
    expect(resolveUsualPattern('custom', [4, 7, 8, 2])).toBe('custom');
  });

  /**
   * The case this module exists for. `getPattern('custom')` throws a
   * `RangeError` with no ratio, and the call site is Home's primary button.
   */
  it('falls back to the sigh when custom has lost its ratio', () => {
    expect(resolveUsualPattern('custom', null)).toBe('physiological-sigh');
  });

  it('falls back to the pattern a fresh install would offer', () => {
    expect(resolveUsualPattern('custom', null)).toBe(FALLBACK_PATTERN);
    expect(defaultPrefs.defaultPattern).toBe(FALLBACK_PATTERN);
  });
});

describe('the picker', () => {
  it('offers every pattern the domain has', () => {
    for (const pattern of PRESET_PATTERNS) {
      expect(PICKER_ORDER).toContain(pattern.id);
    }
    expect(PICKER_ORDER).toContain('custom');
  });

  /** d1's order, which leads with the fastest-acting one. */
  it('leads with the sigh rather than the domain order', () => {
    expect(PICKER_ORDER[0]).toBe('physiological-sigh');
    expect(PRESET_PATTERNS[0]?.id).toBe('4-7-8');
  });

  it('has an i18n key for every pattern it lists', () => {
    for (const id of PICKER_ORDER) {
      expect(PATTERN_KEY[id]).toBeTruthy();
    }
  });

  it('names patterns in words rather than by their numeric id', () => {
    expect(PATTERN_KEY['5-5-5-5']).toBe('box');
    expect(PATTERN_KEY['4-7-8']).toBe('478');
  });
});

/**
 * PREFS WRITTEN BEFORE THIS FIELD EXISTED MUST STILL PARSE WHOLE.
 *
 * Not a nicety: `createPrefsRepo` calls `recordCorruption` and drops into its
 * salvage path whenever the stored object fails the schema, so a plain
 * `breathingPatternIdSchema` here would report a corruption on every existing
 * device the first time it launched this build.
 */
describe('prefs compatibility', () => {
  it('parses a prefs object saved before defaultPattern existed', () => {
    const old: Record<string, unknown> = { ...defaultPrefs };
    delete old.defaultPattern;

    const parsed = prefsSchema.safeParse(old);

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.defaultPattern).toBe(FALLBACK_PATTERN);
  });

  it('still rejects a pattern that is not one of the four', () => {
    expect(
      prefsSchema.safeParse({ ...defaultPrefs, defaultPattern: '3-3-3' })
        .success,
    ).toBe(false);
  });
});

/**
 * The custom-rhythm gate. Plan 14 T05's "paywall for free", and the clause
 * that keeps it from becoming a hard block.
 */
describe('mayUseCustomRatio', () => {
  it('lets Plus save a rhythm', () => {
    expect(mayUseCustomRatio('plus', false)).toBe(true);
  });

  it('offers Plus instead of saving on free', () => {
    expect(mayUseCustomRatio('free', false)).toBe(false);
  });

  /**
   * No API key means no purchase can succeed. Refusing here would be a block
   * with nothing on the other side of it.
   */
  it('saves anyway when nothing can be bought on this build', () => {
    expect(mayUseCustomRatio('free', true)).toBe(true);
    expect(mayUseCustomRatio('plus', true)).toBe(true);
  });
});
