import Ionicons from '@expo/vector-icons/Ionicons';
import {
  MAX_CYCLE_SECONDS,
  MAX_PHASE_SECONDS,
  MIN_PHASE_SECONDS,
  customRatioProblem,
  type CustomRatio,
} from '@calma/domain';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlusPrompt } from '@/src/features/entitlement/PlusPrompt';
import { mayUseCustomRatio } from '@/src/features/entitlement/paywallGate';
import { useEntitlementStore, useTier } from '@/src/features/entitlement/store';
import { useReduceMotion } from '@/src/lib/motion';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Orb } from '@/src/ui/Orb';
import { Text } from '@/src/ui/Text';

/**
 * The rhythm builder (d7).
 *
 * "THE ONE SCREEN ALLOWED TO FEEL LIKE AN INSTRUMENT."
 *
 * d7's caption, and the reason the numbers are legible here when they are
 * hidden everywhere else: a person on this screen is deliberately setting
 * something, not trying to follow it. During a session a visible number is a
 * countdown and a countdown turns a breath into a wait. Here it is the value
 * being edited, which is the opposite.
 *
 * IT CANNOT BE OPENED DURING A SESSION.
 *
 * The ratio is read once when a session is built (`getPattern`), and a
 * timeline is scheduled whole. Changing the numbers mid-session would either
 * do nothing -- worse, because it looks like it did something -- or restart
 * the breath under someone. So this is a screen you leave before you breathe,
 * which is also why it has a "Use this one" rather than a "Save".
 *
 * STEPPERS, NOT A SLIDER.
 *
 * Whole seconds only, and every value reachable by an exact number of taps. A
 * slider makes 4 seconds a thing to hunt for with a thumb, and the whole
 * point of a custom rhythm is that someone already knows the numbers they
 * want.
 *
 * BOUNDS COME FROM `@calma/domain`, NOT FROM HERE.
 *
 * `customRatioProblem` is the same validation the timeline builder uses, so a
 * ratio this screen accepts can never be one the engine rejects. Out-of-range
 * is prevented by the steppers rather than reported afterwards: the plus
 * simply stops adding, with a plain sentence about why, and there is no error
 * state and nothing turns red.
 */

/** Order matters: it is the order of a breath. */
const PHASES = [
  { index: 0, label: 'phase.inhale' },
  { index: 1, label: 'phase.holdFull' },
  { index: 2, label: 'phase.exhale' },
  { index: 3, label: 'phase.holdEmpty' },
] as const;

const DEFAULT_RATIO: CustomRatio = [4, 7, 8, 2];

export function CustomRatioScreen() {
  const { t } = useTranslation(['breathing', 'entitlement']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const repositories = useRepositories();

  const stored = usePrefsStore((state) => state.prefs.customRatio);
  const update = usePrefsStore((state) => state.update);

  const tier = useTier();
  const suppressed = useEntitlementStore((state) => state.suppressed);
  const mayUse = mayUseCustomRatio(tier, suppressed);

  const [ratio, setRatio] = useState<CustomRatio>(stored ?? DEFAULT_RATIO);
  /** Revealed by pressing "Use this one" on free. Never shown on arrival. */
  const [offered, setOffered] = useState(false);

  const problem = customRatioProblem(ratio);

  function step(index: number, delta: number) {
    const next = [...ratio] as CustomRatio;
    const value = next[index]! + delta;

    // A phase floor of 1 rather than 0: an absent hold is omitted from a
    // preset, never stored as zero, and a zero-length phase here would be a
    // fourth row that does nothing.
    if (value < MIN_PHASE_SECONDS || value > MAX_PHASE_SECONDS) return;

    next[index] = value;
    if (delta > 0 && customRatioProblem(next) === 'cycle-too-long') return;

    setRatio(next);
  }

  async function use() {
    if (problem !== null) return;

    /*
     * The gate, and the reason it is here rather than on the row that opens
     * this screen.
     *
     * A padlock on d1's custom card would turn a menu into a shop, and
     * arriving at a locked screen teaches someone the app has rooms they are
     * not allowed in. So the whole screen works, the numbers move, and the
     * offer is made once at the moment it is actually relevant -- when
     * somebody has decided on a rhythm and wants to keep it.
     *
     * Inline, never a sheet: `PaywallSheet` opens with a sound and a haptic
     * and is for a limit that has been REACHED. Nothing ran out here.
     */
    if (!mayUse) {
      setOffered(true);
      return;
    }

    await update(repositories.prefs, {
      customRatio: ratio,
      // Choosing a rhythm here is choosing it, full stop. Saving a ratio and
      // then making someone go to Settings to actually use it would be two
      // steps for one decision.
      defaultPattern: 'custom',
    });
    router.back();
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 32,
        paddingBottom: Math.max(insets.bottom, 16) + 24,
        flexGrow: 1,
      }}
    >
      <Text variant="heading">{t('custom.title')}</Text>

      {/*
        The orb is here as a preview, and it is honest about being one: it
        runs its own ambient loop rather than the ratio being edited. Driving
        it from the live numbers would restart the animation on every tap,
        which is the one thing an orb must never do -- see D-004 and the note
        in useOrbAnimation. The caption promises it follows; matching that
        exactly is a session-06 job and is flagged in plans/11 T11.
      */}
      <View className="mt-[22px] self-center">
        <Orb size={176} reduceMotion={reduceMotion} />
      </View>

      <Text variant="footnote" className="mt-[18px] text-center">
        {t('custom.follows')}
      </Text>

      <View className="mt-5 gap-2.5">
        {PHASES.map((phase) => (
          <View
            key={phase.label}
            className="h-[68px] flex-row items-center justify-between border border-field-border bg-field-background pl-5 pr-3"
            style={{ borderRadius: radius.option }}
          >
            <Text variant="bodySm" className="text-[18px] leading-[25px]">
              {t(phase.label)}
            </Text>

            <View className="flex-row items-center gap-3">
              {/* Serif, and the only bare numeral in the breathing feature. */}
              <Text
                variant="headingSm"
                className="min-w-[26px] text-center text-[24px] leading-[30px]"
              >
                {ratio[phase.index]}
              </Text>

              <Stepper
                icon="remove"
                label={t('custom.less')}
                onPress={() => step(phase.index, -1)}
              />
              <Stepper
                icon="add"
                label={t('custom.more')}
                onPress={() => step(phase.index, 1)}
              />
            </View>
          </View>
        ))}
      </View>

      {/*
        The one thing this screen ever says back. Not an error and not shown
        beside a field: a sentence about how the rhythm will feel, in the same
        ink as everything else.
      */}
      {problem === 'cycle-too-short' ? (
        <Text variant="footnote" className="mt-4 text-center">
          {t('custom.tooShort')}
        </Text>
      ) : problem === 'cycle-too-long' ? (
        <Text variant="footnote" className="mt-4 text-center">
          {t('custom.tooLong')}
        </Text>
      ) : null}

      {offered ? <PlusPrompt message={t('entitlement:paywall.customRatio')} /> : null}

      <View className="flex-1" />

      <Button
        className="mt-8"
        label={t('custom.use')}
        onPress={() => void use()}
        disabled={problem !== null}
      />
    </ScrollView>
  );
}

/**
 * 46px, which is `control.pill` -- the most repeated dimension in the design
 * set and comfortably above the 48px minimum target once its row padding is
 * counted. The glyph is `stepper-glyph` rather than the text colour: a
 * full-strength minus at this size reads as a delete control.
 */
function Stepper({
  icon,
  label,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="h-[46px] w-[46px] items-center justify-center bg-surface-stepper active:opacity-80"
      style={{ borderRadius: 14 }}
    >
      <Ionicons name={icon} size={18} color="#7A6552" />
    </Pressable>
  );
}

export { MAX_CYCLE_SECONDS };
