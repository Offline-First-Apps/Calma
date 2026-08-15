import { leadToolFor } from '@calma/domain';
import { formatWindowTime } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { ReOffer } from '@/src/features/onboarding/ReOffer';
import { SettingsButton } from '@/src/features/settings/SettingsButton';
import {
  PATTERN_KEY,
  resolveUsualPattern,
} from '@/src/features/settings/usualRhythm';
import { OfflineNote } from '@/src/features/states/OfflineNote';
import { ReturningScreen } from '@/src/features/states/ReturningScreen';
import { useReturning } from '@/src/features/states/useReturning';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Enter } from '@/src/ui/Enter';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * Home.
 *
 * One obvious next thing, and as little else as possible. Someone opening
 * Calma is usually not browsing.
 *
 * The rule that shapes this screen: **when there is nothing to report, report
 * nothing.** No "0 worries waiting", no empty chart, no zeroed streak. A
 * dashboard of noughts is a list of things you have not done, which is the one
 * thing this app promised never to do.
 */
export function HomeScreen() {
  const { t, i18n } = useTranslation(['common', 'worry', 'breathing', 'journal']);
  const router = useRouter();
  const repositories = useRepositories();
  const prefs = usePrefsStore((state) => state.prefs);

  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    repositories.worry.listPending().then((worries) => {
      if (alive) setPending(worries.length);
    });
    return () => {
      alive = false;
    };
  }, [repositories]);

  /**
   * The rhythm Home offers — j1's "your usual rhythm", and the only thing
   * that preference changes.
   *
   * `resolveUsualPattern` rather than `prefs.defaultPattern` directly: a
   * stored `'custom'` whose ratio has since been erased would make
   * `getPattern` throw, on the one button this app cannot afford to have
   * fail. It falls back to the sigh.
   *
   * The panic FAB is untouched and always the sigh. A preference is a thing
   * someone set on a calm day; the panic path is for a moment when the last
   * thing that should happen is the app doing something they have forgotten
   * choosing (rule 3).
   */
  const usual = resolveUsualPattern(prefs.defaultPattern, prefs.customRatio);
  const usualKey = PATTERN_KEY[usual];

  const startUsual = useCallback(() => {
    router.push({ pathname: '/session/[pattern]', params: { pattern: usual } });
  }, [router, usual]);

  /**
   * What onboarding's third question changed.
   *
   * Derived from the stored answers rather than kept as its own preference:
   * a second copy is a second thing to keep in step, and deriving means
   * editing the answer in Settings changes this with no migration and no
   * write path to get wrong. See `leadToolFor` in `@calma/domain`.
   */
  const lead = leadToolFor(prefs.onboardingAnswers);

  /*
   * k6 — returning after a month.
   *
   * Home is the right host: it is where someone lands, and the screen is a
   * greeting rather than an interruption. It replaces Home's contents for one
   * launch instead of appearing over them, because "Good to see you" competing
   * with "One obvious next thing" is two greetings at once.
   */
  const returning = useReturning();

  if (returning.show) {
    return (
      <Screen>
        <View className="flex-1" style={{ paddingBottom: PANIC_FAB_CLEARANCE }}>
          <ReturningScreen
            onBreathe={() => {
              returning.acknowledge();
              startUsual();
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/*
        SCROLLABLE, LIKE EVERY OTHER TAB.
        
        Home used to be a fixed `flex-1` column. At 200% font scale, or with a
        long name and two waiting worries, the bottom simply went under the
        shelf with no way to reach it. A screen that can grow with the person's
        own content has to scroll, and all of these can.
      */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: PANIC_FAB_CLEARANCE + 24,
          flexGrow: 1,
        }}
      >
        {/* The only way into Settings. Top-right, quiet, and it does not
            displace anything -- see the note in `SettingsButton`. */}
        <SettingsButton />

        {/* k2. A note, never a banner: being offline changes nothing about
            what this app can do, so it answers the question and stops. */}
        <OfflineNote />

        {/*
          THE GREETING GETS ROOM, AND THE ACTION GETS DISTANCE FROM IT.
          
          c1's caption is "the room, and the thing the room is for". The
          previous layout put a uniform `gap-6` between everything, which made
          the greeting, the button, its description and the worry card read as
          four items in a list — the owner's word was "terrible", and the
          reason is that even spacing gives everything equal weight, which is
          the opposite of one obvious next thing.
          
          So: the greeting sits alone at the top with air under it, the
          primary action is a block, and anything else is pushed to the bottom
          of the screen rather than stacked under the button.
        */}
        <Enter index={0} className="mt-2">
          <Text variant="title">
            {prefs.name
              ? t('common:greeting.named', { name: prefs.name })
              : t('common:greeting.plain')}
          </Text>
        </Enter>

        <Enter index={1} className="mt-5">
          <ReOffer />
        </Enter>

        {/* The one obvious thing, with its explanation directly beneath it and
            nothing else within reach. */}
        <Enter index={2} className="mt-10 gap-3">
          {lead === 'journal' ? (
            <>
              <Button
                label={t('journal:startWriting')}
                onPress={() => router.push('/(tabs)/write')}
              />
              <Text variant="callout" className="px-1">
                {t('journal:startWritingHint')}
              </Text>
            </>
          ) : (
            <>
              {/*
                c1 draws "Take a sigh now", and for everyone who has not
                changed their usual rhythm that is exactly what still renders.
                A named alternative would have to be capitalised mid-sentence
                in every locale, so the other three share one calm label and
                the line underneath says which breath it is.
              */}
              <Button
                label={usual === 'physiological-sigh'
                  ? t('common:takeASigh')
                  : t('common:startUsual')}
                onPress={startUsual}
              />
              <Text variant="callout" className="px-1">
                {t(`breathing:patterns.${usualKey}.description`)}
              </Text>
            </>
          )}
        </Enter>

        {/* The second way in, given its own air rather than crowding the
            first. */}
        <Enter index={3} className="mt-4">
          <Button
            variant="secondary"
            label={
              lead === 'journal'
                ? usual === 'physiological-sigh'
                  ? t('common:takeASigh')
                  : t('common:startUsual')
                : t('common:breatheFor')
            }
            onPress={lead === 'journal' ? startUsual : () => router.push('/breathe')}
          />
        </Enter>

        {/* Pushes anything below to the bottom of the screen when there is
            room, so the card never sits directly under the buttons. */}
        <View className="flex-1" style={{ minHeight: 28 }} />

        {/* Only ever rendered when there is something waiting. Silence is the
            correct state, not an empty one. */}
        {pending !== null && pending > 0 ? (
          <Card>
            <View className="gap-2">
              <Text variant="body">
                {t('worry:pending', { count: pending })}
              </Text>
              {/* `windowAt`, not `windowIn`. The key used to be phrased as a
                  duration -- "opens in {{duration}}" -- and was being handed a
                  clock time, so it read "Your window opens in 7:00 PM". f1
                  says "at", the value was always a time, and only the key was
                  ever wrong. */}
              <Text variant="callout">
                {t('worry:windowAt', {
                  time: formatWindowTime(prefs.worryWindowTime, i18n.language),
                })}
              </Text>
              <Button
                variant="quiet"
                label={t('worry:openNow')}
                onPress={() => router.push('/worry-window')}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
