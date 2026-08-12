import type { DEFAULT_NAMESPACE, Resources } from './resources';

/**
 * Typed keys.
 *
 * This augmentation is what makes `t('worry:captureHint')` check against the
 * `en` bundle. A typo becomes a `check-types` failure instead of a raw key
 * rendering on someone's screen (plans/18-i18n.md#T03).
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
    resources: Resources;
    returnNull: false;
  }
}
