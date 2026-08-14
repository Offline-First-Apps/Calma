import type { JournalEntry } from '@calma/domain';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { weekKey } from '@calma/domain';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useRepositories } from '@/src/lib/repositories';
import { PlusPrompt } from '@/src/features/entitlement/PlusPrompt';
import { useTier } from '@/src/features/entitlement/store';
import { Button } from '@/src/ui/Button';
import { EmptyPage } from '@/src/features/states/EmptyPage';
import { Text } from '@/src/ui/Text';

import { useDayLabel } from './dayLabel';
import { currentWeekOnly, groupByDay, previewOf } from './entries';

/**
 * The archive (g6).
 *
 * EVERY CARD IS THE SAME COLOUR.
 *
 * g6's caption, and it is a rule rather than a preference: "intensity is
 * never encoded as colour, so a bad week can't become a heat map". There is
 * no SUDS tint, no severity band, no calendar-style density. Someone reading
 * back through a hard month must not be shown a picture of how hard it was.
 * A draft differs by a dashed edge and nothing else, exactly as on g0.
 *
 * NOTHING IS SURFACED UNPROMPTED.
 *
 * No "on this day", no anniversaries, no resurfacing of an old entry. The
 * only thing that brings a piece of writing back is someone going to look for
 * it, which is why search (g7) exists and a memories feature does not.
 *
 * THIRTY DAYS AT A TIME.
 *
 * T11. `listPaged` walks the day index backwards, so an archive of five years
 * costs the same to open as an archive of five days -- and "Show more" is a
 * plain button rather than an infinite scroll, because a list that keeps
 * producing more of your worst nights as you scroll is not something to hand
 * someone at 3am.
 */
const PAGE_DAYS = 30;

export function EntryList() {
  const { t } = useTranslation('journal');
  const { t: tCommon } = useTranslation('common');
  const { t: tEntitlement } = useTranslation('entitlement');
  const repositories = useRepositories();
  const dayLabel = useDayLabel();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const tier = useTier();

  const loadMore = useCallback(
    async (before?: string) => {
      const page = await repositories.journal.listPaged({
        ...(before === undefined ? {} : { before }),
        days: PAGE_DAYS,
      });

      setEntries((current) =>
        before === undefined ? page.entries : [...current, ...page.entries],
      );
      setCursor(page.cursor);
      setLoaded(true);
    },
    [repositories.journal],
  );

  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  /*
   * The empty sentence appears only once the first page has actually come
   * back. Until session 13 the Write tab showed it unconditionally, so an
   * archive with entries in it said "Nothing written yet" -- a screen telling
   * someone their writing does not exist. Rendering nothing while loading is
   * the honest state; a spinner over an archive is not.
   */
  if (!loaded) return null;

  /*
   * T10 — "Journal history & search: Current week only" on free.
   *
   * The split happens HERE, on entries already fetched, and `currentWeekOnly`
   * hands back a count rather than the older entries themselves. That is
   * deliberate: there is no variable in this component holding text that must
   * not be drawn, so no later edit can accidentally render it blurred or
   * greyed behind a lock. T10 rules out the fake-blur pattern by name.
   *
   * The paging button goes with them. "Show more" that reveals a prompt
   * instead of writing is a button that lies about what it does.
   */
  const week = weekKey(new Date());
  const gated = tier === 'free' ? currentWeekOnly(entries, week) : null;
  const visible = gated === null ? entries : gated.visible;

  /*
   * k1 — the empty state, and it is a screen rather than a sentence.
   *
   * This used to be one line of callout text. The design draws a page mark and
   * two sentences, and the second one is the one that matters: "Some people
   * write every night, some never do." A bare "Nothing written yet" states the
   * absence without the permission, which is the whole difference between an
   * empty state and a reproach.
   */
  if (visible.length === 0 && (gated === null || gated.older === 0)) {
    return (
      <View className="mt-3 py-10">
        <EmptyPage title={tCommon('empty.title')} body={tCommon('empty.body')} />
      </View>
    );
  }

  return (
    <View className="mt-3 gap-5">
      {groupByDay(visible).map((day) => (
        <View key={day.key} className="gap-3">
          {/* The mono label from the designs, in the sans caption variant --
              Calma ships two typefaces and a third would be a third voice
              (D-017). Same substitution as g0's section labels. */}
          <Text variant="caption" className="uppercase tracking-[1.44px] text-faint">
            {dayLabel(day.entries[0]!.createdAt)}
          </Text>

          {day.entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </View>
      ))}

      {/*
        `older` counts what this PAGE held; `cursor` says more pages exist.
        Either means there is writing beyond this week — and no number is
        printed, because `listPaged` returns a page and a count taken from it
        would undercount someone's own archive. "Still here, and stays here"
        is the part that actually needed saying.
      */}
      {gated !== null && (gated.older > 0 || cursor !== null) ? (
        <PlusPrompt message={tEntitlement('plus.olderEntries')} />
      ) : null}

      {gated === null && cursor !== null ? (
        <Button
          variant="secondary"
          className="h-14 self-start px-6"
          label={t('showMore')}
          onPress={() => void loadMore(cursor)}
        />
      ) : null}
    </View>
  );
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  const { t } = useTranslation('journal');
  const router = useRouter();

  const preview = previewOf(entry);
  const label = preview.length > 0 ? preview : t('untitledEntry');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(`/journal/${entry.id}`)}
      className={
        entry.isDraft
          ? 'border border-dashed border-border-draft bg-surface-draft p-[22px] active:opacity-80'
          : 'border border-border-strong bg-surface-tertiary p-[22px] active:opacity-80'
      }
      style={{ borderRadius: radius.xl }}
    >
      <Text variant="headingSm" className="text-[23px] leading-[33px]">
        {label}
      </Text>
    </Pressable>
  );
}
