import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

import { LinkRow, Section, ToggleRow, ValueRow } from './Rows';
import { PATTERN_KEY, resolveUsualPattern } from './usualRhythm';

/**
 * j1 — Settings.
 *
 * *"Settings are written the same way — every switch says what it does to
 * you, not what it toggles, and the destructive ones are stated once, calmly,
 * and never dressed in red."*
 *
 * Everything onboarding collected is editable here, which is the point:
 * `systems/11-onboarding.md` promises that someone who mis-taps at 2am is not
 * stuck with it, and until this screen existed that promise had nowhere to
 * land. Three sessions of preferences were write-once.
 *
 * WHAT IS NOT HERE, AND WHY:
 *   - no "restore defaults", which is a thing you press by accident once;
 *   - no account section, because there is no account (rule 1);
 *   - no analytics or diagnostics toggle, because there is nothing to send;
 *   - no version-and-build row dressed up as About. It is one line.
 *
 * AND, SINCE SESSION 18: NO ROW THAT LEADS NOWHERE.
 *
 * Name, "what you told us", the worry window and Appearance were all rows
 * pushing to routes that do not exist — so tapping them did nothing at all,
 * which is worse than the setting being absent. A settings screen where half
 * the rows are inert teaches people not to trust any of them. They come back
 * when their destinations do (plan 14 T02-T05, T08).
 */
export function SettingsScreen() {
  const { t } = useTranslation(['settings', 'breathing']);
  const router = useRouter();
  const repositories = useRepositories();
  const prefs = usePrefsStore((state) => state.prefs);
  const update = usePrefsStore((state) => state.update);

  const set = (patch: Parameters<typeof update>[1]) =>
    void update(repositories.prefs, patch);

  /*
    Resolved, not read raw. A stored `'custom'` whose ratio has since gone
    would name a rhythm that cannot be started, and this row is the label on
    the thing Home actually does.
  */
  const rhythm =
    PATTERN_KEY[resolveUsualPattern(prefs.defaultPattern, prefs.customRatio)];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('title')}
        </Text>

        {/*
          j1's first section, and its two rows are the design's: the rhythm
          you usually breathe, and the buzz you follow it with. The buzz sits
          here rather than under Sound & feel because that is where j1 draws
          it, and because it is a breathing feature — it is the thing you
          follow with your eyes closed, which is not a preference about sound.
        */}
        <Section title={t('sections.breathing')}>
          <ValueRow
            label={t('rows.rhythm')}
            value={t(`breathing:patterns.${rhythm}.name`)}
            onPress={() => router.push('/settings/breathing')}
          />
          <ToggleRow
            label={t('rows.haptics')}
            hint={t('rows.hapticsHint')}
            value={prefs.hapticsEnabled}
            onChange={(hapticsEnabled) => set({ hapticsEnabled })}
            last
          />
        </Section>

        <Section title={t('sections.worries')}>
          {/*
            This toggle NEVER fires the OS dialog. A permission can only be
            spent once, and `permission.ts` is explicit that the prompt belongs
            to b10 alone. Turning this on when permission was never granted
            records the preference and deep-links to system settings; it does
            not ask. See plan 14 T07.
          */}
          <ToggleRow
            label={t('rows.windowNotify')}
            hint={t('rows.windowNotifyHint')}
            value={prefs.notificationsAsked}
            onChange={(notificationsAsked) => set({ notificationsAsked })}
            last
          />
        </Section>

        <Section title={t('sections.soundAndFeel')}>
          <ToggleRow
            label={t('rows.sound')}
            hint={t('rows.soundHint')}
            value={prefs.soundEnabled}
            onChange={(soundEnabled) => set({ soundEnabled })}
            last
          />
        </Section>

        <Section title={t('sections.thisPhone')}>
          {/*
            k4's switch. Covers the journal only -- `lock.ts` holds the
            allowlist and breathing is deliberately not on it.
          */}
          <ToggleRow
            label={t('rows.lock')}
            hint={t('rows.lockHint')}
            value={prefs.lockEnabled}
            onChange={(lockEnabled) => set({ lockEnabled })}
          />
          <LinkRow
            label={t('rows.writing')}
            onPress={() => router.push('/settings/privacy')}
          />
          <LinkRow
            label={t('rows.crisis')}
            onPress={() => router.push('/settings/crisis')}
            last
          />
        </Section>

        <Section title={t('sections.plus')}>
          <LinkRow
            label={t('rows.seePlans')}
            onPress={() => router.push('/paywall')}
            last
          />
        </Section>

        {/*
          The silent-switch explainer, and it is a sentence rather than a row
          because there is nothing to change. Somebody wondering why Calma made
          no sound needs an answer, not a setting to hunt for.
        */}
        <Text variant="footnote" className="mx-1 mt-6 text-label-quiet">
          {t('silentSwitch')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

