import type { WeekAggregate } from '@calma/db';
import type { Streak } from '@calma/domain';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/src/ui/Text';

import { type TileKind, TileIcon } from './TileIcon';
import {
  type Phrase,
  describeBreathing,
  describeStreak,
  describeWorries,
  describeWriting,
} from './phrasing';
import { phrase } from './phrase';

/**
 * h1's four tiles.
 *
 * A TILE WITH NOTHING TO SAY IS NOT RENDERED. Not greyed, not dashed, not
 * showing a nought — absent. `describe*` returns `null` for zero and this maps
 * over what survives, so someone who only breathes sees one tile and someone
 * who has done nothing sees the empty state instead of a 2×2 grid of noughts.
 * That grid is a list of things you have not done, and it is precisely what
 * the H-group caption means by "one decision away from becoming another thing
 * to fail at".
 *
 * The consequence is that the layout has to survive one, two, three or four
 * tiles. `flex-row flex-wrap` with a half-width basis does that; a fixed 2×2
 * grid would leave a hole.
 */

interface Tile {
  kind: TileKind;
  labelKey: string;
  phrase: Phrase;
}

export function StatTiles({
  week,
  streak,
}: {
  week: WeekAggregate;
  streak: Streak;
}) {
  const { t } = useTranslation('progress');
  const router = useRouter();

  const candidates: [TileKind, string, Phrase | null][] = [
    ['breathing', 'tiles.breathingLabel', describeBreathing(week)],
    ['worries', 'tiles.worriesLabel', describeWorries(week)],
    ['writing', 'tiles.writingLabel', describeWriting(week)],
    ['streak', 'tiles.streakLabel', describeStreak(streak)],
  ];

  const tiles: Tile[] = candidates
    .filter((entry): entry is [TileKind, string, Phrase] => entry[2] !== null)
    .map(([kind, labelKey, value]) => ({ kind, labelKey, phrase: value }));

  if (tiles.length === 0) return null;

  return (
    <View className="mt-3 flex-row flex-wrap gap-[10px]">
      {tiles.map((tile) => {
        const sage = tile.kind === 'streak';

        // The sage tile opens h2, and it is the only tile that goes anywhere.
        // A chevron would make it a list row; enlarging the thing you tapped
        // needs no affordance beyond being tappable.
        const Container = sage ? Pressable : View;

        return (
          <Container
            key={tile.kind}
            {...(sage
              ? {
                  onPress: () => router.push('/progress/streak'),
                  accessibilityRole: 'button' as const,
                }
              : {})}
            // `basis` rather than a fixed width so a wrapped German string
            // grows the tile instead of truncating inside it.
            className={`min-w-[47%] flex-1 gap-[10px] rounded-3xl border p-4 ${
              sage
                ? 'border-border-plus bg-surface-plus'
                : 'border-border-strong bg-surface-tertiary'
            }`}
          >
            <TileIcon kind={tile.kind} />
            <Text
              variant="headingSm"
              className={`text-[21px] leading-[26px] ${sage ? 'text-plus-foreground' : ''}`}
            >
              {phrase(t, tile.phrase)}
            </Text>
            {/*
              The designs set these labels in IBM Plex Mono, uppercase, with
              0.12em tracking. Calma ships two typefaces and never shouts
              (`systems/03`, and the note in `typography.ts`) — a third voice
              for a four-word label is not a trade worth making. Sans caption
              with the design's tracking, which is what sessions 11 and 13 did
              for the same labels on i1 and g0.
            */}
            <Text
              variant="caption"
              className={`text-[11px] tracking-[1.3px] ${
                sage ? 'text-plus-label' : 'text-faint'
              }`}
            >
              {t(tile.labelKey)}
            </Text>
          </Container>
        );
      })}
    </View>
  );
}
