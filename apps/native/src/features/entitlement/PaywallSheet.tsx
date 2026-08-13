import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playSound } from '@/src/lib/audio';
import { hapticTierLimit } from '@/src/lib/haptics';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

import type { LimitKind } from './paywallGate';

/**
 * The card that appears at a limit (plan 11 T06).
 *
 * IT ACKNOWLEDGES WHAT SOMEONE DID BEFORE IT MENTIONS A LIMIT.
 *
 * "You've done 2 entries this week -- that's solid." then the limit, then one
 * sentence about Plus. The order is the whole design: a card that opens with
 * what you cannot do has told an anxious person they have run out of
 * something, and the acknowledgement afterwards reads as consolation.
 *
 * The worry copy points at something still available -- "you can still open
 * your window and work through them". A limit is never a dead end.
 *
 * "NOT NOW" IS NEVER SMALLER, GREYER, OR SLOWER.
 *
 * Same height, same moment, no delay before it becomes tappable, no colour
 * difference beyond the one every quiet button in the app has. There are no
 * countdowns, no "limited offer", no scarcity and no guilt copy anywhere in
 * this component, and there is no free trial to dangle: the free tier is the
 * ongoing demonstration (systems/05-entitlements.md).
 *
 * IT IS NOT A ROUTE.
 *
 * A screen would have to be navigated away from, and navigation is a thing
 * that can go wrong while someone is upset. It renders in place, above the
 * screen that raised it, and `paywallGate` has already decided it is a moment
 * when anything commercial may be shown at all.
 */
export function PaywallSheet({
  kind,
  onDismiss,
}: {
  kind: LimitKind;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('entitlement');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // The bell with a Soft haptic, once, as it arrives. Its 0.5 volume lives
    // in `soundManifest`, not here -- a call site that could raise it is a
    // call site where someone eventually will.
    hapticTierLimit();
    playSound('tierLimit');
  }, []);

  return (
    <View
      className="absolute inset-x-0 bottom-0 border border-border-offer bg-surface-offer px-[26px] pb-[26px] pt-[30px]"
      style={{
        borderTopLeftRadius: radius['3xl'],
        borderTopRightRadius: radius['3xl'],
        paddingBottom: Math.max(insets.bottom, 16) + 26,
        shadowColor: '#2A3642',
        shadowOffset: { width: 0, height: -10 },
        shadowRadius: 20,
        shadowOpacity: 0.3,
        elevation: 8,
      }}
    >
      <Text variant="headingSm" className="text-[24px] leading-[33px]">
        {t(`paywall.${kind}`)}
      </Text>

      <View className="mt-5 gap-2">
        <Button
          className="h-[60px]"
          label={t('paywall.primary')}
          onPress={() => {
            onDismiss();
            router.push('/paywall');
          }}
        />
        <Button
          variant="quiet"
          className="h-[52px]"
          label={t('paywall.secondary')}
          onPress={onDismiss}
        />
      </View>
    </View>
  );
}

/**
 * The one line shown on a second hit the same day (T07).
 *
 * A statement of fact with no verb aimed at the reader, no link, and nothing
 * to dismiss. It says what happened and stops.
 */
export function InlineLimit({ kind }: { kind: 'worry' | 'journal' }) {
  const { t } = useTranslation('entitlement');

  return (
    <Text variant="callout" className="mt-3">
      {t(`inlineLimit.${kind}`)}
    </Text>
  );
}
