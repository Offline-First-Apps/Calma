import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

import { Bars } from './Bars';
import { TileIcon } from './TileIcon';
import { type TileKind } from './TileIcon';
import { phrase } from './phrase';
import {
  type Phrase,
  describeBreathing,
  describeWorries,
  describeWriting,
  quietWeekNote,
} from './phrasing';
import { useProgressWeek } from './useProgress';
import { barFractions } from './week';

/**
 * h4 — the week in full, pushed from h1's card.
 *
 * *"Hairlines instead of cards so it reads as a margin note."* That is the
 * whole difference from h1: the same three facts, but as rows separated by
 * rules rather than as tiles. A tile is an object; a row is a line in a
 * notebook, and this screen is the one you open when you want to read rather
 * than glance.
 *
 * No tab bar — it is a push, not a sixth tab.
 */

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export function WeekSummaryScreen() {
  const { t } = useTranslation('progress');
  const { aggregate, shape, ready } = useProgressWeek();

  if (!ready) return <Screen><View className="flex-1" /></Screen>;

  const fractions = barFractions(shape);
  const bars = shape.days.map((day, index) => ({
    fraction: fractions[index] ?? 0,
    label: t(`days.${WEEKDAY_KEYS[index] ?? 'mon'}`),
  }));

  const rows: [TileKind, Phrase][] = (
    [
      ['breathing', describeBreathing(aggregate)],
      ['worries', describeWorries(aggregate)],
      ['writing', describeWriting(aggregate)],
    ] as [TileKind, Phrase | null][]
  ).filter((row): row is [TileKind, Phrase] => row[1] !== null);

  const quiet = quietWeekNote(aggregate);

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="heading" className="text-[30px] leading-[36px]">
            {t('week.title')}
          </Text>
          {/*
            "Mon–Sun". The designs set it in uppercase mono; Calma has two
            typefaces and never shouts, so it is the sans caption with the
            design's tracking. Same call as the tile labels on h1.
          */}
          <Text variant="caption" className="tracking-[1.2px] text-faint">
            {t('week.range')}
          </Text>
        </View>

        <View className="mt-[14px] rounded-[28px] border border-border-strong bg-surface-tertiary p-5">
          <Text variant="callout" className="mb-[18px] text-card-secondary">
            {t('week.whenYouSatDown')}
          </Text>
          <Bars
            bars={bars}
            height={116}
            accessibilityLabel={t('a11y.weekChart')}
          />
        </View>

        <View className="mt-[18px]">
          {rows.map(([kind, value], index) => (
            <View
              key={kind}
              className={`flex-row items-center gap-[14px] py-4 ${
                index < rows.length - 1 ? 'border-b border-separator-row' : ''
              }`}
            >
              <TileIcon kind={kind} />
              <Text variant="bodySm" className="flex-1 text-[18px] leading-[26px]">
                {phrase(t, value)}
              </Text>
            </View>
          ))}
        </View>

        {quiet ? (
          <Text variant="callout" className="mt-[18px] px-1 text-card-secondary">
            {t(quiet.key)}
          </Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
