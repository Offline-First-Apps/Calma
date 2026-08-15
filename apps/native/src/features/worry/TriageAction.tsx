import { radius, sage } from '@calma/tokens';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

/**
 * The action step (f6).
 *
 * AN EMPTY ANSWER IS A REAL ANSWER, AND IT HAS ITS OWN WORDS.
 *
 * Plan 08 T10 says the field "can be submitted empty (the worry still counts
 * as processed)". The design goes further and gives that path a sentence:
 * "Nothing comes to mind" sits under the primary button as its own
 * affordance, so leaving without a plan is something a person chooses rather
 * than something they do by defeating a form. f6's caption: "an empty answer
 * exits through 'Nothing comes to mind' without failing".
 *
 * Both routes call `onDone`. The difference is entirely in what it feels like
 * to take them, which is the difference the whole product is made of.
 *
 * SAGE ENTERS HERE, AND ONLY HERE.
 *
 * The field's edge and caret are the one green in Calma — "something turned
 * useful", per the caption. It is never a fill and never text: a green tick
 * would make this a success state, and the app has nothing to be right about.
 */
export function TriageAction({
  onDone,
}: {
  /** `''` when they had nothing. The worry is processed either way. */
  onDone: (actionText: string) => void;
}) {
  const { t } = useTranslation('worry');
  const { theme } = useUniwind();

  const text = useRef('');
  const [focused, setFocused] = useState(false);

  const submit = useCallback(() => {
    onDone(text.current.trim());
  }, [onDone]);

  const edge = focused
    ? 'border-[1.5px] border-sage-ring'
    : 'border border-border-worry';

  return (
    <>
      <Text variant="heading" className="text-[32px] leading-[40px]">
        {t('window.step')}
      </Text>

      {/* Directly under the question, where it can do its job — the caption
          is specific about the placement. A hint parked at the bottom of the
          screen arrives after the person has already decided they have
          nothing worth writing. */}
      <Text variant="callout" className="mt-[10px] text-[18px] leading-[27px]">
        {t('window.stepHint')}
      </Text>

      <View
        className={`mt-5 bg-surface-worry p-[22px] ${edge}`}
        style={{ borderRadius: radius.note, minHeight: 150 }}
      >
        <TextInput
          multiline
          autoFocus
          scrollEnabled={false}
          allowFontScaling
          accessibilityLabel={t('window.stepLabel')}
          selectionColor={theme === 'dark' ? sage.dark.base : sage.light.base}
          // Uncontrolled, like the capture field: this component owns nothing
          // that needs to change as someone types, so a render per keystroke
          // would buy nothing at all.
          onChangeText={(next) => {
            text.current = next;
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="font-sans text-[19px] leading-[29px] text-foreground"
          style={{ textAlignVertical: 'top' }}
        />
      </View>

      <View className="mt-4 gap-[6px]">
        <Button label={t('window.stepDone')} onPress={submit} />

        {/*
          Not `Button variant="quiet"`: this is 48px where quiet is 62, and
          f6 gives it no border and no fill at all. It is a sentence you can
          press, which is the right weight for "I have nothing" — smaller than
          the action, but never greyed, never delayed, and always present.
          It stays visible once there IS text, because changing your mind
          about whether you have a plan is allowed.
        */}
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('window.stepEmpty')}
          onPress={() => onDone('')}
          className="h-12 flex-row items-center justify-center"
        >
          <Text variant="callout" className="text-[17px] leading-[26px]">
            {t('window.stepEmpty')}
          </Text>
        </Touchable>
      </View>
    </>
  );
}
