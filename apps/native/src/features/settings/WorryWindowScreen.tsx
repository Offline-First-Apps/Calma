import Ionicons from '@expo/vector-icons/Ionicons';
import type { WorryWindowMinutes } from '@calma/domain';
import { formatWindowTime } from '@calma/i18n';
import { radius } from '@calma/tokens';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { PlusPrompt } from '@/src/features/entitlement/PlusPrompt';
import { useEntitlementStore, useTier } from '@/src/features/entitlement/store';
import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { OptionCard } from '@/src/ui/OptionCard';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

import {
  HOUR_STEP,
  MINUTE_STEP,
  WINDOW_DURATIONS,
  mayUseDuration,
  stepWindowTime,
} from './windowEdits';
import { windowRange } from './windowRange';

/**
 * Your window — plan 14 T04's picker, which the row has been pointing at
 * (and then, since session 18, not pointing at) for three sessions.
 *
 * NO DESIGN FILE, AND A KNOWING DIVERGENCE FROM THE TODO.
 *
 * The design set has j1-j4 and none of them is this screen, so the layout is
 * built from the vocabulary the app already has rather than invented: d7's
 * steppers for the time, `OptionCard` for the length.
 *
 * T04 says "set with a NATIVE picker". That would mean adding
 * `@react-native-community/datetimepicker`, which is a native module and so a
 * prebuild — and it draws a platform wheel in a platform's own type and
 * colours, in the middle of an app whose entire argument is that it does not
 * look like a platform. The steppers are already this app's answer to "set an
 * exact number", they are whole-value and reachable by an exact number of
 * taps, and they need no dependency. Recorded in `plans/14` T04.
 *
 * THE WINDOW IS SHOWN AS ONE RANGE WHILE IT IS BEING EDITED.
 *
 * Same as j1's row: "8–8:20pm", not a start plus a length. Nobody thinks of
 * their window as two numbers, and seeing the end move as the length changes
 * is the whole reason the length is on this screen rather than a row of its
 * own.
 *
 * THE TIME WRAPS AT MIDNIGHT RATHER THAN STOPPING.
 *
 * Somebody whose worst hour is 1am reaches it by pressing down from midnight.
 * A stepper that clamps would be telling them their window is not a real
 * option.
 *
 * NOTHING NEEDS TO CALL `rescheduleAll()`.
 *
 * `useReschedule` is mounted at the root with window time and duration in its
 * dependency array, so the notification schedule is rebuilt by the write
 * itself. That was the point of building it as one dependency array rather
 * than seven call sites — this screen is the seventh.
 */
export function WorryWindowScreen() {
  const { t, i18n } = useTranslation(['settings', 'entitlement']);
  const repositories = useRepositories();

  const time = usePrefsStore((state) => state.prefs.worryWindowTime);
  const minutes = usePrefsStore((state) => state.prefs.worryWindowMinutes);
  const update = usePrefsStore((state) => state.update);

  const tier = useTier();
  const suppressed = useEntitlementStore((state) => state.suppressed);

  /** Revealed by choosing a length that is not yours. Never shown on arrival. */
  const [offered, setOffered] = useState(false);

  function shift(delta: number) {
    void update(repositories.prefs, {
      worryWindowTime: stepWindowTime(time, delta),
    });
  }

  function chooseLength(next: WorryWindowMinutes) {
    if (!mayUseDuration(tier, next, suppressed)) {
      setOffered(true);
      return;
    }

    setOffered(false);
    void update(repositories.prefs, { worryWindowMinutes: next });
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('settings:rows.window')}
        </Text>

        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('settings:windowScreen.body')}
        </Text>

        {/* The value being edited, in the serif, and the only place in this
            feature a bare clock time is legible at size. */}
        <Text variant="headingSm" className="mt-7 text-center text-[30px]">
          {windowRange(time, minutes, i18n.language, formatWindowTime)}
        </Text>

        <View className="mt-6 gap-2.5">
          <StepperRow
            label={t('settings:windowScreen.hour')}
            onLess={() => shift(-HOUR_STEP)}
            onMore={() => shift(HOUR_STEP)}
            lessLabel={t('settings:windowScreen.earlier')}
            moreLabel={t('settings:windowScreen.later')}
          />
          <StepperRow
            label={t('settings:windowScreen.minutes')}
            onLess={() => shift(-MINUTE_STEP)}
            onMore={() => shift(MINUTE_STEP)}
            lessLabel={t('settings:windowScreen.earlier')}
            moreLabel={t('settings:windowScreen.later')}
          />
        </View>

        <Text variant="bodyEmphasis" className="mx-1 mt-9">
          {t('settings:worryWindowLength')}
        </Text>

        <View className="mt-[14px] gap-[10px]">
          {WINDOW_DURATIONS.map((option) => (
            <OptionCard
              key={option}
              label={t('settings:windowLength', { count: option })}
              /*
                No padlock and no "Plus" badge on the two longer ones. d1's
                caption forbids marking the paid row and the reasoning holds
                here: a list where one item wears a lock is a shop. The offer
                appears if and when somebody chooses one.
              */
              selected={option === minutes}
              onPress={() => chooseLength(option)}
            />
          ))}
        </View>

        {offered ? (
          <PlusPrompt message={t('entitlement:offer.featureWindows')} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/**
 * d7's stepper row, reused. Whole values only, every one reachable by an exact
 * number of taps, and no slider — a slider makes 8pm a thing to hunt for with
 * a thumb, and somebody setting a worry window already knows the hour.
 */
function StepperRow({
  label,
  lessLabel,
  moreLabel,
  onLess,
  onMore,
}: {
  label: string;
  lessLabel: string;
  moreLabel: string;
  onLess: () => void;
  onMore: () => void;
}) {
  return (
    <View
      className="h-[68px] flex-row items-center justify-between border border-field-border bg-field-background pl-5 pr-3"
      style={{ borderRadius: radius.option }}
    >
      <Text variant="bodySm" className="text-[18px] leading-[25px]">
        {label}
      </Text>

      <View className="flex-row items-center gap-3">
        <Stepper icon="remove" label={`${label}. ${lessLabel}`} onPress={onLess} />
        <Stepper icon="add" label={`${label}. ${moreLabel}`} onPress={onMore} />
      </View>
    </View>
  );
}

/** 46px, `control.pill`, with the muted glyph d7 uses. */
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
