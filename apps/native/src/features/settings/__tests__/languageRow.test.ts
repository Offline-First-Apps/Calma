import {
  LANGUAGES,
  SYSTEM_LOCALE,
  resolvePreferredLocale,
} from '@calma/i18n';
import { describe, expect, it } from 'vitest';

import { offersLanguageChoice } from '../languageRow';

/**
 * Plan 14 T02. The interesting assertion is the one about today: while
 * English ships alone the row must not exist, because both of its answers
 * resolve to English and the owner's standing instruction is that no row on
 * this screen leads nowhere.
 */
describe('offersLanguageChoice', () => {
  it('says no while one language ships', () => {
    expect(offersLanguageChoice(LANGUAGES)).toBe(false);
    expect(LANGUAGES).toHaveLength(1);
  });

  it('says yes as soon as a second one lands', () => {
    expect(
      offersLanguageChoice([
        ...LANGUAGES,
        { tag: 'de', nativeName: 'Deutsch', englishName: 'German' },
      ]),
    ).toBe(true);
  });

  /**
   * `supported.ts` promises adding a language is "an entry in this list plus a
   * folder of JSON — never a code change anywhere else". This is that promise
   * held: the row's condition reads the registry rather than a flag somebody
   * has to remember to flip.
   */
  it('reads the registry rather than a hard-coded count', () => {
    expect(offersLanguageChoice([])).toBe(false);
    expect(
      offersLanguageChoice([
        { tag: 'pt-BR', nativeName: 'Português', englishName: 'Portuguese' },
        { tag: 'cy', nativeName: 'Cymraeg', englishName: 'Welsh' },
        { tag: 'fi', nativeName: 'Suomi', englishName: 'Finnish' },
      ]),
    ).toBe(true);
  });
});

/**
 * What the picker shows against "Match my phone". Not a stored value — it is
 * recomputed from the device's languages every render, which is the whole
 * reason the sentinel exists.
 */
describe('the resolved language behind the sentinel', () => {
  it('follows the phone when the phone speaks a language we have', () => {
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['en-GB'])).toBe('en');
  });

  it('falls back to English rather than to nothing', () => {
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['cy-GB'])).toBe('en');
    expect(resolvePreferredLocale(SYSTEM_LOCALE, [])).toBe('en');
  });

  it('is not affected by an explicit choice, so the row can show both', () => {
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['de-DE'])).toBe('en');
  });
});
