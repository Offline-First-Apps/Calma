import { radius } from '@calma/tokens';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Text } from '@/src/ui/Text';

/**
 * The post-session journaling offer (g1).
 *
 * g1's caption: "A notebook slid across the table: the session is still
 * visible above, the offer occupies only the lower third. Offered once, never
 * after panic, and 'Not right now' leaves no residue."
 *
 * THE ORB IS STILL THERE, AND THAT IS THE POINT.
 *
 * The offer is not a new screen. It is the session dimming, with a card
 * arriving in the lower third -- so accepting is continuing and declining is
 * simply the end of what was already happening. A full-screen prompt would
 * make "no" a thing you have to do rather than a thing you can just not do.
 * The orb keeps its ambient loop at 40% opacity behind it.
 *
 * WHEN IT APPEARS IS DECIDED ELSEWHERE, AND NARROWLY.
 *
 * `shouldOfferJournaling` in `useSession.ts`: pre-session distress of 7+, or a
 * post-check of "same" or "worse". Not a short session, not a skipped rating,
 * not a low score. Someone who felt fine and feels fine is never handed a
 * worksheet.
 *
 * IT IS NEVER ON THE PANIC PATH.
 *
 * There is no import of this file from `PanicSession` or `PanicEnding`, and
 * there is a test asserting that. Plan 07 forbids any modal, prompt or offer
 * on the panic path; session 12 found the flag that had quietly put one
 * there. The way to keep that fixed is for the panic screens to have no route
 * to this component at all.
 *
 * "NOT RIGHT NOW" LEAVES NO RESIDUE.
 *
 * It dismisses permanently for this session -- no badge, no card waiting on
 * the Write tab afterwards, no re-prompt. The stage machine in `SessionScreen`
 * has no path back here, which is stronger than a flag someone could later
 * read the wrong way round.
 */
export function JournalOffer({
  prompt,
  onAccept,
  onDismiss,
}: {
  /** The response-specific line (T09). Same and worse each have their own. */
  prompt: string;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation('journal');
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  return (
    <View className="flex-1 bg-offer">
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 h-[420px] items-center justify-center"
        // 0.4, from the design. Present but no longer the thing being asked
        // of anyone -- it is the room they are still standing in.
        style={{ opacity: 0.4 }}
      >
        <Orb size={210} reduceMotion={reduceMotion} />
      </View>

      <View className="flex-1" />

      <View
        className="mx-[14px] border border-border-offer bg-surface-offer px-[26px] pb-[26px] pt-[30px]"
        style={{
          borderRadius: radius['3xl'],
          marginBottom: Math.max(insets.bottom, 10) + 16,
          // Upward, not downward: the card is arriving from below, and a
          // shadow cast down would make it look like it is sitting on the
          // orb rather than in front of it.
          shadowColor: '#2A3642',
          shadowOffset: { width: 0, height: -10 },
          shadowRadius: 20,
          shadowOpacity: 0.3,
          elevation: 8,
        }}
      >
        <Text variant="headingSm" className="text-[27px] leading-[36px]">
          {prompt}
        </Text>

        {/* 8px apart, and the second is a full-height target rather than a
            line of fine print. Declining must cost exactly as little as
            accepting (systems/05-entitlements.md's rule, applied to an offer
            that is not even commercial). */}
        <View className="mt-5 gap-2">
          <Button className="h-[60px]" label={t('offerYes')} onPress={onAccept} />
          <Button
            variant="quiet"
            className="h-[52px]"
            label={t('offerNo')}
            onPress={onDismiss}
          />
        </View>
      </View>
    </View>
  );
}
