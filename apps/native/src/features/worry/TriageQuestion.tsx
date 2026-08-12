import { control } from '@calma/tokens';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/src/ui/Text';

/**
 * The fork (f5).
 *
 * THEIR WORDS ARE THE LARGEST THING ON SCREEN, AND ARE NEVER TRUNCATED.
 *
 * f5's caption. The worry is set in the serif — the typeface reserved for
 * sentences meant to be felt (D-017) — at 30px, above the question and above
 * both buttons. Someone is being asked to look at something they wrote when
 * they were frightened; the app's question is the smaller text on the screen.
 *
 * No `numberOfLines`, anywhere. A long worry pushes the buttons down and the
 * screen scrolls. Truncating what someone wrote about their own life with an
 * ellipsis, in the moment they are being asked to face it, would be the app
 * saying it had heard enough.
 *
 * TWO IDENTICAL BUTTONS, AND NO THIRD.
 *
 * Same height, same fill, same border, same weight, same order every time.
 * This is a fork, not a recommendation: the app does not know which answer is
 * right for this worry, and styling one as primary would be a guess rendered
 * as advice. There is no "skip" — the caption is explicit that a third option
 * would make avoidance free — but leaving the window entirely is always one
 * tap away, in the corner, and costs nothing.
 */
export function TriageQuestion({
  text,
  onAnswer,
}: {
  text: string;
  onAnswer: (actionable: boolean) => void;
}) {
  const { t } = useTranslation('worry');

  return (
    <>
      {/* Centred in the space above the question, so a one-line worry sits in
          the middle of the screen and a six-line one fills it from the top. */}
      <View className="flex-1 justify-center">
        <Text variant="heading" className="text-[30px] leading-[41px]">
          {text}
        </Text>
      </View>

      <Text variant="bodySm" className="mb-[22px] text-secondary">
        {t('window.question')}
      </Text>

      <View className="gap-[10px]">
        <ForkButton label={t('window.yes')} onPress={() => onAnswer(true)} />
        <ForkButton label={t('window.no')} onPress={() => onAnswer(false)} />
      </View>
    </>
  );
}

/**
 * Deliberately not `Button`.
 *
 * `Button`'s variants encode a hierarchy — primary is the one obvious action,
 * quiet is a dismissal. Neither of these is either. Using `secondary` twice
 * would come close, but it carries `surface-quiet`, which is mixed against
 * `background` and reads washed out on the worry ground; and the fork is 66px
 * where every other button in the app is 62 or 64. Two answers that must be
 * indistinguishable are better expressed by one component used twice than by
 * a variant that happens to look equal today.
 */
function ForkButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="flex-row items-center justify-center rounded-full border border-border-worry-quiet bg-surface-worry-quiet active:opacity-90"
      style={{ height: control.fork, borderRadius: control.fork / 2 }}
    >
      <Text variant="control" className="font-sans-medium">
        {label}
      </Text>
    </Pressable>
  );
}
