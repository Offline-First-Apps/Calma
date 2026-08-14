import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/src/ui/Text';

/**
 * What the free tier sees where its own older writing would be (T10).
 *
 * THERE IS NOTHING BEHIND THIS. No blurred text, no greyed rows, no lock
 * badge over a chart, no "3 more entries" with the words smudged out. T10
 * forbids the fake-blur dark pattern by name, and the reason is specific to
 * this app: blurring someone's own journal is the app holding their words
 * up out of reach. That is a hostile thing to do to anyone, and to someone
 * who came here anxious it is worse.
 *
 * So the older content is never fetched into a renderable shape at all —
 * `currentWeekOnly` returns a count and not the entries — and this is a plain
 * card that says what is there and how to reach it.
 *
 * IT IS ALSO NOT A LIMIT CARD. No sheet, no sound, no haptic, and it does not
 * go through `paywallDecision`: nothing was attempted and no allowance ran
 * out. This is a section of a screen explaining what it is, which is why it
 * sits inline and can be scrolled past without dismissing anything.
 */
export function PlusPrompt({
  /** Already-localised sentence. What is here, not what is missing. */
  message,
}: {
  message: string;
}) {
  const { t } = useTranslation('entitlement');
  const router = useRouter();

  return (
    <View className="mt-[14px] rounded-[28px] border border-border-strong bg-surface-tertiary p-[22px]">
      <Text variant="body" className="text-card-secondary">
        {message}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/paywall')}
        className="mt-4 self-start active:opacity-70"
        hitSlop={10}
      >
        <Text variant="control" className="font-sans-semibold text-accent-ink">
          {t('paywall.primary')}
        </Text>
      </Pressable>
    </View>
  );
}
