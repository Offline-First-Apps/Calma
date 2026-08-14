import type { Streak } from '@calma/domain';
import { dark, light } from '@calma/tokens';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useUniwind } from 'uniwind';

import { Text } from '@/src/ui/Text';

import { describeStreak } from './phrasing';

/**
 * h2 and h3 — the streak, and the moment it is mentioned.
 *
 * *"Six small sage marks rather than a numeral, and no flame, no trophy, no
 * gold. The framing is self-care, not score. No longest-streak record to be
 * beaten with, no warning that it's about to break, and when there's no streak
 * this screen shows nothing at all."*
 *
 * All four of those are enforced here rather than trusted:
 *   - the marks are dots, and there is no numeral beside them;
 *   - `describeStreak` returns `null` at zero, so both exports render nothing;
 *   - `streak.longest` is never read in this file, or anywhere in the feature;
 *   - nothing anywhere computes "days until this breaks".
 */

/**
 * Beyond this the dots stop being countable at a glance and start being a
 * progress bar. A long streak keeps the sentence and loses the row — which is
 * the right way round, because by day forty the number is not the point.
 */
const MAX_MARKS = 7;

function Marks({ count }: { count: number }) {
  if (count > MAX_MARKS) return null;

  return (
    <View className="flex-row gap-2">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          className="bg-sage-mark"
          style={{ width: 12, height: 12, borderRadius: 6 }}
        />
      ))}
    </View>
  );
}

/**
 * h2 — the streak on its own.
 *
 * Two sentences, centred in the screen, with the marks above them. The serif
 * carries the count because it is a thing to be felt; the sans line under it
 * is the one doing the reassuring, and it says what the streak is *for*.
 */
export function StreakScreen({ streak }: { streak: Streak }) {
  const { t } = useTranslation('progress');
  const phrase = describeStreak(streak);

  if (!phrase) return null;

  return (
    <View className="flex-1 justify-center gap-[26px]">
      <Marks count={streak.current} />
      <Text variant="titleSm">{t(phrase.key, phrase.params)}</Text>
      <Text variant="bodySm" className="text-card-secondary">
        {t('streakSupport')}
      </Text>
    </View>
  );
}

/**
 * h3 — the streak moment, over whatever screen you were already on.
 *
 * *"Two soft glass notes and something small catching the light, in context,
 * over the screen you were already on — a second or two, then gone. Noticed,
 * not applauded: no confetti, no takeover, no share prompt, nothing blocked,
 * once a day at most."*
 *
 * It is `position: absolute` and has no backdrop, no dismiss control and no
 * `Modal`: the screen behind stays live and tappable throughout. The design
 * dims that screen to 55%, which is the only concession — and it is done by
 * the host, not here, so this component can never block anything.
 */
export function StreakMoment({ streak }: { streak: Streak }) {
  const { t } = useTranslation('progress');
  const phrase = describeStreak(streak);

  if (!phrase) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityRole="alert"
      className="absolute bottom-[62px] left-[34px] right-[34px] flex-row items-center gap-4 rounded-[26px] border border-border-streak-note bg-surface-streak-note px-6 py-[22px]"
    >
      <Medallion />
      <Text variant="footnote" className="flex-1 text-[18px] leading-[26px] text-plus-foreground">
        {t(`streakMoment${phrase.params?.count === 1 ? '_one' : '_other'}`, phrase.params)}
      </Text>
    </View>
  );
}

/**
 * "Something small catching the light."
 *
 * A radial, offset toward the upper left, so it reads as a lit sphere rather
 * than a filled circle. It is the only ornament in the whole feature, and it
 * is sage rather than amber on purpose: amber is the app's light source and
 * reserved for the one obvious action on a screen. Nothing here is an action.
 */
function Medallion() {
  // react-native-svg takes gradient stops as props, not as classes, so these
  // two have to come from the token module rather than from Tailwind. Reading
  // the theme is what keeps that from silently becoming a light-mode-only
  // colour -- the mistake `colors.ts` documents three separate times.
  const { theme } = useUniwind();
  const { sageMarkCore, sageMarkEdge } = theme === 'dark' ? dark : light;

  return (
    <View style={{ width: 34, height: 34 }}>
      <Svg width={34} height={34}>
        <Defs>
          <RadialGradient id="streakMark" cx="44%" cy="38%" r="72%">
            <Stop offset="0%" stopColor={sageMarkCore} />
            <Stop offset="72%" stopColor={sageMarkEdge} />
          </RadialGradient>
        </Defs>
        <Circle cx={17} cy={17} r={17} fill="url(#streakMark)" />
      </Svg>
    </View>
  );
}
