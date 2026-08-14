import Ionicons from '@expo/vector-icons/Ionicons';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { useRepositories } from '@/src/lib/repositories';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

import { DraftCard } from './DraftList';
import { EntryList } from './EntryList';
import { selectDrafts, useJournalStore } from './store';

/**
 * How many drafts the tab shows before handing off to g5.
 *
 * g0 draws its drafts section with room for a couple; the full list is its
 * own screen. The cutoff exists so the archive cannot be pushed below the
 * fold by someone who starts a lot of entries -- not because there is
 * anything wrong with having eleven drafts, which is why the screen it links
 * to says so out loud.
 */
const DRAFTS_ON_TAB = 2;

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
  const { t } = useTranslation('journal');
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
          {/* The label is the way to the full list (g5). A section heading
              that navigates is a smaller target than a row, so it carries the
              button role and the whole line is tappable. */}
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('drafts')}
            onPress={() => router.push('/journal/drafts')}
            className=""
          >
            <SectionLabel>{t('drafts')}</SectionLabel>
          </Touchable>

          {drafts.slice(0, DRAFTS_ON_TAB).map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </View>
      ) : null}

      {/* The archive comes last and is never the first thing (T12, D-015). */}
      <View className="mt-6">
        <View className="flex-row items-center justify-between">
          <SectionLabel>{t('past')}</SectionLabel>

          {/*
            The way into search (g7).
            No design shows one -- g7 exists and nothing draws its entrance.
            Put here rather than in a header bar because the Write tab has no
            header, and beside "Earlier" because that is the only place on the
            screen where looking backwards is what someone is doing. A glyph
            with an accessible name rather than a labelled button, so it
            cannot start competing with "Start writing" for attention (T12's
            rule that writing is always the most prominent thing).
            Recorded in plans/09 T14.
          */}
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('search')}
            onPress={() => router.push('/journal/search')}
            hitSlop={12}
            className="h-11 w-11 items-center justify-end pb-1"
          >
            <Ionicons name="search-outline" size={18} color="#8A939C" />
          </Touchable>
        </View>

        <EntryList />
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
