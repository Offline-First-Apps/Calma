import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { OptionCard } from '@/src/ui/OptionCard';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Stagger } from '@/src/ui/Stagger';

import {
  ORB_OPTIONS,
  THEME_OPTIONS,
  isOrbThemeAvailable,
} from './appearance';

/**
 * Appearance — the second half of plan 14 T06, and the screen the owner asked
 * for by name.
 *
 * The row existed and its destination did not, so session 18 removed the row.
 * This is the destination.
 *
 * IT APPLIES ON THE TAP, AND IT SURVIVES THE LAUNCH.
 *
 * `useThemePreference` at the root is what makes the second half true.
 * Applying the theme from inside this component would be correct exactly once,
 * on the tap, and would revert the next time the app opened — which is a
 * setting that appears to work, the worst of the three possible states.
 *
 * "MATCH MY PHONE" IS A LIVE BINDING, NOT A RESOLVED VALUE.
 *
 * The `'system'` sentinel is stored and handed to Uniwind as-is. Someone whose
 * phone goes dark at sunset expects Calma to follow. This is the same decision
 * `prefs.locale` makes, for the same reason.
 *
 * THE ORB THEMES ARE LISTED AND TWO OF THEM ARE NOT YET.
 *
 * `wave` and `bloom` are in the schema and in the designs and neither is
 * built. T06 asks for them to read as coming soon rather than as broken
 * options, which is the call `PrivacyScreen` already made for iCloud and
 * export: a control that silently does nothing is worse than a stated
 * absence. `isOrbThemeAvailable` enforces it, so an unbuilt theme cannot be
 * selected by a row somebody forgot to disable.
 */
export function AppearanceScreen() {
  const { t } = useTranslation('settings');
  const repositories = useRepositories();

  const theme = usePrefsStore((state) => state.prefs.theme);
  const orbTheme = usePrefsStore((state) => state.prefs.orbTheme);
  const update = usePrefsStore((state) => state.update);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('theme')}
        </Text>

        <Stagger className="mt-6 gap-[10px]">
          {THEME_OPTIONS.map((option) => (
            <OptionCard
              key={option}
              label={t(`appearanceValue.${option}`)}
              selected={option === theme}
              onPress={() => void update(repositories.prefs, { theme: option })}
            />
          ))}
        </Stagger>

        <Text variant="bodyEmphasis" className="mx-1 mt-9">
          {t('orbTheme.title')}
        </Text>
        <Text variant="callout" className="mx-1 mt-2">
          {t('orbTheme.hint')}
        </Text>

        <Stagger className="mt-[14px] gap-[10px]" from={THEME_OPTIONS.length}>
          {ORB_OPTIONS.map((option) => {
            const available = isOrbThemeAvailable(option);

            return (
              <OptionCard
                key={option}
                label={t(`orbTheme.${option}`)}
                /* The second line says what it is, or that it is not here
                   yet. No padlock, no grey, no "upgrade to unlock" — this
                   is not a tier, it is unfinished work, and saying so is
                   the only honest version. */
                description={
                  available ? t(`orbTheme.${option}Hint`) : t('orbTheme.notYet')
                }
                selected={option === orbTheme}
                onPress={
                  available
                    ? () => void update(repositories.prefs, { orbTheme: option })
                    : undefined
                }
              />
            );
          })}
        </Stagger>
      </ScrollView>
    </Screen>
  );
}
