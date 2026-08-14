import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/src/ui/Button';
import { Enter } from '@/src/ui/Enter';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * The screen for a route that does not exist.
 *
 * IT WAS THE LAST PIECE OF EXPO TEMPLATE IN THE APP: untranslated English, a
 * thinking-face emoji, heroui `Surface` and `Button`, and Tailwind classes
 * from outside the design system. Every one of those is something the rest of
 * the product has a rule against, and this is a screen a person only ever
 * reaches by accident.
 *
 * WHERE IT COMES FROM DECIDES ITS TONE.
 *
 * Nobody navigates here on purpose. They got here from a stale deep link, a
 * notification for something that has since been deleted, or a bug of ours.
 * All three of those are the app's fault, not theirs — so this does not say
 * "page not found", does not name a route, and shows no code. A person who
 * tapped a reminder and landed on an error deserves a sentence, not a
 * diagnosis.
 *
 * NO EMOJI AND NO MARK. `common.json` is asserted emoji-free by the bundle
 * test, and the three feeling faces are the app's only ones and live in a
 * component for exactly that reason. There is no illustration here either:
 * `EmptyPage`'s page mark means "you have not written anything yet", which is
 * a different and much kinder statement than this one.
 *
 * ONE WAY OUT, AND IT GOES HOME RATHER THAN BACK. `back()` would return to
 * whatever produced the bad link, which is where the problem is.
 */
export default function NotFound() {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Enter index={0} className="gap-3">
          <Text variant="heading">{t('notFound.title')}</Text>
          <Text variant="callout" className="text-[17px] leading-[26px]">
            {t('notFound.body')}
          </Text>
        </Enter>
      </View>

      <Enter index={1}>
        <Button
          variant="secondary"
          label={t('notFound.home')}
          onPress={() => router.replace('/')}
        />
      </Enter>
    </Screen>
  );
}
