import Ionicons from '@expo/vector-icons/Ionicons';
import type { JournalEntry } from '@calma/domain';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { weekKey } from '@calma/domain';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRepositories } from '@/src/lib/repositories';
import { PlusPrompt } from '@/src/features/entitlement/PlusPrompt';
import { useTier } from '@/src/features/entitlement/store';
import { Text } from '@/src/ui/Text';

import { useDayLabel } from './dayLabel';
import { currentWeekOnly, previewOf, splitOnMatch } from './entries';

/**
 * Search your writing (g7).
 *
 * WHY THIS IS A LINEAR SCAN AND NOT AN INDEX.
 *
 * `JournalRepo.search` reads every record and filters in memory. That is a
 * deliberate privacy decision rather than a shortcut
 * (systems/02-data-layer.md): an inverted index of someone's journal is a
 * second copy of the most sensitive text on the device, stored in a shape
 * that makes it easy to read out of order. A few hundred short records scan
 * in well under the 100ms T14 asks for, and the moment that stops being true
 * the answer is pagination, not a shadow copy.
 *
 * DEBOUNCED, AND THE FIELD IS NEVER BLOCKED.
 *
 * The scan runs 220ms after the last keystroke and its result is dropped if a
 * newer query has started -- so a slow scan can never overwrite the results
 * of a later, faster one. Typing is never gated on a scan finishing.
 *
 * THE MATCH IS HIGHLIGHTED, NOT COUNTED.
 *
 * No relevance score, no "best match", no ordering by how often the word
 * appears. Newest first, always. Ranking someone's own diary by how much it
 * is "about" a word would be the app forming an opinion about their year.
 */
const DEBOUNCE_MS = 220;

export function SearchScreen() {
  const { t } = useTranslation('journal');
  const { t: tEntitlement } = useTranslation('entitlement');
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();
  const dayLabel = useDayLabel();
  const router = useRouter();

  const tier = useTier();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JournalEntry[] | null>(null);
  /** Monotonic, so a stale scan cannot land on top of a fresh one. */
  const generation = useRef(0);

  useEffect(() => {
    const needle = query.trim();
    const mine = (generation.current += 1);

    if (needle.length === 0) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => {
      void repositories.journal.search(needle).then((found) => {
        if (generation.current !== mine) return;

        /*
         * T10 — "Journal history & search: Current week only" on free.
         *
         * The FIELD IS NEVER DISABLED and the scan still runs; what narrows is
         * the scope. Free gets a real search over this week, which is a
         * working feature rather than a demonstration of one, and the prompt
         * below says plainly what was and was not looked at.
         *
         * Older matches are dropped here and never enter state, so there is no
         * array of somebody's private writing sitting in this component
         * waiting to be rendered blurred behind a lock (T10).
         */
        setResults(
          tier === 'free' ? currentWeekOnly(found, weekKey(new Date())).visible : found,
        );
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, repositories.journal, tier]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 52,
        paddingHorizontal: 26,
        paddingBottom: Math.max(insets.bottom, 16) + 32,
      }}
    >
      <View
        className="h-[52px] flex-row items-center gap-3 border border-field-border bg-field-background px-[18px]"
        style={{ borderRadius: radius.note }}
      >
        <Ionicons name="search-outline" size={17} color="#8A939C" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          allowFontScaling
          accessibilityLabel={t('search')}
          placeholder={t('search')}
          className="flex-1 font-sans text-[17px] text-foreground"
        />
      </View>

      {/* Always visible once searching, including when this week had no
          match — "nothing here" and "nothing here that I looked at" are
          different sentences, and only one of them is true on free. */}
      {tier === 'free' && results !== null ? (
        <PlusPrompt message={tEntitlement('plus.searchScope')} />
      ) : null}

      {results === null ? (
        <Text variant="callout" className="mx-1 mt-[18px]">
          {t('searchStart')}
        </Text>
      ) : results.length === 0 ? (
        // Not an error, not an empty-state illustration, and never "no
        // results found". The app failing to find a word is not a failure of
        // the person who typed it.
        <Text variant="callout" className="mx-1 mt-[18px]">
          {t('searchNone')}
        </Text>
      ) : (
        <>
          <Text
            variant="caption"
            className="mx-1 mb-3 mt-[18px] text-[11px] uppercase tracking-[1.54px] text-faint"
          >
            {t('entries', { count: results.length })}
          </Text>

          <View className="gap-3">
            {results.map((entry) => (
              <Pressable
                key={entry.id}
                accessibilityRole="button"
                accessibilityLabel={previewOf(entry) || t('untitledEntry')}
                onPress={() => router.push(`/journal/${entry.id}`)}
                className="border border-border-strong bg-surface-tertiary p-5 active:opacity-80"
                style={{ borderRadius: radius.xl }}
              >
                <Text
                  variant="caption"
                  className="mb-2 text-[11px] uppercase tracking-[1.32px] text-faint"
                >
                  {dayLabel(entry.createdAt)}
                </Text>
                <Highlighted
                  text={previewOf(entry) || t('untitledEntry')}
                  needle={query.trim()}
                />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Highlighted({ text, needle }: { text: string; needle: string }) {
  const parts = splitOnMatch(text, needle);

  return (
    <Text variant="headingSm" className="text-[21px] leading-[30px]">
      {parts.map((part, index) =>
        // Odd indices are the matches. A wash at highlighter weight, never
        // `--accent` itself: full-strength amber across body text reads as an
        // alert, and nothing in Calma alerts.
        index % 2 === 1 ? (
          <Text
            key={`${index}-${part}`}
            variant="headingSm"
            className="bg-highlight text-[21px] leading-[30px]"
          >
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}
