import { dark, light } from '@calma/tokens';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

import { useRepositories, useStorage } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Text } from '@/src/ui/Text';

import { countEverything, eraseEverything } from './erase';

/**
 * j4 — Delete everything.
 *
 * *"The destructive ones are stated once, calmly, and never dressed in red."*
 *
 * THREE THINGS THIS SHEET DOES NOT DO, each of which a normal app would:
 *   - it does not warn you about your streak, or offer to keep anything;
 *   - it does not make the destructive button the loud one. "Keep them" gets
 *     the filled surface; "Delete everything" gets the ground and a hairline.
 *     The dangerous option is never the one the eye lands on first;
 *   - it does not use red. The label is a warm burnt clay, and the weight
 *     comes from the sentence above it, not from the colour.
 *
 * It states a real count, read from the key space at the moment it opens, so
 * nobody is asked to confirm an abstraction. When there is nothing to delete
 * it says so and offers only the way out.
 */
export function DeleteSheet({
  onKeep,
  onDeleted,
}: {
  onKeep: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation('settings');
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const tokens = theme === 'dark' ? dark : light;
  const { stores } = useStorage();
  const repositories = useRepositories();
  const [busy, setBusy] = useState(false);

  // Read once, when the sheet opens. Re-counting on every render would let
  // the number move under someone mid-decision.
  const counts = useMemo(() => countEverything(stores), [stores]);
  const nothing = counts.entries === 0 && counts.worries === 0;

  async function confirm() {
    if (busy) return;
    setBusy(true);

    await eraseEverything({
      stores,
      repositories,
      resetStores: () => usePrefsStore.setState({ hydrated: false }),
    });

    onDeleted();
  }

  return (
    <View className="absolute inset-0 justify-end" style={{ zIndex: 10 }}>
      {/* The backdrop dismisses, because dismissing is the safe direction. */}
      <Pressable
        onPress={onKeep}
        accessibilityRole="button"
        accessibilityLabel={t('deleteSheet.keep')}
        style={{ flex: 1, backgroundColor: tokens.backdropSheet }}
      />

      <View
        className="rounded-t-[34px] border-t border-sheet-border bg-surface-tertiary px-7 pt-[22px]"
        style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
      >
        <View
          className="mx-auto mb-[22px] bg-sheet-grabber"
          style={{ width: 44, height: 5, borderRadius: 3 }}
        />

        <Text variant="headingSm" className="text-[28px] leading-[35px]">
          {nothing
            ? t('deleteSheet.nothing')
            : t('deleteSheet.counts', {
                entries: t('deleteSheet.entries', { count: counts.entries }),
                worries: t('deleteSheet.worries', { count: counts.worries }),
              })}
        </Text>

        {nothing ? null : (
          <Text
            variant="callout"
            className="mt-3 text-[17px] leading-[26px] text-card-secondary"
          >
            {t('deleteSheet.body')}
          </Text>
        )}

        <View className="mt-[22px] gap-2">
          <Pressable
            onPress={onKeep}
            accessibilityRole="button"
            className="h-button items-center justify-center rounded-full border border-border-ending bg-surface-ending active:opacity-80"
          >
            <Text variant="control">{t('deleteSheet.keep')}</Text>
          </Pressable>

          {nothing ? null : (
            <Pressable
              onPress={() => void confirm()}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              className="h-button items-center justify-center rounded-full border border-border-destructive bg-surface-destructive active:opacity-80"
            >
              {/* `font-sans`, not `font-sans-medium`: the destructive label is
                  the lighter of the two, which is the same argument as the
                  surface. */}
              <Text variant="control" className="font-sans text-destructive">
                {t('deleteSheet.confirm')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
