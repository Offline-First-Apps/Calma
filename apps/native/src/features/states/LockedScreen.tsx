import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

/**
 * k4 — Calma is locked.
 *
 * *"The most important decision in the set: breathing is reachable without
 * authenticating, and it's the primary button. Only the writing is behind the
 * lock."*
 *
 * THAT IS RULE 3, ENFORCED AT THE LOCK SCREEN. "No friction on the panic path"
 * cannot survive a lock that gates everything — someone at 3am who cannot get
 * Face ID to read their face has, at that exact moment, the least patience
 * they will ever have. So the amber button, the one obvious action, bypasses
 * the lock entirely and goes straight to breathing. Unlocking is the quiet
 * text link underneath.
 *
 * Getting this the usual way round — "Unlock" as primary, breathing behind
 * it — would be the single worst decision available in this app.
 *
 * The lock only ever protects the writing. Nothing else on the device is
 * private in a way that a person mid-panic should have to prove.
 */
export function LockedScreen({
  onBreathe,
  onUnlock,
}: {
  onBreathe: () => void;
  onUnlock: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-[30px]">
        <Padlock />

        <View className="items-center gap-3">
          <Text variant="heading" className="text-center text-[30px] leading-[38px]">
            {t('locked.title')}
          </Text>
          <Text
            variant="callout"
            className="max-w-[280px] text-center text-[17px] leading-[26px] text-card-secondary"
          >
            {t('locked.body')}
          </Text>
        </View>

        <View className="w-full gap-[10px]">
          {/* Primary. Breathing does not wait for authentication. */}
          <Button label={t('locked.breathe')} onPress={onBreathe} />

          <Touchable
            onPress={onUnlock}
            accessibilityRole="button"
            className="h-[52px] items-center justify-center"
          >
            <Text variant="callout" className="text-[17px] text-label-quiet">
              {t('locked.unlock')}
            </Text>
          </Touchable>
        </View>
      </View>
    </Screen>
  );
}

/**
 * A drawn padlock: shackle, body, keyhole.
 *
 * The keyhole is `glyph-accent` — the one warm point on an otherwise neutral
 * mark. It is the only thing on this screen besides the button that carries
 * any amber, and it keeps the padlock from reading as a security warning.
 */
function Padlock() {
  return (
    <View style={{ width: 96, height: 96 }}>
      <View
        className="absolute border-[3px] border-b-0 border-lock-shackle"
        style={{
          left: 25,
          top: 0,
          width: 46,
          height: 44,
          borderTopLeftRadius: 23,
          borderTopRightRadius: 23,
        }}
      />
      <View
        className="absolute bottom-0 left-0 right-0 rounded-[18px] border border-border bg-surface"
        style={{ height: 58 }}
      />
      <View
        className="absolute bg-glyph-accent"
        style={{ left: 43.5, bottom: 24, width: 9, height: 9, borderRadius: 4.5 }}
      />
    </View>
  );
}
