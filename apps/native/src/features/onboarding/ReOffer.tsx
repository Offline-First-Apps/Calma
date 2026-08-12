import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Card } from '@/src/ui/Card';
import { Text } from '@/src/ui/Text';

/**
 * The one gentle re-offer, for someone who left through the crisis exit.
 *
 * ONCE. NEVER IMMEDIATELY AFTER. NEVER AS A BLOCKING PROMPT.
 *
 * All three constraints come from `systems/11-onboarding.md`, and the second
 * is the one with teeth. Someone tapped "I need this now" and got a breathing
 * session; the day check in `shouldReOfferOnboarding` guarantees this cannot
 * appear on that same day. Meeting a setup prompt an hour after a panic attack
 * would be the app asking them to fill in a form about it.
 *
 * It is a card on Home, not a modal and not a full screen, so it can be
 * ignored by simply not looking at it — and either answer retires it forever.
 * Declining is permanent. There is no second ask and no "remind me later",
 * because "later" is how a single offer becomes a recurring one.
 *
 * `prefs.onboardingCompletedAt` is already set, so accepting re-enters the
 * flow as a visit rather than as a first run, and leaving it again lands back
 * on a working Home.
 */
export function ReOffer() {
  const { t } = useTranslation('onboarding');
  const router = useRouter();
  const { prefs: prefsRepo } = useRepositories();
  const updatePrefs = usePrefsStore((state) => state.update);

  const offer = usePrefsStore((state) => state.reOfferOnboarding);
  const [dismissed, setDismissed] = useState(false);

  if (!offer || dismissed) return null;

  /** Either answer retires the offer. That is what "once" means. */
  const retire = () => {
    setDismissed(true);
    void updatePrefs(prefsRepo, { onboardingReOffered: true });
  };

  return (
    <Card>
      <View className="gap-3">
        <Text variant="bodySm">{t('reOffer.title')}</Text>
        <View className="gap-2">
          <Button
            variant="secondary"
            label={t('reOffer.yes')}
            onPress={() => {
              retire();
              router.push('/onboarding');
            }}
          />
          <Button variant="quiet" label={t('reOffer.no')} onPress={retire} />
        </View>
      </View>
    </Card>
  );
}
