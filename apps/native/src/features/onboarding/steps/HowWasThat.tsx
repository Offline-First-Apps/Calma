import type { PostFeeling } from '@calma/domain';
import { useTranslation } from 'react-i18next';
import { Text as RNText, View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

/**
 * B8 — How was that. `designs/extracted/b8-how-was-that-{light,dark}.html`.
 *
 * THREE IDENTICAL CARDS. No green tick on "Better", no grey on "Worse", no
 * ordering that makes one of them the correct answer. The moment one card is
 * brighter or larger, the screen has told the person which answer it was
 * hoping for — and the person most likely to notice that is the one about to
 * tap "Worse".
 *
 * ONE TAP ENDS THE SCREEN. No confirm, no "are you sure", no follow-up
 * question. The designer's note is explicit about it and the reason is that
 * every extra tap here is a tax on having answered honestly.
 *
 * "WORSE" IS MET WITH WARMTH, NOT CONCERN. Specifically: it is met with
 * nothing at all. No commentary, no escalation, no crisis resource, no "let's
 * try something else". A breath that did not help is allowed to have not
 * helped, and reacting to it would turn a one-tap question into an interview
 * about how bad things are. The warmth is in the absence of a response.
 *
 * NOTHING IS SHOWN ABOUT LAST TIME, because there is no last time — this is
 * the first session the person has ever done.
 *
 * THE THREE FACES LIVE HERE, NOT IN THE JSON, and this is load-bearing:
 * `packages/i18n`'s bundle test forbids emoji in translation files absolutely,
 * which is what stops a well-meaning translator putting a smiley into a
 * sentence about panic. Keeping the faces in the component lets that rule stay
 * a hard one. Same arrangement as `features/breathing/FeelingPicker.tsx`.
 */
const FACES: Record<PostFeeling, string> = {
  better: '😌',
  same: '😐',
  worse: '😔',
};

const ORDER: readonly PostFeeling[] = ['better', 'same', 'worse'];

export function HowWasThat({
  onAnswer,
}: {
  /** `null` when skipped. Stored as `null`, never as "same" (D-007). */
  onAnswer: (feeling: PostFeeling | null) => void;
}) {
  const { t } = useTranslation(['onboarding', 'common', 'breathing']);

  return (
    <View className="flex-1">
      <View
        className="flex-1 justify-center"
        style={{ gap: 34, marginTop: -20 }}
      >
        <Text variant="titleSm">{t('onboarding:howWasThat.title')}</Text>

        <View className="flex-row gap-3">
          {ORDER.map((feeling) => (
            <Touchable
              key={feeling}
              onPress={() => onAnswer(feeling)}
              accessibilityRole="button"
              // The label is the word, not the face. A screen reader saying
              // "pensive face" would be describing a picture of the answer
              // rather than the answer.
              accessibilityLabel={t(`breathing:suds.post.${feeling}`)}
              className="flex-1 items-center justify-center gap-[14px] rounded-sheet border border-border bg-surface px-2 py-[26px]"
            >
              {/* Raw RN Text: an emoji rendered in Newsreader or Figtree falls
                  back to the system emoji font anyway, and forcing a family on
                  it gives inconsistent baselines across platforms. */}
              <RNText style={{ fontSize: 38, lineHeight: 44 }} allowFontScaling>
                {FACES[feeling]}
              </RNText>
              <Text variant="callout" className="text-center text-foreground">
                {t(`breathing:suds.post.${feeling}`)}
              </Text>
            </Touchable>
          ))}
        </View>
      </View>

      <Button
        variant="quiet"
        label={t('common:skip')}
        onPress={() => onAnswer(null)}
      />
    </View>
  );
}
