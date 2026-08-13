import { amber } from '@calma/tokens';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useUniwind } from 'uniwind';

import { Text } from '@/src/ui/Text';

/**
 * "Saved. That's yours." (g4)
 *
 * g4's caption: "Closing a notebook: two short sentences, a warm rule where
 * the page edge would be, and nothing else. No summary, no word count, no
 * analysis, no share, no suggestion to come back tomorrow."
 *
 * So this component has no data in it. It cannot say how long the entry was,
 * how many that makes this week, or whether the intensity went down --
 * because the moment after writing something hard is the worst possible
 * moment to be handed a statistic about it. "That's yours" is the whole
 * message: the app took it, and it is not going to do anything with it.
 *
 * IT LEAVES ON ITS OWN, AND IT CAN ALWAYS BE LEFT EARLY.
 *
 * A confirmation with a "Done" button would make closing a notebook into one
 * more thing to dismiss. A confirmation with only a timer would be a screen
 * someone is stuck in if the timer ever fails to fire. It has both: the
 * timeout is the normal path, and the whole screen is a target so nobody
 * waits on it.
 */
const HOLD_MS = 1600;

export function SaveConfirmation({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation('journal');

  useEffect(() => {
    const timer = setTimeout(onDone, HOLD_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('saved')}
      onPress={onDone}
      className="flex-1 items-center justify-center gap-[30px] bg-saved px-8 py-10"
    >
      <PageEdge />

      <Text variant="display" className="text-center text-[40px] leading-[48px]">
        {t('saved')}
      </Text>
    </Pressable>
  );
}

/**
 * The warm rule where the page edge would be.
 *
 * Amber fading to nothing at both ends rather than a hairline: a ruled line
 * would read as a divider between two things, and there is only one thing on
 * this screen. Drawn in svg for the same reason `Button` is -- amber in
 * Calma is always light rather than paint, and a flat 8px bar of `--accent`
 * across the middle of a screen reads as a status indicator.
 */
function PageEdge() {
  const { theme } = useUniwind();
  const base = theme === 'dark' ? amber.dark.base : amber.light.base;
  // The designs drop the mid-stop from 0.55 to 0.5 in dark, alongside the
  // dimmer base. The 2am rule, applied twice.
  const peak = theme === 'dark' ? 0.5 : 0.55;

  return (
    <View style={{ width: 132, height: 8 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="savedEdge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={base} stopOpacity={0} />
            <Stop offset="50%" stopColor={base} stopOpacity={peak} />
            <Stop offset="100%" stopColor={base} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx={4} ry={4} fill="url(#savedEdge)" />
      </Svg>
    </View>
  );
}
