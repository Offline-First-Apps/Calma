import { dayKey } from '@calma/domain';
import {
  answerTriage,
  beginTriage,
  currentWorryId,
  resolveTriage,
  summaryShape,
  tally,
} from '@calma/domain';
import { windowLamp } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

import { StreakMoment } from '@/src/features/progress/StreakNote';
import { useStreakMoment } from '@/src/features/progress/useStreakMoment';
import { useRepositories, useStorage } from '@/src/lib/repositories';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

import { TriageAction } from './TriageAction';
import { TriageQuestion } from './TriageQuestion';
import { TriageRelease } from './TriageRelease';
import { WindowSummary } from './WindowSummary';
import { useWorryStore } from './store';

/**
 * The worry window (f4-f8).
 *
 * Full screen, no tab bar, no panic FAB — but the panic path is not closed:
 * the FAB is absent because this screen is already somewhere quiet, and the
 * way out is a single visible control that is never more than one tap away.
 *
 * NEW WORRIES CANNOT BE ADDED FROM HERE (T08).
 *
 * There is no capture field on any of these screens and no route to one: the
 * tab bar is gone, so the Worries tab is unreachable without leaving. f4's
 * caption forbids it, and the reason is that the window is for looking at
 * what you already set down. Adding to the pile while working through it is
 * how a window stops ever ending.
 *
 * NO TOTAL, NO PROGRESS INDICATOR.
 *
 * Also f4's caption. `state.queue.length` is right there and is never
 * rendered. Nothing says "2 of 5", nothing fills up, and the word "clear"
 * appears nowhere — this is not a queue to get through, it is a set of things
 * to look at one at a time until there are none left.
 */
export function WorryWindowScreen() {
  const { t } = useTranslation('worry');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const repositories = useRepositories();
  const { stores } = useStorage();

  const window = useWorryStore((state) => state.window);
  const beginWindow = useWorryStore((state) => state.beginWindow);
  const setWindow = useWorryStore((state) => state.setWindow);
  const closeWindow = useWorryStore((state) => state.closeWindow);
  const restoreWindow = useWorryStore((state) => state.restoreWindow);
  const markProcessed = useWorryStore((state) => state.markProcessed);
  const markReleased = useWorryStore((state) => state.markReleased);

  /** The text of the worry under the cursor. One at a time, never a list. */
  const [text, setText] = useState<string | null>(null);
  const [capturedToday, setCapturedToday] = useState(0);

  // Resume first, open second. A window already in progress must not be
  // replaced by a fresh one — that would silently re-queue worries the person
  // already dealt with this evening.
  useEffect(() => {
    let alive = true;

    void (async () => {
      await restoreWindow(repositories.worry, stores.data);
      if (!alive) return;
      if (useWorryStore.getState().window === null) {
        await beginWindow(repositories.worry, stores.data);
      }
    })();

    return () => {
      alive = false;
    };
  }, [beginWindow, repositories.worry, restoreWindow, stores.data]);

  const id = window === null ? null : currentWorryId(window);

  // The only place worry text is read. Scoped to the current id, replaced
  // when it changes, and never accumulated into an array.
  useEffect(() => {
    if (id === null) {
      setText(null);
      return;
    }

    let alive = true;
    void repositories.worry.get(id).then((worry) => {
      if (alive) setText(worry?.text ?? null);
    });

    return () => {
      alive = false;
    };
  }, [id, repositories.worry]);

  useEffect(() => {
    void repositories.worry
      .countCapturedOn(dayKey(new Date()))
      .then(setCapturedToday);
  }, [repositories.worry]);

  /*
   * h3 fires on the summary and nowhere else.
   *
   * The window is what made today qualify (`aggregates.qualifyingDays`), so
   * the summary is the first moment the streak is true — and it is a screen
   * someone is reading rather than acting on, which is what "in context, over
   * the screen you were already on" asks for.
   */
  const streakMoment = useStreakMoment(window?.stage === 'summary');

  function leave() {
    closeWindow(stores.data);
    router.back();
  }

  if (window === null) return <Ground insets={insets} theme={theme} />;

  const lamp = window.stage === 'intro';

  return (
    <Ground insets={insets} theme={theme} lamp={lamp}>
      {window.stage === 'intro' ? (
        <View className="flex-1 justify-center gap-[22px]">
          <Text variant="display" className="text-[38px] leading-[46px]">
            {t('window.introTitle')}
          </Text>
          <Text variant="body" className="text-[20px] leading-[31px] text-secondary">
            {t('window.introSub')}
          </Text>

          <View className="mt-auto gap-2">
            <Button
              variant="immersive"
              label={t('window.begin')}
              onPress={() => setWindow(stores.data, beginTriage(window))}
            />
            {/* Leaving costs one tap and nothing else. No confirmation, no
                "are you sure", and nothing recorded about having left. */}
            <Button variant="quiet" label={t('window.leave')} onPress={leave} />
          </View>
        </View>
      ) : null}

      {window.stage === 'question' && text !== null ? (
        <TriageQuestion
          text={text}
          onAnswer={(actionable) =>
            setWindow(stores.data, answerTriage(window, actionable))
          }
        />
      ) : null}

      {window.stage === 'action' && id !== null ? (
        <TriageAction
          onDone={(actionText) => {
            void markProcessed(repositories.worry, stores.data, id, actionText);
            setWindow(stores.data, resolveTriage(window, 'actioned'));
          }}
        />
      ) : null}

      {window.stage === 'release' && id !== null && text !== null ? (
        <TriageRelease
          text={text}
          onReleased={() => {
            void markReleased(repositories.worry, stores.data, id);
            setWindow(stores.data, resolveTriage(window, 'released'));
          }}
        />
      ) : null}

      {/*
        h3 — the streak moment, over f8.
        The summary dims to 55% behind it, which is the design's only
        concession to the note: nothing is blocked, nothing is dismissed, and
        the screen underneath stays live. The dimming is done here rather than
        inside `StreakMoment` so that component can never block anything.
      */}
      {window.stage === 'summary' ? (
        <View
          className="flex-1"
          style={{ opacity: streakMoment.streak ? 0.55 : 1 }}
        >
          <WindowSummary
            shape={summaryShape(window)}
            tally={tally(window)}
            capturedToday={capturedToday}
            onClose={leave}
          />
        </View>
      ) : null}

      {streakMoment.streak ? <StreakMoment streak={streakMoment.streak} /> : null}

      {/* The way out, on every screen except the summary, which has its own.
          Always visible, always the same place, never a confirmation. */}
      {window.stage !== 'summary' && window.stage !== 'intro' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('window.leave')}
          onPress={leave}
          className="absolute right-8 h-12 justify-center active:opacity-70"
          style={{ top: Math.max(insets.top, 20) + 8 }}
        >
          <Text variant="callout" className="text-[17px]">
            {t('window.leave')}
          </Text>
        </Pressable>
      ) : null}
    </Ground>
  );
}

/**
 * The window's ground, and the lamp on the intro.
 *
 * f4's caption: "Clay warms toward amber and the light comes from above —
 * sitting down at a table with a lamp on." It is the only light-from-above in
 * the app, it lasts one screen, and it is drawn with svg rather than by
 * adding a gradient dependency — the same reasoning as the orb and the
 * buttons.
 */
function Ground({
  children,
  insets,
  theme,
  lamp = false,
}: {
  children?: React.ReactNode;
  insets: { top: number; bottom: number };
  theme: string;
  lamp?: boolean;
}) {
  const stops = theme === 'dark' ? windowLamp.dark : windowLamp.light;

  return (
    <View className={lamp ? 'flex-1 bg-window-ground' : 'flex-1 bg-worry'}>
      {lamp ? (
        <View className="absolute left-0 right-0 top-0 h-[320px]">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="windowLamp" cx="50%" cy="0%" rx="72%" ry="100%">
                <Stop offset="0%" stopColor={stops.from} />
                <Stop offset="72%" stopColor={stops.to} />
              </RadialGradient>
            </Defs>
            <Ellipse cx="50%" cy="0" rx="100%" ry="100%" fill="url(#windowLamp)" />
          </Svg>
        </View>
      ) : null}

      <View
        className="flex-1"
        style={{
          paddingTop: Math.max(insets.top, 20) + 72,
          paddingHorizontal: 32,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
      >
        {children}
      </View>
    </View>
  );
}
