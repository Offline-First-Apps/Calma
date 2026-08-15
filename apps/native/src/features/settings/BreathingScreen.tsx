import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { OptionCard } from '@/src/ui/OptionCard';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Stagger } from '@/src/ui/Stagger';

import { PATTERN_KEY, PICKER_ORDER } from './usualRhythm';

/**
 * Your usual rhythm — j1's Breathing row, and plan 14 T05.
 *
 * WHAT THIS SETTING ACTUALLY CHANGES, IN ONE PLACE.
 *
 * Home's offered breath, and nothing else. Not the panic path, which is the
 * sigh always and reads this never (rule 3, and the note in `prefs.ts`); not
 * the Breathe tab, which lists all four as siblings and always will.
 *
 * That narrowness is the design. A "default pattern" that quietly reorders
 * every picker would make the four cards on d1 stop being four cards.
 *
 * THE FOUR ARE STILL SIBLINGS HERE.
 *
 * Identical cards, identical marks, and the selected one carries the same
 * wash / edge / filled-mark that every other multi-select in the app uses.
 * There is no "recommended", and the custom row wears no padlock — d1's
 * caption forbids it and the reason holds on this screen too: the moment one
 * option is styled as the right answer, choosing becomes a small test.
 *
 * CUSTOM IS A DESTINATION, NOT A SELECTION.
 *
 * Tapping it opens the builder (d7) rather than storing `'custom'` against a
 * ratio that may not exist yet. The builder's own "Use this one" is what
 * stores it, and that is also where the Plus gate lives — the owner's
 * session-13 decision, recorded in `plans/11` T11. Reaching the screen costs
 * nothing on either tier, which is why nothing here is disabled.
 *
 * RATIOS CAN ONLY BE CHANGED HERE, NEVER MID-SESSION. The session reads the
 * pattern once and schedules a whole timeline (`useOrbAnimation`); a ratio
 * that could change under a running breath would either do nothing or restart
 * the orb, and the orb must never restart (D-004).
 */
export function BreathingScreen() {
  const { t } = useTranslation(['settings', 'breathing']);
  const router = useRouter();
  const repositories = useRepositories();

  const defaultPattern = usePrefsStore((state) => state.prefs.defaultPattern);
  const update = usePrefsStore((state) => state.update);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('settings:rhythmScreen.title')}
        </Text>

        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('settings:rhythmScreen.body')}
        </Text>

        <Stagger className="mt-6 gap-[10px]">
          {PICKER_ORDER.map((id) => {
            const key = PATTERN_KEY[id];
            const custom = id === 'custom';

            return (
              <OptionCard
                key={id}
                label={t(`breathing:patterns.${key}.name`)}
                description={t(`breathing:patterns.${key}.description`)}
                selected={id === defaultPattern}
                onPress={() =>
                  custom
                    ? router.push('/custom-rhythm')
                    : void update(repositories.prefs, { defaultPattern: id })
                }
              />
            );
          })}
        </Stagger>

        {/*
          A sentence rather than a warning. Someone who expected the change to
          land mid-breath needs to know when it does land, and "the next time
          you start" is the whole answer.
        */}
        <Text variant="footnote" className="mx-1 mt-6 text-label-quiet">
          {t('settings:rhythmScreen.whenItApplies')}
        </Text>
      </ScrollView>
    </Screen>
  );
}
