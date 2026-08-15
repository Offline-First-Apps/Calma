import { clay, control, radius } from '@calma/tokens';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import { usePaywallHold } from '@/src/features/entitlement/gateStore';
import { playSound } from '@/src/lib/audio';
import { hapticWorryCaptured } from '@/src/lib/haptics';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

import { ClayFill } from './ClayFill';
import { Ripple } from './Ripple';

/**
 * Quick capture.
 *
 * THE FIELD IS NEVER BLOCKED. THIS IS THE ONE REQUIREMENT THAT MATTERS.
 *
 * A spiral produces several worries in a row — three seconds apart, not
 * thirty (`plans/19-review-findings.md` R1, R5). So the confirmation is
 * decoration over a live field, never a state the field passes through: the
 * text is cleared and focus is kept on the same tick as the submit, and the
 * dissolve, the pebble and the sentence all play *afterwards*, over an input
 * that is already accepting the next worry.
 *
 * Concretely, the order inside `submit` is: read the text, clear the input,
 * write to storage, then start the animation. If the animation ever moves
 * ahead of the clear, this becomes a form with a 900ms wait in it, and by the
 * fourth worry a confirmation that was lovely once is a wall.
 *
 * WHAT IS DELIBERATELY NOT SHOWN.
 *
 * The submitted text is never rendered back. f3's caption: "The text is gone,
 * not echoed back... Nothing to dismiss, and the words 'saved' and 'added'
 * never appear." A worry echoed back in a confirmation has not been
 * postponed, it has been repeated.
 */

/** The dissolve. 900ms, upward, per plan 08 T03. */
const DISSOLVE_MS = 900;
/** How long the sentence stays before the field is plain again (f3). */
const CONFIRM_MS = 2600;

/**
 * Idempotency window for submit.
 *
 * A double-tap on a laggy phone is one intention. Without this, the second
 * tap lands after the clear but before the write settles and stores the same
 * worry twice — which corrupts the pending count, which is the only number
 * this feature shows anyone (T16).
 */
const SUBMIT_LOCKOUT_MS = 600;

export interface CaptureFieldProps {
  /** Resolves once the worry is on disk. Rejection is swallowed by design. */
  onCapture: (text: string) => Promise<void>;
  /** The window time, already localised. Shown in the confirmation. */
  windowTime: string;
}

export function CaptureField({ onCapture, windowTime }: CaptureFieldProps) {
  const { t } = useTranslation('worry');
  const { theme } = useUniwind();
  const input = useRef<TextInput>(null);

  /**
   * The live text, held in a ref rather than in state.
   *
   * A controlled `value` re-renders this component on every keystroke, and
   * this component owns a Reanimated style and a sound. Someone typing fast
   * at 2am does not need a render per character. The input is uncontrolled;
   * `clear()` is what empties it.
   */
  const text = useRef('');
  const [hasText, setHasText] = useState(false);
  const [focused, setFocused] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const lastSubmit = useRef(0);

  /*
   * T12's "any text field in the app has focus", at the field that made the
   * rule necessary. Scoped to `focused` rather than to mount, because this
   * screen exists to be typed in and a hold that never lifts is a paywall
   * that never appears -- see the queue in `useLimitNotice`, which is what
   * lets the offer survive until the keyboard goes down.
   */
  usePaywallHold('field', focused);

  const dissolve = useSharedValue(0);

  const submit = useCallback(() => {
    const value = text.current.trim();
    if (value.length === 0) return;

    const now = Date.now();
    if (now - lastSubmit.current < SUBMIT_LOCKOUT_MS) return;
    lastSubmit.current = now;

    // 1. The field is free again before anything else happens.
    input.current?.clear();
    text.current = '';
    setHasText(false);

    // 2. The write. Not awaited: the confirmation is about the decision to
    //    set it down, not about a disk flush, and MMKV's write is
    //    synchronous under the promise anyway.
    void onCapture(value);

    // 3. Feedback, over a live field.
    hapticWorryCaptured();
    void playSound('worryCaptured');

    setConfirming(true);
    dissolve.value = 0;

    // One sequence, scheduled once: rise and fade in over 900ms, hold, then
    // leave. Scheduling it as a single `withSequence` rather than as three
    // timers is the same rule the breathing engine follows — if the JS thread
    // is busy the confirmation is still smooth, because the UI thread owns it
    // (systems/01-architecture.md, and the note in `useOrbAnimation`).
    dissolve.value = withSequence(
      withTiming(1, {
        duration: DISSOLVE_MS,
        easing: Easing.out(Easing.quad),
      }),
      withDelay(
        CONFIRM_MS - DISSOLVE_MS,
        withTiming(0, { duration: 260 }, (finished) => {
          'worklet';
          if (finished) runOnJS(setConfirming)(false);
        }),
      ),
    );
  }, [dissolve, onCapture]);

  /**
   * The dissolve is upward (plan 08 T03).
   *
   * NOTE ON WHAT MOVES. T03 says "the text dissolves upward over 900ms", and
   * T16 says the field must accept the next worry instantly. Both cannot be
   * literally true: the text is gone from the input on the same tick as the
   * submit, so there is no text left to dissolve.
   *
   * The resolution follows f3's caption — "a ripple settling where it was" —
   * and the design file, which shows the card holding rings and no words. So
   * the upward travel belongs to the ripple and the sentence, rising into the
   * space the text occupied. Re-rendering the worry so it could be seen
   * dissolving would put it back on screen for most of a second, which is the
   * one thing f3 forbids. Recorded in `plans/08` T03.
   */
  const dissolveStyle = useAnimatedStyle(() => ({
    opacity: dissolve.value,
    transform: [{ translateY: (1 - dissolve.value) * 14 }],
  }));

  /**
   * Focus state drives the edge, not a shadow.
   *
   * f2: 1.5px clay where f1 has 1px neutral. The keyboard is already up on
   * arrival, so this is quiet confirmation that typing lands here rather than
   * a call for attention.
   */
  const edge = focused
    ? 'border-[1.5px] border-clay-ring'
    : 'border border-border-worry';

  return (
    <View>
      <Touchable
        accessibilityRole="none"
        onPress={() => input.current?.focus()}
        className={`bg-surface-worry ${edge} px-[22px] pb-6 pt-[22px]`}
        style={{
          borderRadius: radius.note,
          // 132 at rest, 200 once someone is writing in it (f1 vs f2). The
          // field grows to meet them rather than scrolling inside itself.
          minHeight: focused || hasText ? 200 : 132,
        }}
      >
        {confirming ? (
          <Animated.View
            style={dissolveStyle}
            className="absolute inset-0 items-center justify-center"
          >
            <Ripple />
          </Animated.View>
        ) : null}

        <TextInput
          ref={input}
          // Keyboard up on arrival, no tap needed to begin (f2's caption).
          autoFocus
          multiline
          // Return submits, and the keyboard stays up for the next worry —
          // which is the whole point of T16. `submitBehavior` is the current
          // spelling; `blurOnSubmit` is the deprecated one and inverts the
          // meaning, so it is easy to get backwards.
          submitBehavior="submit"
          onSubmitEditing={submit}
          returnKeyType="done"
          scrollEnabled={false}
          allowFontScaling
          accessibilityLabel={t('captureLabel')}
          placeholder={t('captureHint')}
          placeholderTextColor={
            theme === 'dark' ? clay.dark.placeholder : clay.light.placeholder
          }
          onChangeText={(next) => {
            text.current = next;
            // One re-render at the empty/non-empty boundary, not per key.
            const nowHasText = next.trim().length > 0;
            setHasText((was) => (was === nowHasText ? was : nowHasText));
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="font-sans text-[19px] leading-[29px] text-foreground"
          style={{ textAlignVertical: 'top' }}
        />
      </Touchable>

      {/*
        The button appears only once there is something to set down.
        An always-present disabled button is a greyed-out thing to look at on
        a screen whose job is to take one sentence and let go of it.
      */}
      {hasText ? (
        <View className="mt-[18px] self-end">
          <Touchable
            accessibilityRole="button"
            accessibilityLabel={t('setDown')}
            onPress={submit}
            className="h-button-compact flex-row items-center justify-center rounded-full px-7"
          >
            <ClayFill height={control.compact} />
            <Text
              variant="control"
              className="font-sans-semibold text-[17px] leading-[23px] text-clay-on"
            >
              {t('setDown')}
            </Text>
          </Touchable>
        </View>
      ) : null}

      {confirming ? (
        <Animated.View style={dissolveStyle}>
          <Text variant="headingSm" className="mx-1 mt-[26px] text-[26px] leading-[35px]">
            {t('captured', { time: windowTime })}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
