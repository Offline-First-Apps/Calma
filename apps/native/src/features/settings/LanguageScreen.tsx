import { SYSTEM_LOCALE, applyLocale, resolvePreferredLocale } from '@calma/i18n';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

import { LanguagePicker } from './LanguagePicker';

/**
 * Language — plan 14 T02.
 *
 * IT APPLIES IMMEDIATELY, WITH NO RESTART AND NO CONFIRMATION.
 *
 * `applyLocale` calls `changeLanguage`, react-i18next re-renders the tree, and
 * the screen someone is looking at changes under their thumb. That is the
 * point: a language picker that needs a relaunch asks somebody to act on faith
 * in a language they may not read.
 *
 * The preference is written after the language changes rather than before, so
 * that a failure to load a locale's resources cannot leave prefs claiming a
 * language the app is not showing.
 *
 * "MATCH MY PHONE" STORES A SENTINEL, NOT A TAG. See `LanguagePicker`.
 */
export function LanguageScreen() {
  const { t } = useTranslation('settings');
  const repositories = useRepositories();

  const locale = usePrefsStore((state) => state.prefs.locale);
  const update = usePrefsStore((state) => state.update);

  const deviceTags = getLocales().map((entry) => entry.languageTag);
  const resolved = resolvePreferredLocale(SYSTEM_LOCALE, deviceTags);

  async function choose(next: string) {
    await applyLocale(next, deviceTags);
    await update(repositories.prefs, { locale: next });
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('language')}
        </Text>

        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('languageHint')}
        </Text>

        <View className="mt-6">
          <LanguagePicker
            value={locale}
            resolved={resolved}
            onChange={(next) => void choose(next)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
