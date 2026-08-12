import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { requestNotificationPermission } from '@/src/lib/notifications/permission';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * B10 — the notification pre-prompt.
 * `designs/extracted/b10-notifications-{light,dark}.html`.
 *
 * A CUSTOM SCREEN BEFORE THE OS DIALOG, AND THE ORDER IS THE WHOLE POINT.
 *
 * A permission can only be spent once: a denied OS prompt is final on both
 * platforms, and the fallback is a sentence asking someone to visit Settings,
 * which almost nobody does. So the expensive, irreversible question is asked
 * second, and only if the cheap, reversible one got a yes. Declining here
 * never reaches the OS — the permission stays unspent and Settings can offer
 * it again later without having burnt anything.
 *
 * THE PREVIEW IS THE REAL NOTIFICATION, not a mock-up of one. Same string,
 * from the same `notifications` namespace the scheduler will use, with the
 * person's own window time in it. The mono line underneath says so plainly:
 * "this is the whole notification, not an example." That sentence is only
 * allowed to be there because it is true, which is why the preview pulls from
 * i18n rather than restating the copy.
 *
 * "NO THANKS" IS THE SAME HEIGHT AND SHAPE AS THE YES. The designer's note
 * gives the reason and it is a good one: a spent permission cannot be
 * re-earned, so it is not worth a dark pattern. No greyed text, no smaller
 * target, no delay before it becomes tappable.
 *
 * Note there is no Skip here — the two buttons already are the choice, and a
 * third way past would only be a way to answer neither.
 */
export function Notifications({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation(['onboarding', 'notifications']);
  const { prefs: prefsRepo } = useRepositories();
  const updatePrefs = usePrefsStore((state) => state.update);

  const accept = () => {
    // `notificationsAsked` records that the OS dialog was fired, so nothing
    // in the app ever fires it a second time. Set before the await: the
    // permission is spent the moment the dialog appears, whatever the answer.
    void updatePrefs(prefsRepo, { notificationsAsked: true });
    void requestNotificationPermission();
    onContinue();
  };

  const decline = () => {
    // Deliberately does NOT set `notificationsAsked`. Nothing was asked of
    // the OS, so the permission is still there to be offered from Settings
    // later, by someone who has changed their mind.
    onContinue();
  };

  return (
    <View className="flex-1">
      <View className="mt-4 gap-2">
        <Text variant="heading">{t('onboarding:notifications.title')}</Text>
        <Text variant="callout">{t('onboarding:notifications.body')}</Text>
      </View>

      {/*
        The well the preview sits in: a 5% wash of the text colour, so the
        card inside reads as a notification on someone's home screen rather
        than as another card in our layout.

        The design mixes dark mode's wash from the cream (`--warm`) rather
        than from the cool grey `--foreground`. At five percent the two are
        indistinguishable, and a themed token whose only user is a background
        nobody can see is not worth the parity test entry. Noted rather than
        matched -- 26px radius is one-off for the same reason.
      */}
      <View className="mt-[30px] rounded-[26px] bg-foreground/5 p-4">
        <View className="flex-row items-start gap-[14px] rounded-card bg-surface-secondary px-[18px] py-4">
          {/* The app icon, as a shape. Squircle-ish radius, amber gradient
              flattened to a single fill: this is a 42px stand-in inside a
              preview, not the icon itself. */}
          <View className="h-[42px] w-[42px] flex-none rounded-[11px] bg-accent" />

          <View className="flex-1 gap-1">
            {/*
              The app name and timestamp are OS chrome, and in the design they
              carry weights (600 and 400 at 15/14px) that the type scale has no
              entry for. They render at `label` and `caption` rather than
              having a family class stacked on top of the variant's -- two
              font-family utilities on one element resolve by stylesheet order
              rather than class order, which is a coin toss dressed up as an
              override. On a preview of chrome the real OS draws itself, a
              half-step of weight is the right thing to lose.
            */}
            <View className="flex-row items-baseline justify-between gap-[10px]">
              <Text variant="label">{t('notifications:title')}</Text>
              <Text variant="caption">
                {t('onboarding:notifications.preview.now')}
              </Text>
            </View>

            <Text variant="footnote" className="text-foreground">
              {/*
                The actual scheduled string, with a plural form, pulled from
                the namespace the scheduler uses. Two is a plausible number of
                waiting worries and nothing depends on it -- but the sentence
                and its grammar are real, so a translator reviewing this
                preview is reviewing the notification.
              */}
              {t('notifications:worryWindowSoon', { count: 2 })}
            </Text>
          </View>
        </View>

        {/*
          The design sets this line in IBM Plex Mono. That face is design-doc
          annotation and must not ship (`packages/tokens/src/typography.ts`),
          so it renders as `caption` — the app's own smallest voice, which is
          the role the mono was standing in for.
        */}
        <Text variant="caption" className="mx-1 mb-[2px] mt-[14px]">
          {t('onboarding:notifications.preview.disclaimer')}
        </Text>
      </View>

      <View className="flex-1" />

      <View className="gap-[10px]">
        <Button label={t('onboarding:notifications.yes')} onPress={accept} />
        <Button
          variant="secondary"
          label={t('onboarding:notifications.no')}
          onPress={decline}
        />
      </View>
    </View>
  );
}
