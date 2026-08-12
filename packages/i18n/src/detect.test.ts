import { describe, expect, it } from 'vitest';

import {
  SYSTEM_LOCALE,
  fallbackChain,
  isWellFormedTag,
  normaliseTag,
  resolveLocale,
  resolvePreferredLocale,
} from './detect';
import { DEFAULT_LOCALE, LANGUAGES, isSupported, languageFor } from './supported';

/** What the registry might look like once more languages ship. */
const FUTURE = ['en', 'pt', 'pt-BR', 'de'];

/** The same, without a region-specific bundle, to exercise degradation. */
const LANGUAGES_ONLY = ['en', 'pt', 'de'];

describe('the registry', () => {
  it('registers en with its native name and tag', () => {
    expect(LANGUAGES).toHaveLength(1);
    expect(languageFor('en')).toEqual({
      tag: 'en',
      nativeName: 'English',
      englishName: 'English',
    });
  });

  it('knows what it does and does not speak', () => {
    expect(isSupported('en')).toBe(true);
    expect(isSupported('pt')).toBe(false);
  });
});

describe('normaliseTag', () => {
  it('lowercases the language and uppercases the region', () => {
    expect(normaliseTag('PT-br')).toBe('pt-BR');
    expect(normaliseTag('pt-br')).toBe('pt-BR');
    expect(normaliseTag('EN')).toBe('en');
  });

  it('title-cases a script subtag', () => {
    expect(normaliseTag('zh-hans-cn')).toBe('zh-Hans-CN');
  });

  it('accepts underscores, which some platforms hand back', () => {
    expect(normaliseTag('pt_BR')).toBe('pt-BR');
  });
});

describe('fallbackChain', () => {
  it('degrades a region subtag before reaching English', () => {
    expect(fallbackChain('pt-BR')).toEqual(['pt-BR', 'pt', 'en']);
  });

  it('degrades a script and a region', () => {
    expect(fallbackChain('zh-Hans-CN')).toEqual([
      'zh-Hans-CN',
      'zh-Hans',
      'zh',
      'en',
    ]);
  });

  it('does not repeat English when English is the tag', () => {
    expect(fallbackChain('en')).toEqual(['en']);
    expect(fallbackChain('en-GB')).toEqual(['en-GB', 'en']);
  });

  it('gives up immediately on something that is not a tag', () => {
    expect(fallbackChain('!!')).toEqual(['en']);
    expect(fallbackChain('')).toEqual(['en']);
  });
});

describe('isWellFormedTag', () => {
  it('accepts real tags', () => {
    for (const tag of ['en', 'pt-BR', 'zh-Hans-CN', 'gsw', 'en_GB']) {
      expect(isWellFormedTag(tag)).toBe(true);
    }
  });

  it('rejects rubbish', () => {
    for (const tag of ['', ' ', '!!', '1234', 'e', 'english-language-name']) {
      expect(isWellFormedTag(tag)).toBe(false);
    }
  });
});

describe('resolveLocale', () => {
  it('returns an exact match', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('pt-BR', FUTURE)).toBe('pt-BR');
  });

  it('prefers a region-specific bundle when one exists', () => {
    expect(resolveLocale('pt-BR', FUTURE)).toBe('pt-BR');
  });

  it('degrades a region subtag to its language', () => {
    expect(resolveLocale('pt-PT', FUTURE)).toBe('pt');
    expect(resolveLocale('de-AT', FUTURE)).toBe('de');
    expect(resolveLocale('pt-BR', LANGUAGES_ONLY)).toBe('pt');
  });

  it('falls back to English for a language we do not speak', () => {
    expect(resolveLocale('ja')).toBe('en');
    expect(resolveLocale('ja-JP')).toBe('en');
  });

  it('falls back to English, never to blank', () => {
    for (const input of ['', '   ', '!!', 'not a tag', null, undefined]) {
      const resolved = resolveLocale(input);
      expect(resolved).toBe(DEFAULT_LOCALE);
      expect(resolved).not.toBe('');
    }
  });

  it('is case-insensitive about the incoming tag', () => {
    expect(resolveLocale('EN')).toBe('en');
    expect(resolveLocale('PT-br', FUTURE)).toBe('pt-BR');
  });
});

describe('resolvePreferredLocale', () => {
  it('follows the phone when the preference is system', () => {
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['pt-BR'], FUTURE)).toBe(
      'pt-BR',
    );
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['ja-JP'], FUTURE)).toBe('en');
  });

  it('takes the first device language we actually speak', () => {
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['cy', 'en-GB'], FUTURE)).toBe(
      'en',
    );
  });

  it('gives every device tag a full pass before falling back to English', () => {
    // The subtle one. English is the fallback of *every* tag, so a naive
    // implementation resolves a Welsh-then-German phone to English — the
    // fallback of the first tag wins before German is ever considered.
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['cy', 'de-AT'], FUTURE)).toBe(
      'de',
    );
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['ga', 'pt-BR'], FUTURE)).toBe(
      'pt-BR',
    );
  });

  it('lets an explicit choice override the phone', () => {
    expect(resolvePreferredLocale('de', ['pt-BR'], FUTURE)).toBe('de');
  });

  it('falls back to English when the phone offers nothing usable', () => {
    expect(resolvePreferredLocale(SYSTEM_LOCALE, [], FUTURE)).toBe('en');
    expect(resolvePreferredLocale(SYSTEM_LOCALE, ['ja', 'ko'], FUTURE)).toBe(
      'en',
    );
  });

  it('treats a stored tag we no longer ship as unsupported', () => {
    // Someone chose Portuguese, then we dropped it. English, not blank.
    expect(resolvePreferredLocale('pt', ['pt-BR'], ['en'])).toBe('en');
  });
});
