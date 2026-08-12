import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { CrisisExit as CrisisExitPill } from '@/src/ui/CrisisExit';

/**
 * "I need this now" — the one non-negotiable in onboarding (D-014).
 *
 * A ten-step setup flow is a wall in front of someone having a panic attack.
 * Some people download Calma *during* the thing it is for; the store listing
 * promises "the panic that hits at 2am", and someone acting on that promise
 * must not meet a quiz.
 *
 * WHAT MUST HAPPEN WHEN IT IS TAPPED, AND WHAT MUST NOT:
 *
 *   - Straight to a panic session. Nothing in between. No confirmation, no
 *     "are you sure", no save prompt, no permission dialog, no paywall.
 *   - Onboarding is NOT lost and NOT resumed. Defaults are written first, so
 *     the person lands on a working Home when the session ends rather than
 *     back in the flow they fled.
 *   - No haptic, no sound, no animation on the way out. Someone reaching for
 *     this does not need the app to acknowledge the gesture, and the panic
 *     session's own haptic is a beat away.
 *
 * It is styled clay rather than red, and worded plainly rather than cleverly,
 * because it has to be recognisable in about half a second of degraded
 * reading. Most people will never tap it. Its presence is the thing that makes
 * the other nine screens safe to be long.
 *
 * This wrapper is thin on purpose: the pill lives in `ui/` because the panic
 * paths outside onboarding use it too, and the behaviour lives here because
 * "write defaults, then leave" is onboarding's own rule.
 */
export function CrisisExit({ onEscape }: { onEscape: () => void }) {
  const { t } = useTranslation('onboarding');

  return (
    <View className="w-full flex-row justify-end">
      <CrisisExitPill
        label={t('crisisExit')}
        hint={t('crisisExitHint')}
        onPress={onEscape}
      />
    </View>
  );
}
