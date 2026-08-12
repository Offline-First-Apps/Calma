import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * Pre-session distress, 0-10.
 *
 * THERE IS NO NUMBER ON THIS SCREEN. Not on the track, not on the thumb, not
 * as a live readout. The designer's note on D2 is explicit: "the value is a
 * position, not a score". A number invites comparison -- with yesterday, with
 * a threshold, with what you think you should be feeling -- and none of those
 * comparisons help someone who is about to breathe. The value is still stored
 * as 0-10, because the Progress tab needs to average something; it is simply
 * never shown back.
 *
 * AMBER INTO CLAY, NEVER GREEN INTO RED. There is no traffic light here and
 * no error colour anywhere in the app. "Overwhelming" is not a failing grade;
 * it is a Tuesday.
 *
 * IT IS NEVER SHOWN ON THE PANIC PATH. Someone who has just hit the panic
 * button is not going to rate their distress on a scale first, and asking
 * would be its own small cruelty. The panic route does not mount this
 * component at all -- `SessionScreen` starts at the `breathing` stage when
 * its `panic` prop is set, so there is no code path that reaches here.
 *
 * A SKIPPED RATING IS `null`, NEVER 0 (D-007). Averaging "I'd rather not say"
 * as "perfectly calm" would quietly flatter every statistic in the app.
 */

const STEPS = 10;
const TRACK_HEIGHT = 18;
const THUMB = 40;

export interface SudsSliderProps {
  /** Called with 0-10, or `null` if skipped. */
  onSubmit: (value: number | null) => void;
  initial?: number;
}

export function SudsSlider({ onSubmit, initial = 5 }: SudsSliderProps) {
  const { t } = useTranslation(['breathing', 'common']);

  const [width, setWidth] = useState(0);
  const [value, setValue] = useState(initial);

  // Position runs 0..1 and is the thing the thumb actually follows. The
  // integer step is derived from it, so the thumb never lags the finger by a
  // rounding error while dragging.
  const position = useSharedValue(initial / STEPS);

  const commit = (next: number) => setValue(next);

  const pan = Gesture.Pan()
    .onBegin((event) => {
      if (width <= 0) return;
      const p = Math.min(1, Math.max(0, event.x / width));
      position.value = p;
      runOnJS(commit)(Math.round(p * STEPS));
    })
    .onUpdate((event) => {
      if (width <= 0) return;
      const p = Math.min(1, Math.max(0, event.x / width));
      position.value = p;
      runOnJS(commit)(Math.round(p * STEPS));
    });

  // A tap anywhere on the track moves the thumb there. Requiring a drag from
  // a 40px circle is a fine-motor task, and hands shake.
  const tap = Gesture.Tap().onEnd((event) => {
    if (width <= 0) return;
    const p = Math.min(1, Math.max(0, event.x / width));
    position.value = p;
    runOnJS(commit)(Math.round(p * STEPS));
  });

  const thumbStyle = useAnimatedStyle(() => ({
    left: position.value * Math.max(0, width - THUMB),
  }));

  return (
    <View className="flex-1">
      <Text variant="heading">{t('breathing:suds.pre.prompt')}</Text>

      <View className="flex-1 justify-center gap-7 pb-10">
        <GestureDetector gesture={Gesture.Simultaneous(pan, tap)}>
          {/* Generous vertical padding: the touch target is the whole band,
              not the 18px stripe it looks like. */}
          <View
            className="justify-center py-4"
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={t('breathing:suds.pre.prompt')}
            // The screen reader gets the two anchor words rather than a
            // number, for the same reason the screen does.
            accessibilityValue={{
              min: 0,
              max: STEPS,
              now: value,
              text: value <= STEPS / 2 ? t('breathing:suds.pre.low') : t('breathing:suds.pre.high'),
            }}
            accessibilityActions={[
              { name: 'increment', label: t('breathing:suds.pre.high') },
              { name: 'decrement', label: t('breathing:suds.pre.low') },
            ]}
            onAccessibilityAction={(event) => {
              const next =
                event.nativeEvent.actionName === 'increment'
                  ? Math.min(STEPS, value + 1)
                  : Math.max(0, value - 1);
              setValue(next);
              position.value = next / STEPS;
            }}
          >
            <View style={{ height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, overflow: 'hidden' }}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="sudsTrack" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0%" stopColor="#EFC98F" />
                    <Stop offset="46%" stopColor="#E39A45" />
                    <Stop offset="76%" stopColor="#C98159" />
                    <Stop offset="100%" stopColor="#BE7458" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#sudsTrack)" />
              </Svg>
            </View>

            <Animated.View
              style={[
                {
                  position: 'absolute',
                  width: THUMB,
                  height: THUMB,
                  borderRadius: THUMB / 2,
                  borderWidth: 3,
                },
                thumbStyle,
              ]}
              // The ring is its own token, not the nearest one. It is a step
              // between `accent` and `accent-pressed`; reach for either and
              // the thumb reads flat against the track it sits on.
              className="bg-background border-accent-ring"
            />
          </View>
        </GestureDetector>

        <View className="flex-row justify-between gap-4">
          <Text variant="callout">{t('breathing:suds.pre.low')}</Text>
          <Text variant="callout">{t('breathing:suds.pre.high')}</Text>
        </View>
      </View>

      <View className="gap-1">
        <Button label={t('common:continue')} onPress={() => onSubmit(value)} />
        {/*
          Skip is a full-size, full-weight target sitting directly under the
          primary action -- not greyed, not smaller, not delayed. Declining to
          rate your own distress must cost exactly nothing.
        */}
        <Button
          variant="quiet"
          label={t('breathing:suds.pre.skip')}
          onPress={() => onSubmit(null)}
        />
      </View>
    </View>
  );
}
