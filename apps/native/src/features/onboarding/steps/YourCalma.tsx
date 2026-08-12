import {
  type OnboardingAnswers,
  leadToolFor,
  shouldNamePanicButton,
  windowWasGuessed,
  worryWindowFor,
} from '@calma/domain';
import { formatTimeOfDay } from '@calma/i18n';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useReduceMotion } from '@/src/lib/motion';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Text } from '@/src/ui/Text';

/**
 * B9 — Here's your Calma.
 * `designs/extracted/b9-here-s-your-calma-{light,dark}.html`.
 *
 * THE SCREEN THAT MAKES THE THREE QUESTIONS HONEST.
 *
 * Personalisation that changes nothing is extraction. Someone typed their
 * reasons into a phone at 2am; this screen owes them a specific, mechanical
 * answer to "and what did that do?". Each card names one consequence of one
 * answer, in a sentence that would be false if the mapping were not real.
 *
 * WHAT THIS SCREEN IS FORBIDDEN FROM SAYING:
 *   - "We've personalised your experience." A sentence with no content, which
 *     is how a product says nothing happened.
 *   - Anything about outcomes. Not "you'll feel calmer", not "this will
 *     help", not a number, not a timeframe. Calma does not claim to treat,
 *     cure, or reduce anything as a medical matter, and this is the screen
 *     where that temptation is strongest.
 *   - Anything countable about the person. No score, no profile, no summary
 *     of what their answers "suggest".
 *
 * A FULLY-SKIPPED FLOW GETS AN HONEST VERSION, NOT AN INVENTED ONE. The
 * designer's note is explicit: "if every question were skipped, this screen
 * shows one honest sentence instead of three invented ones." So the cards are
 * conditional on the answers actually given, and someone who told us nothing
 * is told that nothing was assumed — which is itself worth knowing, and is
 * true.
 *
 * WARMEST GROUND IN ONBOARDING. `bg-lift`, set by the flow. This is the one
 * screen where the app is saying something back rather than asking.
 */
export function YourCalma({
  answers,
  onContinue,
}: {
  answers: OnboardingAnswers;
  onContinue: () => void;
}) {
  const { t, i18n } = useTranslation(['onboarding', 'common']);
  const reduceMotion = useReduceMotion();

  const window = formatTimeOfDay(worryWindowFor(answers.when), i18n.language);
  const guessed = windowWasGuessed(answers.when);
  const answeredNothing =
    answers.why.length === 0 && answers.when.length === 0 && answers.helped.length === 0;

  const lines: string[] = [];

  if (answeredNothing) {
    // One honest sentence. Not three invented ones.
    lines.push(t('onboarding:reveal.privacy'));
  } else {
    lines.push(
      // Saying "your window is set for 19:00" to someone whose answer was
      // "it's hard to say" would be a small lie on a screen whose whole job
      // is to be specific.
      guessed
        ? t('onboarding:reveal.windowUnsure', { time: window })
        : t('onboarding:reveal.window', { time: window }),
    );

    if (shouldNamePanicButton(answers)) lines.push(t('onboarding:reveal.panic'));

    lines.push(
      t(
        {
          sigh: 'onboarding:reveal.leadSigh',
          breathing: 'onboarding:reveal.leadBreathing',
          journal: 'onboarding:reveal.leadJournal',
        }[leadToolFor(answers)],
      ),
    );
  }

  return (
    <View className="flex-1">
      <View className="mt-[22px] flex-row items-center gap-[18px]">
        {/* 64px. The orb appears at every size in this app; here it is small
            enough to sit beside a sentence rather than be one. */}
        <Orb size={64} reduceMotion={reduceMotion} />
        <Text variant="titleSm" className="shrink">
          {t('onboarding:reveal.title')}
        </Text>
      </View>

      <View className="mt-7 gap-[14px]">
        {lines.map((line) => (
          <View
            key={line}
            className="rounded-sheet border border-border-lift bg-surface-lift px-[22px] pb-6 pt-[22px]"
          >
            <Text variant="bodySm">{line}</Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      {/* No Skip. This screen asks for nothing, so there is nothing to skip. */}
      <Button label={t('common:continue')} onPress={onContinue} />
    </View>
  );
}
