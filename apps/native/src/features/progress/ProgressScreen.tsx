import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

import { HistoryView } from './HistoryView';
import { Segmented } from './Segmented';
import { StatTiles } from './StatTiles';
import { WeekCard } from './WeekCard';
import { hasAnything } from './phrasing';
import { useProgressWeek } from './useProgress';

/**
 * h1 — the Progress tab.
 *
 * *"Evidence you showed up. Nothing sharper."*
 *
 * The two segments are one tab, not two screens: Week is h1 and Longer is h5.
 * They share the header so switching does not feel like navigating, which is
 * the difference between glancing at your own history and being taken
 * somewhere to be shown something.
 *
 * WHAT IS DELIBERATELY ABSENT, because each of these is one decision away:
 * no total, no average, no "this week vs last", no goal, no ring, no badge,
 * no percentage, no zero, and no sentence anywhere that evaluates the person.
 * The screen reports and stops.
 */
export function ProgressScreen() {
  const { t } = useTranslation('progress');
  const router = useRouter();
  const [segment, setSegment] = useState<'week' | 'longer'>('week');

  const { aggregate, streak, shape, ready } = useProgressWeek();

  return (
    <Screen>
      <View className="flex-1" style={{ paddingBottom: PANIC_FAB_CLEARANCE }}>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="heading" className="text-[30px] leading-[36px]">
            {t('title')}
          </Text>
          <Segmented
            options={[
              { value: 'week', label: t('segment.week') },
              { value: 'longer', label: t('segment.longer') },
            ]}
            value={segment}
            onChange={setSegment}
          />
        </View>

        {/*
          `ready` is false for the first frame or two while MMKV is read.
          Rendering the empty state during it would flash "we'll start keeping
          track as you go" at someone with a six-day streak, so nothing is
          drawn until the numbers are real.
        */}
        {!ready ? null : segment === 'longer' ? (
          <HistoryView />
        ) : hasAnything(aggregate, streak) ? (
          <ScrollView
            className="mt-[14px]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/*
              The card opens h4. There is no chevron and no "see more" — the
              caption calls this a journal margin, and a disclosure arrow would
              make it a row in a settings list.
            */}
            <Touchable
              onPress={() => router.push('/progress/week')}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.openWeek')}
            >
              <WeekCard sessions={aggregate.sessions} shape={shape} />
            </Touchable>

            <StatTiles week={aggregate} streak={streak} />
          </ScrollView>
        ) : (
          <EmptyState />
        )}
      </View>
    </Screen>
  );
}

/**
 * Nothing yet.
 *
 * One sentence, centred, and no skeleton. A dimmed preview of the chart they
 * have not filled in yet would be the app showing someone the shape of their
 * own absence — and it is the single easiest way to make a progress screen
 * discouraging on the day it is least useful to be.
 */
function EmptyState() {
  const { t } = useTranslation('progress');

  return (
    <View className="flex-1 items-center justify-center px-4">
      <Text variant="headingSm" className="text-center">
        {t('empty')}
      </Text>
    </View>
  );
}
