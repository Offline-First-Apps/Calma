import { DEFAULT_LOCALE, SUPPORTED_TAGS } from './supported';

/**
 * Device locale to supported tag.
 *
 * Pure on purpose: the device tag is passed in rather than read from
 * `expo-localization` here, so the whole fallback chain is testable in Node and
 * so this file stays usable from the web app, which has no Expo.
 *
 * The one rule that matters: **never fall back to a blank string.** A missing
 * translation should show English, not nothing.
 */

const TAG_SHAPE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;

/**
 * Normalises a BCP-47 tag to the casing convention: lowercase language,
 * title-case script, uppercase region. `PT-br` and `pt-BR` are the same tag.
 */
export function normaliseTag(tag: string): string {
  const parts = tag.trim().replace(/_/g, '-').split('-');
  const language = parts[0]?.toLowerCase() ?? '';

  return parts
    .map((part, index) => {
      if (index === 0) return language;
      if (part.length === 4) {
        return part[0]?.toUpperCase() + part.slice(1).toLowerCase();
      }
      if (part.length === 2 || part.length === 3) return part.toUpperCase();
      return part.toLowerCase();
    })
    .join('-');
}

/** Whether a string is shaped like a language tag at all. */
export function isWellFormedTag(tag: string): boolean {
  return TAG_SHAPE.test(tag.trim().replace(/_/g, '-'));
}

/**
 * A tag's own subtag degradation, most specific first, with no default
 * appended.
 *
 * Kept separate from `fallbackChain` because a device can list several
 * languages. Appending English to each one in turn would mean a phone set to
 * Welsh, then German, resolved to English — the fallback of the first tag
 * would win before German was ever considered.
 *
 * @example degradationChain('pt-BR') // ['pt-BR', 'pt']
 */
export function degradationChain(tag: string): string[] {
  if (!isWellFormedTag(tag)) return [];

  const parts = normaliseTag(tag).split('-');
  const chain: string[] = [];

  for (let length = parts.length; length > 0; length--) {
    chain.push(parts.slice(0, length).join('-'));
  }

  return chain;
}

/**
 * The chain to try for a single tag, most specific first, always ending at
 * English.
 *
 * @example fallbackChain('pt-BR') // ['pt-BR', 'pt', 'en']
 */
export function fallbackChain(tag: string): string[] {
  const chain = degradationChain(tag);
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
  return chain;
}

/**
 * The tag to actually load.
 *
 * @param requested a device tag, or an explicit choice from settings.
 * @param supported defaults to the shipped registry; injectable for tests.
 */
export function resolveLocale(
  requested: string | null | undefined,
  supported: readonly string[] = SUPPORTED_TAGS,
): string {
  if (typeof requested !== 'string' || requested.trim() === '') {
    return DEFAULT_LOCALE;
  }

  for (const candidate of degradationChain(requested)) {
    if (supported.includes(candidate)) return candidate;
  }

  return DEFAULT_LOCALE;
}

/**
 * The literal stored in `prefs.locale` to mean "follow the phone".
 *
 * It is stored as a sentinel rather than as the resolved tag because it is a
 * live binding: someone who changes their phone's language expects Calma to
 * follow. Snapshotting the tag at first launch silently breaks that.
 */
export const SYSTEM_LOCALE = 'system';

/**
 * Resolves what `prefs.locale` means right now.
 *
 * @param preference `'system'`, or an explicit tag.
 * @param deviceTags the device's languages, most preferred first.
 */
export function resolvePreferredLocale(
  preference: string | null | undefined,
  deviceTags: readonly string[],
  supported: readonly string[] = SUPPORTED_TAGS,
): string {
  if (preference !== SYSTEM_LOCALE && preference) {
    return resolveLocale(preference, supported);
  }

  // The device may list several. Every tag gets a full pass before English is
  // considered, so a phone set to Welsh then German lands on German.
  for (const tag of deviceTags) {
    for (const candidate of degradationChain(tag)) {
      if (supported.includes(candidate)) return candidate;
    }
  }

  return DEFAULT_LOCALE;
}
