import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Text } from '@/src/ui/Text';

/**
 * B1 — Welcome. `designs/extracted/b1-welcome-{light,dark}.html`.
 *
 * SELL THE OUTCOME BY SHOWING IT. The first thing a person sees is the orb,
 * already breathing, at 300px. Not a screenshot of it, not a headline about
 * it — the actual thing, running, in the first frame. Everything this app
 * claims to do is visible before a single word has been read.
 *
 * WHAT IS DELIBERATELY ABSENT, per the designer's note and D-013:
 *   - No feature list. No carousel. No dot pagination.
 *   - No explanation of the orb. Explaining it would make it a diagram.
 *   - No progress hairline yet: "position starts once the asking does", and
 *     nothing is being asked here.
 *   - No sign-up, no email, no account. There is nothing to sign in to.
 *
 * CONTINUE IS SAND, NOT AMBER. This is the one primary action in onboarding
 * that is not the amber gradient, and the reason is in the caption: nothing on
 * this screen is allowed to out-shout the thing that is already breathing. An
 * amber button here would be a second light source competing with the orb, on
 * the one screen whose entire job is the orb.
 */
export function Welcome({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation(['onboarding', 'common']);
  const reduceMotion = useReduceMotion();

  return (
    <View className="flex-1">
      {/*
        -30px, from the design. The optical centre of a circle with a glow
        sits below its geometric centre, and the tagline beneath it pulls the
        pair lower still; nudging up is what makes the group look centred.
      */}
      <View
        className="flex-1 items-center justify-center"
        style={{ gap: 44, marginTop: -30 }}
      >
        <Orb size={300} reduceMotion={reduceMotion} />
        <Text variant="title" className="text-center">
          {t('onboarding:welcome.tagline')}
        </Text>
      </View>

      <Button
        variant="secondary"
        label={t('common:continue')}
        onPress={onContinue}
      />
    </View>
  );
}
