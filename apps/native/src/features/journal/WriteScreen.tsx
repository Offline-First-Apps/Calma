import { formatDate } from '@calma/i18n';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { useRepositories } from '@/src/lib/repositories';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

import { selectDrafts, useJournalStore } from './store';

/**
 * The Write tab (g0).
 *
 * STARTING TO WRITE IS THE MOST PROMINENT THING ON THE SCREEN, ALWAYS.
 *
 * T12 and D-015. The blank page sits at the top, is the largest card, holds
 * the only amber button on the screen, and does not move down as the archive
 * grows. Someone opening this tab because they need to write something now
 * must not have to scroll past their own history to do it — an archive that
 * leads turns a writing tool into a record of how much you have written.
 *
 * NO COUNT, NO QUOTA, NO TARGET, ANYWHERE.
 *
 * There is no "3 entries this week", no streak, no progress toward anything.
 * `weekCount` exists in the store for the tier check and is deliberately not
 * read here. Nothing on this screen tells anyone how much they have or have
 * not written.
 */
export function WriteScreen() {
  const { t, i18n } = useTranslation('journal');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();

  const hydrated = useJournalStore((state) => state.hydrated);
  const hydrate = useJournalStore((state) => state.hydrate);
  const startDraft = useJournalStore((state) => state.startDraft);
  const drafts = useJournalStore(selectDrafts);

  useEffect(() => {
    if (!hydrated) void hydrate(repositories.journal);
  }, [hydrate, hydrated, repositories.journal]);

  async function start() {
    const entry = await startDraft(repositories.journal);
    router.push(`/journal/${entry.id}`);
  }

  return (
    <ScrollView
      className="flex-1 bg-write"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 28,
        paddingBottom: PANIC_FAB_CLEARANCE,
      }}
    >
      <View
        className="justify-between border border-border-paper bg-surface-paper px-[26px] pb-6 pt-[26px]"
        style={{ borderRadius: radius['2xl'], minHeight: 210 }}
      >
        {/* Serif, and in the muted colour: an invitation rather than a
            heading. It is the only sentence on the screen that is addressed
            to someone who has not written anything yet. */}
        <Text variant="headingSm" className="text-[27px] leading-[36px] text-faint">
          {t('blankPage')}
        </Text>

        <View className="self-start">
          <Button
            label={t('startWriting')}
            onPress={() => void start()}
            className="h-14 px-[26px]"
          />
        </View>
      </View>

      {drafts.length > 0 ? (
        <View className="mt-[26px] gap-3">
          <SectionLabel>{t('drafts')}</SectionLabel>

          {drafts.map((draft) => (
            <Pressable
              key={draft.id}
              accessibilityRole="button"
              accessibilityLabel={draft.situation.trim() || t('untitled')}
              onPress={() => router.push(`/journal/${draft.id}`)}
              // Dashed, and that is the only difference. A draft is something
              // left open, not something wrong -- no amber, no badge, no
              // "unfinished" label (T11).
              className="border border-dashed border-border-draft bg-surface-draft px-5 py-[18px] active:opacity-80"
              style={{ borderRadius: radius.option }}
            >
              <Text variant="bodySm" className="text-[18px] leading-[26px]">
                {formatDate(new Date(draft.updatedAt), i18n.language)}
              </Text>
              {draft.situation.trim().length > 0 ? (
                <Text variant="callout" className="mt-1 text-[16px] leading-[23px]">
                  {draft.situation.trim()}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* The archive comes last and is never the first thing. Plan 09 T11
          builds the paginated list behind this. */}
      <View className="mt-6">
        <SectionLabel>{t('past')}</SectionLabel>
        <Text variant="callout" className="mt-3">
          {t('empty')}
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * The small uppercase section label from g0.
 *
 * The designs set these in IBM Plex Mono, which Calma does not ship — the app
 * has two typefaces and adding a third for two labels would be a third voice
 * (D-017). Rendered in the sans `caption` variant with the design's tracking
 * instead. Recorded in `plans/09` T12.
 */
function SectionLabel({ children }: { children: string }) {
  return (
    <Text variant="caption" className="uppercase tracking-[1.44px] text-faint">
      {children}
    </Text>
  );
}
