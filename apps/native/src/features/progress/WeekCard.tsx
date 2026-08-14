import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/ui/Text';

import { Bars } from './Bars';
import { TileIcon } from './TileIcon';
import { phrase } from './phrase';
import { type Phrase, weekOpener } from './phrasing';
import { type WeekShape, barFractions } from './week';

/**
 * h1's summary card: a sentence, then the seven days under it.
 *
 * The sentence is the point and the chart is the supporting detail — h2's
 * caption: *"No figure is ever larger than the words around it."* Hence the
 * 25px serif over a 94px chart, rather than the other way round, which is what
 * every dashboard in the world would do.
 */

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function WeekCard({
  sessions,
  shape,
  chartHeight = 94,
}: {
  sessions: number;
  shape: WeekShape;
  chartHeight?: number;
}) {
  const { t } = useTranslation('progress');

  const opener = weekOpener(sessions, shape.atNight);
  const fractions = barFractions(shape);

  const bars = shape.days.map((day, index) => ({
    fraction: fractions[index] ?? 0,
    label: t(`days.${WEEKDAY_KEYS[index] ?? 'mon'}`),
  }));

  return (
    <View className="rounded-[28px] border border-border-strong bg-surface-tertiary p-5">
      {opener ? (
        <View className="flex-row items-center gap-[14px]">
          <TileIcon kind="breathing" />
          <Text variant="headingSm" className="flex-1 text-[25px] leading-[33px]">
            {phrase(t, opener)}
          </Text>
        </View>
      ) : null}

      <View className={opener ? 'mt-4' : ''}>
        <Bars
          bars={bars}
          height={chartHeight}
          accessibilityLabel={t('a11y.weekChart')}
        />
      </View>
    </View>
  );
}

