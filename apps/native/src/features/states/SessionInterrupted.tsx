import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Orb } from '@/src/ui/Orb';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * k3 — session interrupted.
 *
 * *"Take the call." / "This will be here after, exactly where you left it."*
 *
 * THE MOST IMPORTANT SCREEN IN THE K BLOCK, because it is the one that fires
 * at the worst possible moment: mid-breath, when the phone rings. Every
 * instinct of a normal app here is wrong — a "Session paused" modal, a
 * countdown, a "Resume?" dialog, or worst of all a discarded session.
 *
 * WHAT IT DOES INSTEAD: gives permission and gets out of the way. "Take the
 * call" is an instruction to leave, from the app, in the app's own voice. It
 * has no buttons at all. There is nothing to dismiss because there is no
 * decision to make.
 *
 * THE ORB STAYS, AT 62%. It does not stop and it does not vanish. The session
 * is not over — it is waiting — and the orb continuing to breathe behind the
 * sentence is the entire reassurance that the sentence is making. Replacing it
 * with a static icon would make the words a promise the screen was visibly not
 * keeping.
 *
 * On the immersive ground, warm text: this is the same lamp-lit room the
 * session was already in, not a new screen laid over it.
 */
export function SessionInterrupted({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const { t } = useTranslation('breathing');

  return (
    <Screen immersive>
      <View className="flex-1 items-center justify-center gap-10">
        {/* 0.62 opacity, from the design. The session recedes; it does not
            pause, and it certainly does not end. */}
        <View style={{ opacity: 0.62 }}>
          <Orb size={250} reduceMotion={reduceMotion} />
        </View>

        <View className="items-center gap-[14px]">
          <Text
            variant="titleSm"
            className="text-center text-[33px] leading-[41px] text-immersive-foreground"
          >
            {t('interrupted.title')}
          </Text>
          <Text
            variant="bodySm"
            className="max-w-[290px] text-center text-[18px] leading-[28px] text-immersive-secondary"
          >
            {t('interrupted.body')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}
