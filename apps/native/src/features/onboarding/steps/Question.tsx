import { HELPED_OPTIONS, WHEN_OPTIONS, WHY_OPTIONS } from '@calma/domain';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { OptionCard } from '@/src/ui/OptionCard';
import { Text } from '@/src/ui/Text';

/**
 * B4, B5 and B6 — the three personalisation questions.
 *
 * `designs/extracted/b4-what-brings-you-here-*.html`
 * `designs/extracted/b5-when-is-it-hardest-*.html`
 * `designs/extracted/b6-has-anything-helped-*.html`
 *
 * ONE COMPONENT FOR THREE SCREENS, BECAUSE THE DESIGNS ARE IDENTICAL AND THAT
 * IS THE FEATURE. The b5 caption says why: "same furniture in the same places
 * as B4, so the second ask costs no new reading." Three questions in a row are
 * only tolerable if they are visibly one conversation rather than three forms.
 * Building them as three files would let them drift apart one small
 * improvement at a time.
 *
 * THE RULES THAT MATTER MORE THAN THE LAYOUT:
 *
 *   - MULTI-SELECT, and nothing is required. Every screen's Continue works
 *     with zero taps, and Skip is a real, visible, equally-weighted option
 *     rather than a smaller grey word.
 *   - ONE QUESTION PER SCREEN. Not two, not a grouped form.
 *   - NO CLINICAL VOCABULARY AND NO SEVERITY SCORING. Nothing here is summed,
 *     weighted, or turned into a profile. "Panic that comes out of nowhere" is
 *     how a person says it; "panic disorder" is how a form says it.
 *   - EVERY OPTION IS EQUAL IN WEIGHT. No option is the concerning one, and
 *     none is the healthy one. See `ui/OptionCard.tsx`.
 *
 * Answers are held by the flow and written once at the end — nothing here
 * persists as it goes, so a person who backs out mid-question has not
 * half-configured their app.
 */

export type QuestionId = 'why' | 'when' | 'helped';

const OPTIONS: Record<QuestionId, readonly string[]> = {
  why: WHY_OPTIONS,
  when: WHEN_OPTIONS,
  helped: HELPED_OPTIONS,
};

export function Question({
  question,
  selected,
  onChange,
  onContinue,
}: {
  question: QuestionId;
  selected: readonly string[];
  onChange: (selected: string[]) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation(['onboarding', 'common']);

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option],
    );
  };

  return (
    <View className="flex-1">
      <View className="mt-4 gap-2">
        {/* `heading` is 32px serif -- the question is meant to be felt, not
            read as a field label. Choosing the variant is choosing the tone. */}
        <Text variant="heading">{t(`onboarding:questions.${question}.title`)}</Text>
        <Text variant="callout">{t('onboarding:questions.whyHint')}</Text>
      </View>

      <View className="mt-[18px] gap-[10px]">
        {OPTIONS[question].map((option) => (
          <OptionCard
            key={option}
            label={t(`onboarding:questions.${question}.${option}`)}
            selected={selected.includes(option)}
            onPress={() => toggle(option)}
          />
        ))}
      </View>

      <View className="flex-1" />

      {/*
        Skip CLEARS this question and moves on; Continue keeps what was
        tapped. Carrying selections through a Skip would be the app deciding
        it knew better than the last thing the person did -- and the person
        most likely to tap two options and then Skip is one who has changed
        their mind about answering at all.

        Neither is delayed, greyed, or smaller than the other. Skip is a real
        answer to a question nobody has to answer.
      */}
      <View className="gap-[6px]">
        <Button label={t('common:continue')} onPress={onContinue} />
        <Button
          variant="quiet"
          label={t('common:skip')}
          onPress={() => {
            onChange([]);
            onContinue();
          }}
        />
      </View>
    </View>
  );
}
