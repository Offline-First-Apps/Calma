import { formatWindowTime } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Enter } from '@/src/ui/Enter';
import { Text } from '@/src/ui/Text';

import { availability } from './schedule';
import { selectPendingCount, useWorryStore } from './store';

/**
 * The Worries tab (f1).
 *
 * THE COUNT IS A SENTENCE AND IT IS NOT THE LARGEST THING ON SCREEN.
 *
 * f1's caption: "The count is a sentence, not a number in a badge, and it is
 * not the largest thing on screen. No previews, no list, no first lines —
 * showing them back would undo the postponement."
 *
 * So there is no `FlatList` here and there is nothing to write one against —
 * the store holds ids, not worries (see `store.ts`). A future "just show the
 * first line" would have to add a data path that does not currently exist,
 * which is the point of building it this way.
 *
 * The field sits ABOVE the count, also from the caption: "so writing never
 * means scrolling past what's already there". Someone arriving mid-spiral
 * lands on the input, not on a tally of how much they are carrying.
 */
export function WorriesScreen() {
  const { t, i18n } = useTranslation('worry');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();

  const prefs = usePrefsStore((state) => state.prefs);
  const pending = useWorryStore(selectPendingCount);
  const hydrated = useWorryStore((state) => state.hydrated);
  const hydrate = useWorryStore((state) => state.hydrate);
  const capture = useWorryStore((state) => state.capture);

  useEffect(() => {
    if (!hydrated) void hydrate(repositories.worry);
  }, [hydrate, hydrated, repositories.worry]);

  /**
   * Re-evaluated on mount rather than on a ticking clock.
   *
   * A `setInterval` here would exist solely so that a button could appear at
   * exactly 19:00:00 under someone who happened to be looking at this screen
   * — and would cost a render every second of every minute they were not.
   * Coming back to the tab re-checks, which covers every real case.
   */
  const [now, setNow] = useState(() => new Date());
  const windowSpec = useMemo(
    () => ({ time: prefs.worryWindowTime, minutes: prefs.worryWindowMinutes }),
    [prefs.worryWindowMinutes, prefs.worryWindowTime],
  );
  const state = availability(now, windowSpec);

  const windowTime = formatWindowTime(prefs.worryWindowTime, i18n.language);

  return (
    <ScrollView
      className="flex-1 bg-worry"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 32,
        paddingBottom: PANIC_FAB_CLEARANCE + 24,
        flexGrow: 1,
      }}
    >
      {/*
        THE STATE FIRST, THEN THE WAY IN. NOT BOTH AT ONCE.
        
        The capture field used to sit above this, so the tab showed an input,
        a button and "Nothing waiting. That's a good place to be." together —
        an empty state arguing with the thing that fills it. "Nothing waiting"
        is a sentence to feel; an input box under it turns it into a form
        label. Writing now happens on its own screen (`/worry/new`).
      */}
      <Enter index={0} className="gap-[10px]">
        {pending === 0 ? (
          <Text variant="headingSm" className="text-[26px] leading-[34px]">
            {t('none')}
          </Text>
        ) : (
          <>
            <Text variant="headingSm" className="text-[26px] leading-[34px]">
              {t('pending', { count: pending })}
            </Text>
            <Text variant="callout" className="text-[17px] leading-[26px]">
              {t('windowAt', { time: windowTime })}
            </Text>
          </>
        )}
      </Enter>

      {/* Full width, because it is the one thing this tab is for. */}
      <Enter index={1} className="mt-7">
        <Button
          label={t('writeOne')}
          onPress={() => router.push('/worry/new')}
        />
      </Enter>

      {/*
        "Open it now" appears only once the window has opened AND there is
        something to look at. There is no disabled state and no countdown:
        D-008 forbids anything that frames the wait as a deadline, and a
        greyed-out button with a timer under it is exactly that.
      */}
      {pending > 0 && state === 'open' ? (
        <View className="mt-3">
          <Button
            variant="quiet"
            label={t('openNow')}
            onPress={() => router.push('/worry-window')}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
