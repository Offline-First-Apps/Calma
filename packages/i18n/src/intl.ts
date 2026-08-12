/**
 * Boot-time smoke check for `Intl`.
 *
 * React Native 0.86 ships Hermes with full ICU, so no polyfill is needed. The
 * check exists because the failure mode is quiet and ugly: a stubbed `Intl`
 * degrades to English-formatted dates inside a translated UI, which reads as
 * broken rather than untranslated. Better to fail loudly in dev than to ship
 * that (systems/10-i18n.md § Hermes and Intl).
 */

export interface IntlReport {
  /** Every required constructor exists and produces localised output. */
  ok: boolean;
  /** Constructors that are missing entirely. */
  missing: string[];
  /**
   * True when formatting in a non-English locale differs from English — the
   * evidence that real ICU data is present rather than an English-only stub.
   */
  hasLocaleData: boolean;
}

type IntlLike = typeof globalThis.Intl;

const REQUIRED = [
  'DateTimeFormat',
  'RelativeTimeFormat',
  'NumberFormat',
] as const;

/**
 * @param intl injectable so the failure path can be tested; a real device
 * either has `Intl` or does not, and we cannot delete it at runtime. Pass
 * `null` to mean absent — an explicit `undefined` takes the default parameter
 * and would quietly test the real environment instead.
 */
export function checkIntl(
  intl: IntlLike | null | undefined = globalThis.Intl,
): IntlReport {
  if (!intl) {
    return { ok: false, missing: [...REQUIRED], hasLocaleData: false };
  }

  const missing = REQUIRED.filter(
    (name) => typeof (intl as unknown as Record<string, unknown>)[name] !==
      'function',
  );

  if (missing.length > 0) return { ok: false, missing, hasLocaleData: false };

  let hasLocaleData = false;
  try {
    const date = new Date(Date.UTC(2026, 0, 15));
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      timeZone: 'UTC',
    };
    const english = new intl.DateTimeFormat('en', options).format(date);
    const german = new intl.DateTimeFormat('de', options).format(date);
    // 'January' vs 'Januar'. A stub returns the same string for both.
    hasLocaleData = english !== german;
  } catch {
    hasLocaleData = false;
  }

  return { ok: hasLocaleData, missing: [], hasLocaleData };
}

/**
 * Fails loudly in development, and says nothing in production.
 *
 * Crashing someone's app over a formatting library would be the wrong trade —
 * an English date in a translated UI is bad, a boot loop is worse.
 */
export function assertIntl(
  isDev: boolean,
  intl: IntlLike | null | undefined = globalThis.Intl,
): IntlReport {
  const report = checkIntl(intl);

  if (!report.ok && isDev) {
    const detail = report.missing.length > 0
      ? `missing: ${report.missing.join(', ')}`
      : 'present but carrying no locale data';
    throw new Error(
      `Intl is not usable (${detail}). Dates and numbers would silently ` +
        'render in English inside a translated interface.',
    );
  }

  return report;
}
