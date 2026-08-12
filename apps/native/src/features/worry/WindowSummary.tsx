import type { SummaryShape, TriageTally } from '@calma/domain';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * The window summary (f8).
 *
 * SENTENCES, NOT A CHART. NOTHING SCORED, NOTHING COMPARED.
 *
 * The caption is unusually direct: "Nothing scored, nothing celebrated,
 * nothing compared to last time." There is no percentage, no ratio of
 * actioned to released, no streak, and no reference to any previous window.
 * A person who released everything three days running is not told that.
 *
 * THREE VARIANTS, BECAUSE ONE SENTENCE DEGRADES BADLY.
 *
 * The mixed wording — "One was within your control — you made a plan. Two
 * weren't — you let them go." — becomes "0 were within your control" the
 * moment either number is zero, which is the register of a form rather than
 * of someone talking to you. So the all-released and all-actioned cases have
 * their own honest sentences, chosen by `summaryShape` in the domain.
 *
 * The closing question has no field under it. It is a pause, not an input —
 * the app asks how that feels and then does not collect the answer, which is
 * the difference between being asked and being surveyed.
 */
export function WindowSummary({
  shape,
  tally,
  capturedToday,
  onClose,
}: {
  shape: SummaryShape;
  tally: TriageTally;
  /** Worries captured today, which is not the same as worries dealt with. */
  capturedToday: number;
  onClose: () => void;
}) {
  const { t } = useTranslation('worry');

  return (
    <View className="flex-1 justify-center gap-[30px]">
      <Text variant="heading" className="text-[29px] leading-[41px]">
        {sentence()}
      </Text>

      <Text variant="aside">{t('window.summary.question')}</Text>

      {/* `secondary`, not `primary`. Closing the window is not an achievement
          to be celebrated with the amber gradient — it is just the way out of
          a room someone has finished being in. */}
      <View className="mt-[10px]">
        <Button
          variant="secondary"
          label={t('window.close')}
          onPress={onClose}
        />
      </View>
    </View>
  );

  function sentence(): string {
    if (shape === 'none') return t('window.summary.none');

    const captured = t('window.summary.captured', { count: capturedToday });

    if (shape === 'allReleased') {
      return `${captured} ${t('window.summary.allReleased', {
        count: tally.released,
      })}`;
    }

    if (shape === 'allActioned') {
      return `${captured} ${t('window.summary.allActioned', {
        count: tally.actioned,
      })}`;
    }

    return `${captured} ${t('window.summary.actioned', {
      count: tally.actioned,
    })} ${t('window.summary.released', { count: tally.released })}`;
  }
}
