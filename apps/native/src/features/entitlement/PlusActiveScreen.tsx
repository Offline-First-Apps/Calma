import Ionicons from '@expo/vector-icons/Ionicons';
import { radius } from '@calma/tokens';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/src/ui/Text';

/**
 * Plus, active (i2).
 *
 * CANCELLING IS A PLAIN ROW IN THE SAME INK AS THE OTHERS.
 *
 * i2's caption. Not hidden, not red, not last-and-smallest, and with no "are
 * you sure you want to lose everything" between the person and the door. An
 * app that makes leaving hard has told you what it thinks of you.
 *
 * THE CLOSING SENTENCE ANSWERS THE QUESTION BEFORE IT IS ASKED.
 *
 * "If you stop, everything you've written stays here and breathing keeps
 * working." It is true -- entries live in local storage and are never gated,
 * and every relief tool is free forever -- and it is the single most useful
 * thing this screen can say to someone with their thumb over "Stop Plus".
 *
 * -------------------------------------------------------------------------
 * WHAT THIS SCREEN CANNOT SHOW, AND WHY (session 13).
 *
 * i2 draws rows for "Payment method  •••• 4417" and "Receipts". Calma runs
 * RevenueCat in anonymous mode with no accounts, so the app never sees a card
 * number and has no receipt list to open; the store holds both. Rendering
 * masked digits would mean inventing them. The owner chose to drop the two
 * rows rather than fake them, leaving "Stop Plus" -- which deep-links to the
 * platform's own subscription page, the only place a subscription can
 * actually be cancelled on either store. Recorded in plans/11 T13.
 * -------------------------------------------------------------------------
 */

/** Where a subscription is actually managed. Neither store allows in-app. */
const MANAGE_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: 'https://play.google.com/store/account/subscriptions',
});

export function PlusActiveScreen({
  /** From RevenueCat's customer info. Absent for lifetime, which never renews. */
  renewsOn,
  since,
}: {
  renewsOn?: string;
  since?: string;
}) {
  const { t } = useTranslation('entitlement');
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 30,
        paddingBottom: Math.max(insets.bottom, 16) + 36,
      }}
    >
      <Text variant="headingSm" className="text-[30px] leading-[36px]">
        {t('active.title')}
      </Text>

      {/* Sage, not amber. Amber is what glows when something is happening;
          a settled subscription is not an event. */}
      <View
        className="mt-5 border border-border-plus bg-surface-plus p-[22px]"
        style={{ borderRadius: radius.note }}
      >
        <Text variant="bodySm" className="text-[18px] leading-[27px] text-plus-foreground">
          {since === undefined ? t('active.lifetime') : t('active.since', { month: since })}
        </Text>
        {renewsOn === undefined ? null : (
          <Text
            variant="bodySm"
            className="mt-1.5 text-[18px] leading-[27px] text-plus-muted"
          >
            {t('active.renews', { date: renewsOn })}
          </Text>
        )}
      </View>

      <View className="mt-5">
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('active.stop')}
          onPress={() => void Linking.openURL(MANAGE_URL)}
          className="flex-row items-center justify-between gap-3.5 px-1 py-5 active:opacity-70"
        >
          <Text variant="bodySm" className="text-[18px] leading-[25px]">
            {t('active.stop')}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#8A939C" />
        </Pressable>
      </View>

      <Text variant="callout" className="mx-1 mt-[22px] text-[17px] leading-[27px]">
        {t('active.survives')}
      </Text>
    </ScrollView>
  );
}
