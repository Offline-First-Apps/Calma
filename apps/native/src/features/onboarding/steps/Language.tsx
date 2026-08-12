import { LANGUAGES, applyLocale } from '@calma/i18n';
import { getLocales } from 'expo-localization';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

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
 * One knowing divergence while it is unreachable: the design gives "Detected"
 * its own 14px size and a slightly duller amber (#8A5A2B / #C79A63) than the
 * reveal's emphasis ink. Rather than add a type step and a colour that exactly
 * one unreachable label would use, this renders at `label` (15px) in
 * `accent-ink`. Revisit on the day a second language ships, against the design
 * file rather than against this comment.
 * ---------------------------------------------------------------------------
 */
export function Language({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation(['onboarding', 'common']);
  const { prefs: prefsRepo } = useRepositories();
  const updatePrefs = usePrefsStore((state) => state.update);

  const [detected] = useState(() => {
    const tags = getLocales().map((locale) => locale.languageTag);
    const match = LANGUAGES.find((language) =>
      tags.some((tag) => tag.toLowerCase().startsWith(language.tag.toLowerCase())),
    );
    return match?.tag ?? LANGUAGES[0]!.tag;
  });

  const [chosen, setChosen] = useState(detected);

  // Changing the language applies to the REST of onboarding, immediately.
  // Someone who corrects our guess on step two should not read the remaining
  // eight screens in the language they just rejected.
  useEffect(() => {
    void applyLocale(chosen, getLocales().map((locale) => locale.languageTag));
  }, [chosen]);

  return (
    <View className="flex-1">
      <View className="mt-4 gap-2">
        <Text variant="title">{t('onboarding:language.title')}</Text>
        <Text variant="callout">{t('onboarding:language.hint')}</Text>
      </View>

      <View className="mt-7 gap-[10px]">
        {LANGUAGES.map((language) => {
          const selected = language.tag === chosen;

          return (
            <Pressable
              key={language.tag}
              onPress={() => setChosen(language.tag)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`h-card flex-row items-center justify-between rounded-card px-5 active:opacity-90 ${
                selected
                  ? 'border-[1.5px] border-accent-wash-border bg-accent-wash'
                  : 'border border-border bg-surface'
              }`}
            >
              {/*
                The native name is content, not copy: it is the same string in
                every locale and must not go through i18n.

                The design sets unselected rows at weight 400 and the selected
                one at 500. Both render at `control` (500) here rather than
                stacking a second font-family utility on the variant's own --
                two of those resolve by stylesheet order rather than class
                order, which is a coin toss dressed up as an override. The
                selection is already carried by the wash, the border and the
                dot; weight was never the signal.
              */}
              <Text variant="control">{language.nativeName}</Text>

              {language.tag === detected ? (
                <View className="flex-row items-center gap-3">
                  <Text variant="label" className="text-accent-ink">
                    {t('onboarding:language.default')}
                  </Text>
                  <View className="h-[14px] w-[14px] rounded-full bg-accent" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
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
