import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

import { DeleteSheet } from './DeleteSheet';
import { Chevron, ToggleRow } from './Rows';
import { Pressable } from 'react-native';

/**
 * j2 — Your writing.
 *
 * The privacy copy, verbatim from the design, and the three things you can do
 * about it. Rows are **rules on the ground**, not a card: this screen is a
 * statement with some actions under it rather than a list of settings, and
 * boxing them would make the sentence above look like a section header.
 *
 * "Keep a copy in iCloud" and "Send yourself everything" are drawn and
 * inert — see the Note (session 14) in `plans/14`. Both need machinery that
 * does not exist (a backup path, an export encoder), and drawing a toggle
 * that silently does nothing is worse than an absence. They are marked
 * `disabled` so they read as present-but-not-yet rather than broken, and
 * neither claims to have done anything.
 */
export function PrivacyScreen() {
  const { t } = useTranslation('settings');
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <Screen>
      <View className="flex-1">
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('privacyScreen.title')}
        </Text>

        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('privacyScreen.body')}
        </Text>

        <View className="mt-6">
          <ToggleRow
            label={t('privacyScreen.icloud')}
            hint={t('privacyScreen.icloudHint')}
            value={false}
            onChange={() => undefined}
          />
          <GroundRow
            label={t('privacyScreen.export')}
            onPress={() => undefined}
          />
          <GroundRow
            label={t('privacyScreen.delete')}
            onPress={() => setConfirming(true)}
            last
          />
        </View>

        <View className="flex-1" />

        <Text variant="footnote" className="mx-1 text-label-quiet">
          {t('privacyScreen.footer')}
        </Text>
      </View>

      {confirming ? (
        <DeleteSheet
          onKeep={() => setConfirming(false)}
          onDeleted={() => {
            setConfirming(false);
            // Back to first launch. `dismissAll` rather than `back`, because
            // the stack behind this includes screens that read data that no
            // longer exists.
            router.dismissAll();
            router.replace('/');
          }}
        />
      ) : null}
    </Screen>
  );
}

/** A row standing on the ground rather than inside a card. j2's shape. */
function GroundRow({
  label,
  onPress,
  last = false,
}: {
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`flex-row items-center justify-between gap-[14px] px-1 py-5 active:opacity-70 ${
        last ? '' : 'border-b border-separator-row'
      }`}
    >
      <Text variant="bodySm" className="flex-1 text-[18px] leading-[24px]">
        {label}
      </Text>
      <Chevron />
    </Pressable>
  );
}
