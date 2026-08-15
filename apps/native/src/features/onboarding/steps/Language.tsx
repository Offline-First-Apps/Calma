import {
  SYSTEM_LOCALE,
  applyLocale,
  resolvePreferredLocale,
} from '@calma/i18n';
import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { LanguagePicker } from '@/src/features/settings/LanguagePicker';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * B2 — Language. `designs/extracted/b2-language-{light,dark}.html`.
 *
 * PRE-SELECTED, NEVER BLANK. The device's language is already chosen and
 * marked "Detected" when the screen opens, so the step reads as a checked box
 * rather than a question. The designer's note is explicit that this is a
 * utility step that should look like one.
 *
 * EACH LANGUAGE IN ITS OWN LANGUAGE, AND NO FLAGS. Someone looking for their
 * language does not read the current one, so the list says "Deutsch" and not
 * "German". Flags are countries, not languages, and getting that wrong is a
 * way of telling a Swiss German speaker or a Brazilian which country the app
 * thinks they should be in.
 *
 * ---------------------------------------------------------------------------
 * TODAY THIS SCREEN NEVER RENDERS, AND THAT IS THE CORRECT BEHAVIOUR.
 *
 * English ships alone, so `createOnboarding` drops this step entirely rather
 * than presenting a choice of one. Plan 13 T06 calls this "auto-advance after
 * a beat"; skipping it outright is better than a screen that appears and
 * disappears, which is a flicker a person has to interpret.
 *
 * It is built anyway because the alternative is discovering, on the day a
 * second language lands, that onboarding has no way to choose one. The step is
 * unreachable, not unwritten.
 *
 * ONE KNOWING DIVERGENCE, and it is now shared with Settings. b2 lists the
 * languages and badges the device's one "Detected". This lists "Match my
 * phone" first, naming the language it currently resolves to underneath, and
 * badges nothing. The sentinel is the honest version of "detected" -- it keeps
 * following the phone rather than snapshotting one answer -- and it means the
 * two screens can share a component with no variant between them (plan 14
 * T02). Revisit against the design file on the day a second language ships.
 * ---------------------------------------------------------------------------
 */
export function Language({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation(['onboarding', 'common']);
  const { prefs: prefsRepo } = useRepositories();
  const updatePrefs = usePrefsStore((state) => state.update);

  const [deviceTags] = useState(() =>
    getLocales().map((locale) => locale.languageTag),
  );

  /**
   * PRE-SELECTED, NEVER BLANK, and pre-selected on the sentinel rather than
   * on the detected tag.
   *
   * b2 marks the device's language "Detected". The sentinel says the same
   * thing and keeps saying it: someone who accepts our guess and later
   * changes their phone's language expects Calma to follow, which a stored
   * tag would quietly stop doing a month later.
   */
  const [chosen, setChosen] = useState<string>(SYSTEM_LOCALE);

  const resolved = resolvePreferredLocale(SYSTEM_LOCALE, deviceTags);

  // Changing the language applies to the REST of onboarding, immediately.
  // Someone who corrects our guess on step two should not read the remaining
  // eight screens in the language they just rejected.
  useEffect(() => {
    void applyLocale(chosen, deviceTags);
  }, [chosen, deviceTags]);

  return (
    <View className="flex-1">
      <View className="mt-4 gap-2">
        <Text variant="title">{t('onboarding:language.title')}</Text>
        <Text variant="callout">{t('onboarding:language.hint')}</Text>
      </View>

      <View className="mt-7">
        {/*
          The same component Settings renders, with no variant prop between
          them. Two copies of a list of languages drift the first time one is
          added, and they drift silently.
        */}
        <LanguagePicker
          value={chosen}
          resolved={resolved}
          onChange={setChosen}
        />
      </View>

      <View className="flex-1" />

      <Button
        label={t('common:continue')}
        onPress={() => {
          void updatePrefs(prefsRepo, { locale: chosen });
          onContinue();
        }}
      />
    </View>
  );
}
