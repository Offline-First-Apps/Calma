import { PRESET_PATTERNS, type BreathingPatternId } from '@calma/domain';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { PANIC_FAB_CLEARANCE } from '@/src/components/PanicFab';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * The pattern picker.
 *
 * FOUR SIBLINGS, NOT A LADDER. Identical cards, identical marks, no
 * "recommended" badge, no durations, and no lock on the Plus one. The moment
 * one card is styled as the right answer, choosing becomes a small test, and
 * this screen is often reached by someone with no spare capacity for tests.
 *
 * NAMES ARE SPOKEN, NOT NUMERIC. "The sigh", not "Physiological sigh";
 * "Four, seven, eight", not "4-7-8"; "Even breathing", not "5-5-5-5". A
 * screen full of digits reads as a protocol. The second line says what each
 * one is FOR rather than what it is, because "for right now" is a decision
 * someone can make and "two breaths in, one long breath out" is homework.
 *
 * THE SIGH IS FIRST. Not the domain's preset order -- `PRESET_PATTERNS` lists
 * 4-7-8 first, which is the order the maths was written in. The picker leads
 * with the fastest-acting one, because the most likely reason someone is on
 * this screen is that they need something to work soon.
 */

/** Design order (D1), which is not the domain's order. */
const ROWS: readonly {
  id: BreathingPatternId;
  key: 'sigh' | '478' | 'box' | 'custom';
}[] = [
  { id: 'physiological-sigh', key: 'sigh' },
  { id: '4-7-8', key: '478' },
  { id: '5-5-5-5', key: 'box' },
  { id: 'custom', key: 'custom' },
];

export default function Breathe() {
  const { t } = useTranslation('breathing');
  const router = useRouter();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: PANIC_FAB_CLEARANCE }}
      >
        <Text variant="heading">{t('picker.title')}</Text>
        <Text variant="callout" className="mt-2">
          {t('picker.subtitle')}
        </Text>

        <View className="mt-6 gap-3">
          {ROWS.map((row) => {
            // Custom is present but inert until plan 11 gates it on Plus.
            // Present-and-quiet rather than hidden: someone who would value
            // it should be able to see that it exists, without being sold to.
            const inert = row.id === 'custom';

            return (
              <Pressable
                key={row.id}
                disabled={inert}
                onPress={() =>
                  router.push({
                    pathname: '/session/[pattern]',
                    params: { pattern: row.id, entryPoint: 'breathe-tab' },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${t(`patterns.${row.key}.name`)}. ${t(
                  `patterns.${row.key}.purpose`,
                )}`}
                className="flex-row items-center gap-4 rounded-sheet border border-border bg-surface px-5 py-5 active:opacity-90"
              >
                <PatternMark />
                <View className="flex-1 gap-1">
                  {/*
                    Sans, not serif. These are names to read and choose
                    between, not sentences to feel -- a serif "Even breathing"
                    reads precious (D-017).
                  */}
                  <Text variant="bodyEmphasis">{t(`patterns.${row.key}.name`)}</Text>
                  <Text variant="callout">{t(`patterns.${row.key}.purpose`)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

/**
 * The little orb on each row.
 *
 * Identical on all four, including the Plus one. Marking the locked row with
 * a padlock would turn a menu into a shop.
 */
function PatternMark() {
  return (
    <View style={{ width: 34, height: 34 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="patternMark" cx="45%" cy="38%" r="60%">
            <Stop offset="0%" stopColor="#F8DFB2" />
            <Stop offset="70%" stopColor="#E39A45" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="50%" r="50%" fill="url(#patternMark)" />
      </Svg>
    </View>
  );
}

/*
 * Adding a preset to the domain without adding a row here should be loud, not
 * a silently missing option on the one screen that lists them. Checked at
 * runtime in development rather than in the type system: `PRESET_PATTERNS` is
 * typed as `readonly BreathingPattern[]`, so its element type is the whole
 * `BreathingPatternId` union and a compile-time exhaustiveness check against
 * it would only ever be asserting that `custom` exists.
 */
if (__DEV__) {
  const listed = new Set(ROWS.map((row) => row.id));
  const missing = PRESET_PATTERNS.filter((pattern) => !listed.has(pattern.id));

  if (missing.length > 0) {
    console.warn(
      `pattern picker is missing: ${missing.map((p) => p.id).join(', ')}`,
    );
  }
}
