import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * Placeholder. The real screen arrives with its own plan; this exists so the
 * tab bar can be laid out and checked at 200% font scale before then.
 */
export default function Worries() {
  const { t } = useTranslation('worry');

  return (
    <Screen>
      <View className="flex-1" style={{ paddingBottom: PANIC_FAB_CLEARANCE }}>
        <Text variant="heading">{t('captureHint')}</Text>
      </View>
    </Screen>
  );
}
