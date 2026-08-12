/**
 * The language registry.
 *
 * English ships alone. Adding a language is meant to be an entry in this list
 * plus a folder of JSON — never a code change anywhere else
 * (systems/10-i18n.md § What a new language actually costs).
 */

export interface Language {
  /** BCP-47 tag. */
  tag: string;
  /**
   * The language's name *in that language*. This is what the picker shows.
   * Someone looking for their language does not read the current one, so
   * "Deutsch" is right and "German" is not.
   */
  nativeName: string;
  /** For the translator brief and for logs. Never rendered in the app. */
  englishName: string;
}

export const DEFAULT_LOCALE = 'en';

export const LANGUAGES: readonly Language[] = [
  { tag: 'en', nativeName: 'English', englishName: 'English' },
];

export const SUPPORTED_TAGS: readonly string[] = LANGUAGES.map((l) => l.tag);

/**
 * A dev-only pseudo-locale that inflates every string by roughly 40%, used to
 * check that layouts survive German and Finnish before a translator sees them
 * (plans/18-i18n.md#T14). Never offered in the picker, never shipped.
 */
export const PSEUDO_LOCALE = 'en-XA';

export function isSupported(tag: string): boolean {
  return SUPPORTED_TAGS.includes(tag);
}

export function languageFor(tag: string): Language | undefined {
  return LANGUAGES.find((l) => l.tag === tag);
}
