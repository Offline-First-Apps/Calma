import { barGradient } from '@calma/tokens';
import { useUniwind } from 'uniwind';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { PlusPrompt } from '@/src/features/entitlement/PlusPrompt';
import { useTier } from '@/src/features/entitlement/store';
import { Text } from '@/src/ui/Text';

import { Bars } from './Bars';
import { SudsTrail } from './SudsTrail';
import { useHistory } from './useHistory';

/**
 * h5 — the "Longer" segment of the Progress tab.
 *
 * Two charts, both about the person and neither about a target. The upper one
 * is how often they came here; the lower is where they were before sessions.
 *
 * *"Hairlines instead of cards so it reads as a margin note. No comparison to
 * last week and no expectation set for the rest of this one."*
 */
export function HistoryView() {
  const { t, i18n } = useTranslation(['progress', 'entitlement']);
  const { theme } = useUniwind();
  const { months, monthBars, suds, ready } = useHistory();
  const tier = useTier();

  if (!ready) return null;

  /*
   * T10 — "Progress dashboard: Current week + streak" on free.
   *
   * This whole segment is the longer view, so on free it is REPLACED rather
   * than reduced: there is no such thing as one week of monthly bars, and
   * drawing the axis with a single stub in it would be a chart of an absence
   * with a price attached.
   *
   * The current week is untouched and lives in the other segments, which is
   * what "sees the current week fully" means — no lock icon appears anywhere
   * on the parts that are free.
   */
  if (tier === 'free') {
    return (
      <ScrollView
        className="mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <PlusPrompt message={t('entitlement:plus.trends')} />
      </ScrollView>
    );
  }

  const palette = theme === 'dark' ? barGradient.dark : barGradient.light;

  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: 'short' });

  const bars = monthBars.map((bar, index) => {
    const point = months[index];
    return {
      fraction: bar.fraction,
      band: bar.band,
      label: point
        ? monthLabel.format(new Date(point.year, point.month, 1))
        : '',
    };
  });

  const hasMonths = monthBars.some((bar) => bar.fraction > 0);

  return (
    <ScrollView
      className="mt-4"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {hasMonths ? (
        <View className="rounded-[28px] border border-border-strong bg-surface-tertiary p-[22px]">
          <View className="mb-[18px] flex-row items-center justify-between gap-3">
            <Text variant="callout" className="flex-1 text-card-secondary">
              {t('history.howOften')}
            </Text>
            <View className="flex-row items-center gap-3">
              <Legend colour={palette.accent[1]} label={t('history.often')} />
              <Legend colour={palette.sage[1]} label={t('history.rarely')} />
            </View>
          </View>

          <Bars
            bars={bars}
            height={160}
            gap={10}
            radius={10}
            gridlines
            accessibilityLabel={t('a11y.monthChart')}
          />
        </View>
      ) : null}

      {/*
        Both charts are omitted rather than emptied when they have nothing.
        An axis with no dots under "Where you were, before sessions" is the
        app showing someone a chart of their own absence.
      */}
      {suds.length > 0 ? (
        <View className="mt-[14px] rounded-[28px] border border-border-strong bg-surface-tertiary p-[22px]">
          <Text variant="callout" className="mb-[6px] text-card-secondary">
            {t('history.beforeSessions')}
          </Text>
          <SudsTrail
            points={suds}
            heavierLabel={t('history.heavier')}
            steadierLabel={t('history.steadier')}
            accessibilityLabel={t('a11y.sudsChart')}
          />
        </View>
      ) : null}

      {!hasMonths && suds.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4 pt-16">
          <Text variant="headingSm" className="text-center">
            {t('empty')}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

/**
 * The legend's two swatches.
 *
 * Only the ends are labelled. Naming the middle band would turn three colours
 * into a three-point scale, and a scale has a top to reach.
 */
function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <View className="flex-row items-center gap-[6px]">
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 3,
          backgroundColor: colour,
        }}
      />
      <Text variant="caption" className="text-card-secondary">
        {label}
      </Text>
    </View>
  );
}
