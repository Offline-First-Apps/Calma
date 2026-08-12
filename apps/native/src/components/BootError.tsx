import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { Text } from '../ui/Text';

/**
 * Storage could not be opened.
 *
 * On some Android configurations there is no Keystore to put an encryption key
 * in — a phone with no passcode, most often. The honest answer is a plain
 * sentence and a working app, not a crash.
 *
 * Two things this screen deliberately does not do: name the error, and offer a
 * retry that would only fail again. It does keep the panic route reachable,
 * because someone who opened Calma at 3am does not care why saving is broken.
 */
export function BootError({ onContinue }: { onContinue: () => void }) {
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 justify-center gap-6">
        <Text variant="heading">Calma can&apos;t save anything right now.</Text>

        <Text variant="body">
          Everything else works. Breathing, the panic button, the timer — all of
          it. What you write just won&apos;t still be here next time.
        </Text>

        <Text variant="callout">
          This usually means the phone&apos;s secure storage is locked. Setting a
          passcode on the device normally sorts it.
        </Text>
      </View>

      <View className="gap-3">
        <Button label="Go on anyway" onPress={onContinue} />
        <Button
          variant="quiet"
          label="Just breathe"
          onPress={() => router.push('/panic')}
        />
      </View>
    </Screen>
  );
}
