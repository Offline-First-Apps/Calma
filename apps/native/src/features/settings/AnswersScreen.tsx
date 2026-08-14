import {
  EMPTY_ANSWERS,
  HELPED_OPTIONS,
  WHEN_OPTIONS,
  WHY_OPTIONS,
  type OnboardingAnswers,
} from '@calma/domain';
import { formatWindowTime } from '@calma/i18n';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { OptionCard } from '@/src/ui/OptionCard';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Stagger } from '@/src/ui/Stagger';

import { suggestedWindowMove } from './answerEdits';

/**
 * What you told us — plan 14 T08.
 *
 * WHY THIS SCREEN HAS TO EXIST. `systems/11-onboarding.md` promises that
 * someone who mis-taps at 2am is not stuck with it. Until this screen, three
 * answers collected in the least reliable state a person is ever in were
 * write-once, and one of them silently decided when their worry window opens.
 *
 * IT IS NOT A PROFILE, AND IS BUILT SO IT CANNOT BECOME ONE.
 *
 * No score, no summary line, no "your anxiety type", no completeness meter, no
 * prompt to fill in the one that was skipped. Three questions with the same
 * cards they were first asked with, and clearing every one of them is a valid
 * state that the app works perfectly well in (D-014).
 *
 * THE SAME CARDS, LITERALLY. `OptionCard` is the component b4-b6 use, so every
 * option stays identical in weight — none is the concerning answer and none is
 * the healthy one. Re-styling them here would be the second place that rule
 * has to be remembered.
 *
 * EVERY EDIT SAVES AS IT IS MADE, WITH ONE EXCEPTION, AND THE EXCEPTION IS THE
 * POINT.
 *
 * A tap on a card is a settings change and settings changes do not need a
 * Save. But "when is it hardest" seeds the worry window, and by the time
 * someone is on this screen they have a window they have arranged an evening
 * around. Onboarding could set it silently because there was nothing to
 * overwrite; here there is. So the answer is stored immediately and the window
 * is OFFERED, in a card with two equal ways out, and declining leaves both the
 * new answer and the old window exactly as they are.
 *
 * "What's helped" needs no such offer: Home's lead tool is derived from the
 * stored answer on every read (`leadToolFor`), never copied into a preference,
 * so changing it here changes Home with no write path at all.
 */
export function AnswersScreen() {
  const { t, i18n } = useTranslation(['settings', 'onboarding']);
  const repositories = useRepositories();

  const prefs = usePrefsStore((state) => state.prefs);
  const update = usePrefsStore((state) => state.update);

  const answers = prefs.onboardingAnswers ?? EMPTY_ANSWERS;

  /** The window this screen has offered to move to, or `null` for silence. */
  const [offer, setOffer] = useState<string | null>(null);

  function edit(question: keyof OnboardingAnswers, option: string) {
    const current = answers[question];
    const next = current.includes(option)
      ? current.filter((value) => value !== option)
      : [...current, option];

    void update(repositories.prefs, {
      onboardingAnswers: { ...answers, [question]: next },
    });

    // Only "when" moves anything, and only ever by asking.
    if (question === 'when') {
      setOffer(suggestedWindowMove(next, prefs.worryWindowTime));
    }
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('settings:answersScreen.title')}
        </Text>

        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('settings:answersScreen.body')}
        </Text>

        <Group
          question="why"
          options={WHY_OPTIONS}
          selected={answers.why}
          onToggle={(option) => edit('why', option)}
        />

        <Group
          question="when"
          options={WHEN_OPTIONS}
          selected={answers.when}
          onToggle={(option) => edit('when', option)}
        />

        {/*
          The offer, and it sits directly under the question that raised it
          rather than at the bottom of the screen or over it as a modal. It is
          about the cards immediately above, and a person should be able to see
          both at once.

          Neither button is the quiet one. "Leave it" is a real answer, and the
          answer they just gave is already saved either way.
        */}
        {offer === null ? null : (
          <Card className="mt-4">
            <View className="gap-3">
              <Text variant="body">
                {t('settings:answersScreen.windowOffer', {
                  current: formatWindowTime(prefs.worryWindowTime, i18n.language),
                  suggested: formatWindowTime(offer, i18n.language),
                })}
              </Text>
              <Button
                variant="secondary"
                label={t('settings:answersScreen.windowMove', {
                  suggested: formatWindowTime(offer, i18n.language),
                })}
                onPress={() => {
                  void update(repositories.prefs, { worryWindowTime: offer });
                  setOffer(null);
                }}
              />
              <Button
                variant="quiet"
                label={t('settings:answersScreen.windowKeep')}
                onPress={() => setOffer(null)}
              />
            </View>
          </Card>
        )}

        <Group
          question="helped"
          options={HELPED_OPTIONS}
          selected={answers.helped}
          onToggle={(option) => edit('helped', option)}
        />
      </ScrollView>
    </Screen>
  );
}

/**
 * One question and its cards.
 *
 * The question keeps its own words from onboarding — "When is it hardest?",
 * not "Hardest time of day". A settings screen that rewrites the questions as
 * field labels has turned a conversation into a form, and these particular
 * answers were given to the conversation.
 *
 * It renders at `bodyEmphasis` rather than onboarding's 32px serif: there it
 * was the only thing on the screen and meant to be felt, here it is one of
 * three and meant to be found.
 */
function Group({
  question,
  options,
  selected,
  onToggle,
}: {
  question: 'why' | 'when' | 'helped';
  options: readonly string[];
  selected: readonly string[];
  onToggle: (option: string) => void;
}) {
  const { t } = useTranslation(['settings', 'onboarding']);

  return (
    <View className="mt-7">
      <Text variant="bodyEmphasis" className="mx-1">
        {t(`onboarding:questions.${question}.title`)}
      </Text>

      <Stagger className="mt-[14px] gap-[10px]">
        {options.map((option) => (
          <OptionCard
            key={option}
            label={t(`onboarding:questions.${question}.${option}`)}
            selected={selected.includes(option)}
            onPress={() => onToggle(option)}
          />
        ))}
      </Stagger>
    </View>
  );
}
