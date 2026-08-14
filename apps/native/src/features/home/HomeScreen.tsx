import { leadToolFor } from '@calma/domain';
import { formatWindowTime } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { ReOffer } from '@/src/features/onboarding/ReOffer';
import { SettingsButton } from '@/src/features/settings/SettingsButton';
import { OfflineNote } from '@/src/features/states/OfflineNote';
import { ReturningScreen } from '@/src/features/states/ReturningScreen';
import { useReturning } from '@/src/features/states/useReturning';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
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

  const startSigh = useCallback(() => {
    router.push('/session/physiological-sigh');
  }, [router]);

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
              startSigh();
            }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 gap-6" style={{ paddingBottom: PANIC_FAB_CLEARANCE }}>
        {/* The only way into Settings. Top-right, quiet, and it does not
            displace anything -- see the note in `SettingsButton`. */}
        <SettingsButton />

        {/* k2. A note, never a banner: being offline changes nothing about
            what this app can do, so it answers the question and stops. */}
        <OfflineNote />

        <Text variant="title">
          {prefs.name
            ? t('common:greeting.named', { name: prefs.name })
            : t('common:greeting.plain')}
        </Text>

        <ReOffer />

        {lead === 'journal' ? (
          <>
            <View className="gap-3">
              <Button
                label={t('journal:startWriting')}
                onPress={() => router.push('/(tabs)/write')}
              />
            </View>
            <Button
              variant="secondary"
              label={t('common:takeASigh')}
              onPress={startSigh}
            />
          </>
        ) : (
          <>
            <View className="gap-3">
              <Button label={t('common:takeASigh')} onPress={startSigh} />
              <Text variant="callout">
                {t('breathing:patterns.sigh.description')}
              </Text>
            </View>

            <Button
              variant="secondary"
              label={t('common:breatheFor')}
              onPress={() => router.push('/breathe')}
            />
          </>
        )}

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
      </View>
    </Screen>
  );
}
