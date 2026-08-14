import { formatWindowTime } from '@calma/i18n';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLimitNotice } from '@/src/features/entitlement/LimitNotice';
import { useLimit } from '@/src/features/entitlement/useLimit';
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

  const limit = useLimit('worry');
  const { offer, notice } = useLimitNotice('worry', limit);

  const windowTime = formatWindowTime(prefs.worryWindowTime, i18n.language);

  /*
   * T08 — the fourth worry of the day.
   *
   * THE WORRY IS STORED FIRST, AND IS STORED EVEN WHEN IT IS THE FOURTH.
   *
   * Plan 11's own header is the deciding line: "Gates added to features that
   * already work. NO HARD BLOCKS ANYWHERE." And `systems/05` gives the shape
   * — "the action is attempted, then a gentle card appears" — with worry copy
   * chosen to point at something the person can still do, because "a limit
   * should never be a dead end".
   *
   * Refusing it is the alternative reading, and it is the wrong one HERE
   * specifically: `plans/19-review-findings.md` R1 and R5 are about spirals
   * producing several worries three seconds apart, and the whole promise of
   * this screen is that a worry written down stops being carried. An app that
   * declines the fourth one at 2am has broken that promise at the exact
   * moment it mattered, to save a few pence.
   *
   * WHAT THE GATE ACTUALLY DOES: the card appears afterwards, once. Not a
   * disabled button, not a lock, and never before the writing lands.
   */
  const onCapture = useCallback(
    async (text: string) => {
      // Read BEFORE the write: `atLimit` on the way in means this one is the
      // fourth. Reading after would count the worry we just added and fire on
      // the third.
      const wasAtLimit = limit.atLimit;

      await capture(repositories.worry, text);
      limit.refresh();

      if (!wasAtLimit) {
        // Straight back to the tab, which now reads "1 thing waiting". The
        // confirmation ripple plays on the way out rather than holding the
        // person here to watch it.
        router.back();
        return;
      }

      /*
       * Stay, and put the keyboard down.
       *
       * The dismissal is what makes the offer reachable at all: this field
       * holds `'field'` while focused and T16 keeps that focus through a
       * submit, so the gate's answer at this instant is always `silent`.
       * `offer()` queues it and the blur is the boundary that releases it.
       *
       * Leaving instead would unmount the queue with it, which is how this
       * gate would silently never fire.
       */
      Keyboard.dismiss();
      offer();
    },
    [capture, limit, offer, repositories.worry, router],
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

      {/* A sheet the first time today, one quiet line every time after. */}
      {notice}
    </View>
  );
}
