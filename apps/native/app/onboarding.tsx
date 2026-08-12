import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * Onboarding. Eleven steps, built in plan 13.
 *
 * This is the welcome beat only, so the boot gate has somewhere to route a
 * first run to. The crisis exit belongs on every step from B1 onward.
 */
export default function Onboarding() {
  const { t } = useTranslation(['onboarding', 'common']);
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-12">
        <Orb size={260} reduceMotion={reduceMotion} />
        <Text variant="title">{t('onboarding:welcome.tagline')}</Text>
      </View>

      <Button label={t('common:continue')} onPress={() => router.replace('/')} />
    </Screen>
  );
}
