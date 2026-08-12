import type { PostFeeling } from '@calma/domain';
import { useTranslation } from 'react-i18next';
import { Pressable, Text as RNText, View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * The post-session check.
 *
 * "WORSE" IS THE SAME CARD AS "BETTER". Same size, same fill, same border,
 * same position in the row's rhythm. The moment one of them is smaller or
 * duller, the screen is telling someone which answer it was hoping for --
 * and the person most likely to notice that is the one about to tap "Worse".
 *
 * NOTHING IS SHOWN ABOUT LAST TIME. No comparison, no trend, no streak, no
 * "you usually feel better". A session that did not help is allowed to have
 * not helped, and the app is not allowed to argue about it.
 *
 * THE THREE FACES LIVE HERE, NOT IN THE JSON. This is deliberate and load-
 * bearing: `packages/i18n`'s bundle test forbids emoji in translation files
 * absolutely, which is what keeps a well-meaning translator from putting a
 * smiley in a sentence about panic. Keeping the faces in the component means
 * that rule can stay a hard one.
 */

const FACES: Record<PostFeeling, string> = {
  better: '😌',
  same: '😐',
  worse: '😔',
};

const ORDER: readonly PostFeeling[] = ['better', 'same', 'worse'];

export interface FeelingPickerProps {
  /** `null` when skipped. Stored as `null`, never as "same". */
  onSubmit: (feeling: PostFeeling | null) => void;
}

export function FeelingPicker({ onSubmit }: FeelingPickerProps) {
  const { t } = useTranslation('breathing');

  return (
    <View className="flex-1 justify-center" style={{ gap: 34 }}>
      <Text variant="titleSm">{t('suds.post.prompt')}</Text>

      <View className="flex-row gap-3">
        {ORDER.map((feeling) => (
          <Pressable
            key={feeling}
            onPress={() => onSubmit(feeling)}
            accessibilityRole="button"
            // The label is the word, not the face. A screen reader announcing
            // "pensive face" instead of "worse" would be describing a picture
            // of the answer rather than the answer.
            accessibilityLabel={t(`suds.post.${feeling}`)}
            className="flex-1 items-center justify-center gap-[14px] rounded-sheet border border-border bg-surface px-2 py-[26px] active:opacity-90"
          >
            {/*
              Raw RN Text, not the app's `Text`: an emoji rendered in
              Newsreader or Figtree falls back to the system emoji font
              anyway, and forcing a family on it produces inconsistent
              baselines across platforms.
            */}
            <RNText style={{ fontSize: 38, lineHeight: 44 }} allowFontScaling>
              {FACES[feeling]}
            </RNText>
            <Text variant="callout" className="text-center text-foreground">
              {t(`suds.post.${feeling}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button variant="quiet" label={t('suds.pre.skip')} onPress={() => onSubmit(null)} />
    </View>
  );
}
