import type { JournalEntry } from '@calma/domain';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRepositories } from '@/src/lib/repositories';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

import { useDayLabel } from './dayLabel';
import { selectDrafts, useJournalStore } from './store';

/**
 * Drafts (g5).
 *
 * THE DASHED EDGE IS THE ENTIRE SIGNAL.
 *
 * g5's caption: "A dashed edge says in-progress without saying broken. Human
 * days, no counts, no badges, no expiry, and never the words incomplete or
 * unfinished." So there is no amber here, no "1 of 3", no age, and nothing
 * that could be read as a chore list. The closing line exists to give drafts
 * explicit permission to stay drafts, which is the opposite of a nudge.
 *
 * RESUMING LANDS ON THE FIRST EMPTY PROMPT, NOT THE FIRST PROMPT.
 *
 * `firstEmptyStep` (T07). Re-reading four answers you already gave to reach
 * the one you did not is a tax on having been interrupted, and being
 * interrupted is the normal case for this screen.
 *
 * DISCARD IS NOT IN THE DESIGN, AND IS REQUIRED BY THE PLAN.
 *
 * g5 draws a list and no delete affordance; T07 requires one behind "a single
 * honest confirmation". Resolved by making it a long press that turns the
 * card itself into the question -- no system alert, because an OS dialog is a
 * modal in a foreign material, and no swipe-to-delete, because a list of
 * half-written thoughts is the last place to put a gesture that destroys
 * something when a thumb slips. The confirmation states plainly what is lost;
 * it does not ask twice and it does not warn. Recorded in plans/09 T07.
 */
export function DraftList() {
  const { t } = useTranslation('journal');
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();

  const hydrated = useJournalStore((state) => state.hydrated);
  const hydrate = useJournalStore((state) => state.hydrate);
  const drafts = useJournalStore(selectDrafts);

  useEffect(() => {
    if (!hydrated) void hydrate(repositories.journal);
  }, [hydrate, hydrated, repositories.journal]);

  return (
    <ScrollView
      className="flex-1 bg-write"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 28,
        paddingBottom: Math.max(insets.bottom, 16) + 32,
      }}
    >
      <Text variant="heading">{t('drafts')}</Text>

      <View className="mt-[22px] gap-3">
        {drafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} />
        ))}
      </View>

      {/* "Drafts keep as long as you like." Not a hint, not a tip: it is the
          screen answering the question it knows it has just raised. */}
      <Text variant="footnote" className="mx-1 mt-6">
        {t('draftsKeep')}
      </Text>
    </ScrollView>
  );
}

export function DraftCard({ draft }: { draft: JournalEntry }) {
  const { t } = useTranslation('journal');
  const router = useRouter();
  const repositories = useRepositories();
  const dayLabel = useDayLabel();

  const discard = useJournalStore((state) => state.discard);
  const [confirming, setConfirming] = useState(false);

  const snippet = draft.situation.trim();

  if (confirming) {
    return (
      <View
        className="border border-dashed border-border-draft bg-surface-draft px-[22px] pb-6 pt-[22px]"
        style={{ borderRadius: radius.xl }}
      >
        <Text variant="bodySm" className="text-[18px] leading-[26px]">
          {t('discardTitle')}
        </Text>
        {/* What actually happens, in one sentence, with no warning tone and
            no second "are you sure". Nothing in Calma is ever an error. */}
        <Text variant="footnote" className="mt-1.5">
          {t('discardBody')}
        </Text>

        {/* Equal weight, equal size, equal timing -- keeping it is not the
            bigger button and discarding is not the scary one. */}
        <View className="mt-4 flex-row gap-3">
          <Button
            variant="secondary"
            className="h-14 flex-1"
            label={t('discardNo')}
            onPress={() => setConfirming(false)}
          />
          <Button
            variant="secondary"
            className="h-14 flex-1"
            label={t('discardYes')}
            onPress={() => {
              setConfirming(false);
              void discard(repositories.journal, draft.id);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={snippet.length > 0 ? snippet : t('untitled')}
      // VoiceOver cannot long-press, so the same action is published as a
      // custom action. A control that only exists as a gesture does not exist
      // for everyone (the same reasoning as f7's release control).
      accessibilityActions={[{ name: 'discard', label: t('discard') }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'discard') setConfirming(true);
      }}
      onPress={() => router.push(`/journal/${draft.id}`)}
      onLongPress={() => setConfirming(true)}
      className="border border-dashed border-border-draft bg-surface-draft px-[22px] pb-6 pt-[22px] active:opacity-80"
      style={{ borderRadius: radius.xl }}
    >
      <Text variant="bodySm" className="text-[18px] leading-[26px]">
        {dayLabel(draft.updatedAt)}
      </Text>

      {/* Serif and muted: their words, quoted back quietly. An empty draft
          still gets a card -- "you started something here" is the point. */}
      <Text variant="headingSm" className="mt-1.5 text-[22px] leading-[31px] text-muted">
        {snippet.length > 0 ? snippet : t('untitled')}
      </Text>
    </Pressable>
  );
}
