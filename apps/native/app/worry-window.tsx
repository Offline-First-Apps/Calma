import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * The worry window. Full screen, tab bar hidden.
 *
 * Leaving is free: back closes the window with worries still pending, no
 * confirmation and no penalty. Plan 08 builds the triage itself.
 */
export default function WorryWindow() {
  const { t } = useTranslation('worry');
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text variant="heading">{t('window.intro')}</Text>
      </View>

      <Button variant="quiet" label={t('window.leave')} onPress={() => router.back()} />
    </Screen>
  );
}
