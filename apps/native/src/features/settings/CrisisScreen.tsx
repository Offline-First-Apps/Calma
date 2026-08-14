import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * j3 — When it's more than this.
 *
 * *"The app states its own limits plainly instead of implying it can hold
 * everything. Sage, not alarm red: this is care, not an emergency."*
 *
 * SAGE FOR THE STAFFED LINES, THE ORDINARY CARD FOR THE GP. That split is in
 * the design and it is not decorative: sage is Calma's colour for something
 * settled, and a line that answers at 3am is the settled option. The GP is a
 * different kind of thing — slower, and a conversation rather than a call —
 * so it sits on the neutral surface.
 *
 * The two staffed lines are tappable and dial or open the messages app. The GP
 * card is not, because there is nothing to tap: Calma does not know who it is,
 * and asking would be collecting a medical contact onto a device whose whole
 * promise is that it collects nothing.
 *
 * REACHABLE FROM SETTINGS AT ANY TIME. Never interstitial, never triggered by
 * a SUDS score, never a modal. The footer says so out loud, which is a promise
 * to the reader that this screen will not start appearing at them.
 */
export function CrisisScreen() {
  const { t } = useTranslation('settings');

  return (
    <Screen>
      <View className="flex-1">
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('crisis.title')}
        </Text>

        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('crisis.body')}
        </Text>

        <View className="mt-6 gap-3">
          <Resource
            name={t('crisis.samaritansName')}
            detail={t('crisis.samaritansDetail')}
            onPress={() => void Linking.openURL('tel:116123')}
          />
          <Resource
            name={t('crisis.shoutName')}
            detail={t('crisis.shoutDetail')}
            onPress={() => void Linking.openURL('sms:85258?body=SHOUT')}
          />
          <Resource
            name={t('crisis.gpName')}
            detail={t('crisis.gpDetail')}
            neutral
          />
        </View>

        <View className="flex-1" />

        <Text variant="footnote" className="mx-1 text-label-quiet">
          {t('crisis.footer')}
        </Text>
      </View>
    </Screen>
  );
}

function Resource({
  name,
  detail,
  onPress,
  neutral = false,
}: {
  name: string;
  detail: string;
  onPress?: () => void;
  neutral?: boolean;
}) {
  const body = (
    <View
      className={`gap-[6px] rounded-3xl border p-5 ${
        neutral
          ? 'border-border bg-surface'
          : 'border-border-plus bg-surface-plus'
      }`}
    >
      <Text
        variant="label"
        className={`font-sans-medium text-[19px] leading-[25px] ${
          neutral ? '' : 'text-plus-foreground'
        }`}
      >
        {name}
      </Text>
      <Text
        variant="callout"
        className={`text-[17px] leading-[25px] ${
          neutral ? 'text-card-secondary' : 'text-plus-muted'
        }`}
      >
        {detail}
      </Text>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${detail}`}
      className="active:opacity-80"
    >
      {body}
    </Pressable>
  );
}
