import { formatWindowTime } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Text } from '@/src/ui/Text';

import { CaptureField } from './CaptureField';
import { useWorryStore } from './store';

/**
 * Writing a worry down, on its own screen (f2).
 *
 * MOVED OFF THE TAB IN SESSION 18. The field used to sit above the count on
 * the Worries tab, so the tab showed an input, a button and "Nothing waiting.
 * That's a good place to be." all at once — the owner's report was that the
 * empty state and the way to fill it were arguing with each other, and they
 * were right. "Nothing waiting" is a thing to feel; an input box under it
 * turns it into a form label.
 *
 * The tab is now the state and the way in. This is the doing.
 *
 * It keeps the worry ground and the same keyboard behaviour, so it reads as
 * the same room rather than a modal over it — f2's caption calls the card "a
 * slip of paper laid on a table", and a sheet sliding up would make it an
 * interruption instead.
 */
export function CaptureScreen() {
  const { t, i18n } = useTranslation('worry');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();
  const capture = useWorryStore((state) => state.capture);
  const prefs = usePrefsStore((state) => state.prefs);

  const windowTime = formatWindowTime(prefs.worryWindowTime, i18n.language);

  const onCapture = useCallback(
    async (text: string) => {
      await capture(repositories.worry, text);
      // Straight back to the tab, which now reads "1 thing waiting". The
      // confirmation ripple plays on the way out rather than holding the
      // person here to watch it.
      router.back();
    },
    [capture, repositories.worry, router],
  );

  return (
    <View
      className="flex-1 bg-worry"
      style={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 32,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
      }}
    >
      <Text variant="heading" className="mb-6 text-[30px] leading-[38px]">
        {t('newTitle')}
      </Text>

      <CaptureField onCapture={onCapture} windowTime={windowTime} />
    </View>
  );
}
