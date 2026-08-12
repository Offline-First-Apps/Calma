import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * A breathing session. Full screen, tab bar hidden.
 *
 * Back and swipe-down ask "Stop here?" rather than dumping someone out
 * mid-cycle — wired up with the engine in plan 06.
 */
export default function Session() {
  const { pattern } = useLocalSearchParams<{ pattern: string }>();
  const { t } = useTranslation('breathing');
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  return (
    <Screen immersive>
      <View className="flex-1 items-center justify-center gap-12">
        <Orb size={300} reduceMotion={reduceMotion} />
        <Text variant="heading">{t('phase.inhale')}</Text>
      </View>

      <Button variant="quiet" label={t('extend.no')} onPress={() => router.back()} />
    </Screen>
  );
}
