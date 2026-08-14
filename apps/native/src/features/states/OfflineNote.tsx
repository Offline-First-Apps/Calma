import { useNetworkState } from 'expo-network';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/ui/Text';

/**
 * k2 — offline.
 *
 * *"No connection at the moment. Everything here works anyway."*
 *
 * A SAND-COLOURED NOTE, NOT A BANNER. No red bar, no warning triangle, no
 * retry button, no spinner, and it never blocks anything. Calma is local-first
 * — being offline changes nothing about what the app can do, so the note
 * exists only to answer the question rather than to report a fault.
 *
 * IT IS NOT DISMISSIBLE, and that is cheaper than it sounds: a dismiss control
 * implies the thing is in your way, and this is one line at the top of a
 * screen you can use normally. It disappears when the connection returns.
 *
 * The one place a connection genuinely matters is RevenueCat, and
 * `systems/05-entitlements.md` already covers that: the cached tier never
 * expires, so a paying person is never downgraded because their train went
 * into a tunnel. Nothing about being offline needs to reach them here.
 */
export function OfflineNote() {
  const { t } = useTranslation('common');
  const network = useNetworkState();

  // `undefined` while the first check is in flight. Rendering the note during
  // it would flash "no connection" at everyone on every cold start.
  if (network.isInternetReachable !== false) return null;

  return (
    <View
      accessibilityRole="alert"
      className="rounded-[22px] border border-border bg-surface px-[18px] py-4"
    >
      <Text variant="footnote" className="text-card-secondary">
        {t('offline')}
      </Text>
    </View>
  );
}
