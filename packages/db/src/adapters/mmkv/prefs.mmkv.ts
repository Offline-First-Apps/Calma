import { type Prefs, defaultPrefs, prefsSchema } from '@calma/domain';

import { PREFS_KEY } from '../../keys';
import type { KeyValueStore } from '../../kv';
import type { PrefsRepo } from '../../ports/prefs.repo';
import { recordCorruption } from './validate';

/**
 * Preferences.
 *
 * Read defensively: prefs outlive app versions, so the stored object is
 * treated as a bag of maybe-valid fields rather than as a `Prefs`. A field we
 * no longer recognise is dropped, a field we have added since arrives as its
 * default, and one bad value does not cost someone every other setting they
 * chose.
 */
export function createPrefsRepo(store: KeyValueStore): PrefsRepo {
  function read(): Prefs {
    const raw = store.getString(PREFS_KEY);
    if (raw === undefined) return { ...defaultPrefs };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      recordCorruption({ key: PREFS_KEY, reason: 'unparseable' });
      return { ...defaultPrefs };
    }

    const whole = prefsSchema.safeParse(parsed);
    if (whole.success) return whole.data;

    // Salvage. Validate field by field against the full schema, keeping what
    // holds up. Losing someone's chosen worry window because an unrelated
    // field went bad would be a poor trade.
    recordCorruption({ key: PREFS_KEY, reason: 'invalid-shape' });

    if (typeof parsed !== 'object' || parsed === null) {
      return { ...defaultPrefs };
    }

    const candidate: Record<string, unknown> = { ...parsed };
    const salvaged: Record<string, unknown> = { ...defaultPrefs };

    for (const key of Object.keys(defaultPrefs)) {
      if (!(key in candidate)) continue;

      const attempt = prefsSchema.safeParse({
        ...defaultPrefs,
        [key]: candidate[key],
      });
      if (attempt.success) salvaged[key] = candidate[key];
    }

    return prefsSchema.parse(salvaged);
  }

  function write(prefs: Prefs): Prefs {
    store.set(PREFS_KEY, JSON.stringify(prefs));
    return prefs;
  }

  return {
    async get() {
      return read();
    },

    async set(patch) {
      const next = prefsSchema.parse({ ...read(), ...patch });
      return write(next);
    },

    async reset() {
      return write({ ...defaultPrefs });
    },
  };
}
