import {
  createRepositories,
  repairIndexes,
  runMigrations,
  type Repositories,
  type Stores,
} from '@calma/db';
import { openStores } from '@calma/db/native';
import { applyLocale, initI18n } from '@calma/i18n';
import { getLocales } from 'expo-localization';

import { usePrefsStore } from '../stores/prefs';

/**
 * The boot sequence.
 *
 * The splash screen stays up for all of it. Nothing here touches the network:
 * RevenueCat is initialised afterwards and never blocks, because someone
 * opening this app on a train in a tunnel is exactly the person who needs it
 * to open (systems/01-architecture.md § Boot sequence).
 *
 * Boot does not fail. If storage cannot be opened, it degrades — the app comes
 * up read-only with a plain sentence. A stack trace in front of someone in
 * distress is not an acceptable failure mode.
 */

export type BootDegradation =
  | { kind: 'storage'; reason: string }
  | { kind: 'migration'; reason: string };

export interface BootResult {
  repositories: Repositories;
  stores: Stores;
  /** Present when something went wrong and the app is running read-only. */
  degraded: BootDegradation | null;
  /** No prefs on disk — this is the first time the app has ever opened. */
  firstRun: boolean;
  locale: string;
}

export async function boot(): Promise<BootResult> {
  // 1. Storage. The encryption key comes out of the Keychain or Keystore, or
  //    is generated on first launch.
  const opened = await openStores();
  const stores = opened.stores;

  let degraded: BootDegradation | null = opened.ok
    ? null
    : { kind: 'storage', reason: opened.reason };

  // 2. Migrations. A failure leaves the version where it was and boots
  //    read-only rather than continuing on half-migrated data.
  if (degraded === null) {
    const migration = runMigrations(stores);
    if (!migration.ok) {
      degraded = { kind: 'migration', reason: migration.error };
    } else if (migration.to > migration.from) {
      // Indexes are derived data, so rebuilding them after a schema change
      // costs a key scan and removes a whole class of upgrade bug.
      repairIndexes(stores.data);
    }
  }

  const repositories = createRepositories(stores);

  // 3. Hydrate. Only prefs at this point; the feature stores hydrate lazily
  //    because nothing on the first screen needs them.
  await usePrefsStore.getState().hydrate(repositories.prefs);
  const prefs = usePrefsStore.getState().prefs;

  // 4. Language. Resolution is synchronous and offline — the bundles are
  //    compiled in — so no screen can render untranslated.
  const deviceTags = getLocales().map((locale) => locale.languageTag);
  await initI18n({
    preference: prefs.locale,
    deviceTags,
    includePseudoLocale: __DEV__,
  });

  return {
    repositories,
    stores,
    degraded,
    firstRun: prefs.onboardingCompletedAt === null,
    locale: await applyLocale(prefs.locale, deviceTags),
  };
}

/**
 * Re-resolves the language.
 *
 * Called on foreground: `'system'` is a live binding, so someone who changes
 * their phone's language while Calma is backgrounded should come back to it in
 * the new one (systems/10-i18n.md § Locale resolution).
 */
export async function refreshLocale(): Promise<string> {
  return applyLocale(
    usePrefsStore.getState().prefs.locale,
    getLocales().map((locale) => locale.languageTag),
  );
}
