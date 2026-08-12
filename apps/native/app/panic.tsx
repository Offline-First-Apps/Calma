import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * The panic session.
 *
 * Full screen, no tab bar, no FAB, nothing else on it. Dismissible at any
 * moment with a single visible button — never trap someone in a screen, least
 * of all this one.
 *
 * The breathing engine lands in plan 06 and replaces the static orb here.
 */
export default function Panic() {
  const { t } = useTranslation('breathing');
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  return (
    <Screen immersive>
      <View className="flex-1 items-center justify-center gap-12">
        <Text variant="title" className="text-center">
          {t('panic.opening')}
        </Text>
        <Orb size={300} reduceMotion={reduceMotion} />
      </View>

      <Button variant="quiet" label={t('panic.dismiss')} onPress={() => router.back()} />
    </Screen>
  );
}
