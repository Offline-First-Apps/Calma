import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * Plans.
 *
 * A sheet, never a page. It appears after an action was attempted, it never
 * blocks one, and "Not now" is the same size and the same speed as "See plans"
 * (systems/05-entitlements.md). Plan 11 wires it to RevenueCat.
 */
export default function Paywall() {
  const { t } = useTranslation('entitlement');
  const router = useRouter();

  return (
    <View className="flex-1 bg-background px-8 pt-8 gap-6">
      <Text variant="headingSm">{t('plans.title')}</Text>

      <View className="gap-3">
        <Button label={t('paywall.primary')} onPress={() => {}} />
        <Button
          variant="quiet"
          label={t('paywall.secondary')}
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}
