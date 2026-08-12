import { leadToolFor } from '@calma/domain';
import { formatTimeOfDay } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { ReOffer } from '@/src/features/onboarding/ReOffer';
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

  return (
    <Screen>
      <View className="flex-1 gap-8" style={{ paddingBottom: PANIC_FAB_CLEARANCE }}>
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
              <Text variant="callout">
                {t('worry:windowIn', {
                  duration: formatTimeOfDay(
                    prefs.worryWindowTime,
                    i18n.language,
                  ),
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
