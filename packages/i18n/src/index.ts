/**
 * @calma/i18n — every string in the product, and the machinery to resolve one.
 *
 * English ships alone; nothing is hardcoded. Adding a language is meant to be
 * a folder of JSON plus an entry in `supported.ts` (systems/10-i18n.md).
 *
 * This file owns i18next. Everything genuinely reusable — the fallback chain,
 * the formatters, the pseudo-locale — lives in sibling modules with no
 * dependencies at all, so it can be tested in Node and used from the web app,
 * which has no i18next instance.
 */
import i18next, { type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { SYSTEM_LOCALE, resolvePreferredLocale } from './detect';
import { pseudoResources } from './pseudo';
import { DEFAULT_NAMESPACE, NAMESPACES, en, resources } from './resources';
import { DEFAULT_LOCALE, PSEUDO_LOCALE } from './supported';

export * from './detect';
export * from './format';
export * from './intl';
export * from './supported';
export { NAMESPACES, DEFAULT_NAMESPACE } from './resources';
export type { Namespace, Resources } from './resources';

export interface InitOptions {
  /** `prefs.locale` — `'system'` or an explicit tag. */
  preference?: string | null;
  /** The device's languages, most preferred first. */
  deviceTags?: readonly string[];
  /** Adds the dev-only pseudo-locale. Never true in a release build. */
  includePseudoLocale?: boolean;
}

function buildResources(includePseudo: boolean) {
  if (!includePseudo) return resources;

  return {
    ...resources,
    [PSEUDO_LOCALE]: pseudoResources(
      // `Bundle` is recursive and not exported, so the cast is expressed
      // in terms of the function's own parameter rather than a
      // hand-written approximation of it: `Record<string, unknown>` is
      // not assignable to `Bundle`, because `unknown` is not
      // `string | Bundle`.
      en as unknown as Parameters<typeof pseudoResources>[0],
    ),
  };
}

/**
 * Boots i18next.
 *
 * Resolution is synchronous and offline — the bundles are compiled in, so
 * there is no loading state and no chance of a screen rendering untranslated
 * while a fetch is in flight.
 */
export async function initI18n(options: InitOptions = {}): Promise<I18n> {
  const {
    preference = SYSTEM_LOCALE,
    deviceTags = [],
    includePseudoLocale = false,
  } = options;

  const language = resolvePreferredLocale(preference, deviceTags);

  await i18next.use(initReactI18next).init({
    resources: buildResources(includePseudoLocale),
    lng: language,
    // Never a blank string. A missing key shows English, not nothing.
    fallbackLng: DEFAULT_LOCALE,
    ns: [...NAMESPACES],
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: {
      // React escapes for us; double-escaping mangles apostrophes.
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18next;
}

/**
 * Re-resolves the language.
 *
 * Called on boot and again on app foreground: `'system'` is a live binding, so
 * someone who changes their phone's language while Calma is backgrounded
 * should come back to it in the new one.
 *
 * @returns the tag now in use.
 */
export async function applyLocale(
  preference: string | null,
  deviceTags: readonly string[],
): Promise<string> {
  const language = resolvePreferredLocale(preference, deviceTags);

  if (i18next.language !== language) {
    await i18next.changeLanguage(language);
  }

  return language;
}

export { i18next };
export const t = i18next.t.bind(i18next);
