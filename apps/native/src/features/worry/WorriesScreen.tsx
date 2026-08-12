import { formatWindowTime } from '@calma/i18n';
import { control } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Text } from '@/src/ui/Text';

import { CaptureField } from './CaptureField';
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

  const onCapture = useCallback(
    async (text: string) => {
      await capture(repositories.worry, text);
      // Cheap, and it means capturing a worry after the window has opened
      // reveals "Open it now" without a tab switch.
      setNow(new Date());
    },
    [capture, repositories.worry],
  );

  return (
    <View
      className="flex-1 bg-worry"
      style={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 32,
        paddingBottom: PANIC_FAB_CLEARANCE,
      }}
    >
      <CaptureField onCapture={onCapture} windowTime={windowTime} />

      {/*
        Silence is the correct empty state, but not an empty screen: f1's
        "Nothing waiting. That's a good place to be." is a sentence someone
        should be able to arrive at and feel something about. It carries no
        count and no badge.
      */}
      <View className="mt-[30px] gap-[10px]">
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
      </View>

      {/*
        "Open it now" appears only once the window has opened AND there is
        something to look at. There is no disabled state and no countdown:
        D-008 forbids anything that frames the wait as a deadline, and a
        greyed-out button with a timer under it is exactly that.
      */}
      {pending > 0 && state === 'open' ? (
        <View className="mt-[22px] self-start">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('openNow')}
            onPress={() => router.push('/worry-window')}
            className="flex-row items-center justify-center rounded-full border border-border-clay-quiet bg-surface-clay-quiet px-[26px] active:opacity-90"
            style={{ height: control.compact }}
          >
            <Text
              variant="control"
              className="font-sans-medium text-[17px] leading-[23px] text-clay-ink"
            >
              {t('openNow')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
