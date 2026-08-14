import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Text } from '@/src/ui/Text';

/**
 * k6 — returning after a month.
 *
 * *"Good to see you." / "Everything's where you left it. Shall we breathe?"*
 *
 * NO GUILT, AND NO ACCOUNTING. There is no "it's been 34 days", no "your
 * streak ended", no "welcome back!" with an exclamation mark, and nothing that
 * asks where they have been. The K-group caption names the guilt-trip about
 * the streak as the exact failure this screen exists to avoid.
 *
 * "Everything's where you left it" is the one factual claim, and it is the
 * only one worth making: the fear on reopening an app like this after a bad
 * month is that your writing is gone, or that you will be told off. It answers
 * both in five words.
 *
 * One button, and it is breathing — not "catch up", not a summary of what was
 * missed. The way back in is the same as the way in.
 */
export function ReturningScreen({
  onBreathe,
  reduceMotion = false,
}: {
  onBreathe: () => void;
  reduceMotion?: boolean;
}) {
  const { t } = useTranslation('common');

  return (
    <View className="flex-1 items-center justify-center gap-[34px]">
      <Orb size={224} reduceMotion={reduceMotion} />

      <View className="items-center gap-[14px]">
        <Text
          variant="heading"
          className="max-w-[300px] text-center text-[32px] leading-[41px]"
        >
          {t('returning.title')}
        </Text>
        <Text
          variant="bodySm"
          className="max-w-[300px] text-center text-[18px] leading-[28px] text-card-secondary"
        >
          {t('returning.body')}
        </Text>
      </View>

      <View className="w-full">
        <Button label={t('takeASigh')} onPress={onBreathe} />
      </View>
    </View>
  );
}
