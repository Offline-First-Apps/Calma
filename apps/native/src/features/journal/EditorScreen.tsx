import type { JournalEntry } from '@calma/domain';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { playSound } from '@/src/lib/audio';
import { hapticJournalSaved } from '@/src/lib/haptics';
import { useRepositories } from '@/src/lib/repositories';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

import { IntensityScale } from './IntensityScale';
import { SaveConfirmation } from './SaveConfirmation';
import { STEPS, valueFor, type Step } from './steps';
import { firstEmptyStep, useJournalStore } from './store';
import { useAutosave } from './useAutosave';

/**
 * The entry editor (g2, g3).
 *
 * NO CODE PATH IN HERE CLEARS THE EDITOR (T13).
 *
 * Search this file for anything that empties a field and you will find
 * nothing. Not on save, not on error, not on navigation, not on reaching a
 * limit. The entry is a draft on disk from before the first keystroke (see
 * `store.startDraft`), autosave writes to it continuously, and every exit
 * from this screen flushes and leaves the record where it is.
 *
 * That means a hit weekly limit or a paywall cannot cost anyone a word: those
 * block the *finish*, not the writing, and the draft is still there
 * afterwards (`plans/19-review-findings.md` R3).
 *
 * SAVE IS IDEMPOTENT FOR 600ms.
 *
 * A lagging double-tap on "Save" must not create two entries or burn two
 * weekly allowances (R1). Same window and same reason as the capture field.
 */
const SAVE_LOCKOUT_MS = 600;

export function EditorScreen({ id }: { id: string }) {
  const { t } = useTranslation('journal');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const repositories = useRepositories();

  const finish = useJournalStore((state) => state.finish);
  const { save, flush } = useAutosave(repositories.journal, id);

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const lastSave = useRef(0);

  useEffect(() => {
    let alive = true;
    void repositories.journal.get(id).then((loaded) => {
      if (!alive || loaded === null) return;
      setEntry(loaded);
      // Resume where they stopped, not at the beginning (T07).
      setIndex(firstEmptyStep(loaded));
    });

    return () => {
      alive = false;
    };
  }, [id, repositories.journal]);

  /**
   * Local state and the draft are updated together.
   *
   * The input is uncontrolled below (`defaultValue`), so this state exists
   * for the *other* steps to read — the re-rate step needs the emotion name,
   * for instance. Keystrokes do not re-render the field they came from.
   */
  const update = useCallback(
    (patch: Partial<JournalEntry>) => {
      setEntry((current) => (current === null ? current : { ...current, ...patch }));
      save(patch);
    },
    [save],
  );

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const onSave = useCallback(() => {
    const now = Date.now();
    if (now - lastSave.current < SAVE_LOCKOUT_MS) return;
    lastSave.current = now;

    flush();
    void finish(repositories.journal, id);

    // The pencil and a selection haptic, together (T08). One event, not two
    // things scheduled to agree -- the same rule the breath haptics follow.
    hapticJournalSaved();
    void playSound('journalSaved');

    setSaved(true);
  }, [finish, flush, id, repositories.journal]);

  /**
   * Home, and nowhere else.
   *
   * `dismissAll` rather than `back`, because the editor can be reached from
   * the tab, from a draft, or from a post-session offer, and none of those is
   * a place to be returned to holding an entry that is now finished. There is
   * no summary screen, no analysis, no "you've written 3 this week" and no
   * suggestion to write another (T08, D-015).
   */
  const leave = useCallback(() => router.dismissAll(), [router]);

  if (saved) return <SaveConfirmation onDone={leave} />;

  if (entry === null || step === undefined) {
    return <View className="flex-1 bg-write" />;
  }

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-write">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 20) + 72,
          paddingHorizontal: 28,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          flexGrow: 1,
        }}
      >
        <StepBody
          key={step.kind === 'text' ? step.field : step.kind}
          step={step}
          entry={entry}
          onChange={update}
        />

        <View className="mt-4 flex-row items-center justify-between gap-3">
          {/* "Skip this one" is a sentence, not a greyed control, and it is
              present on every step including the last. Leaving a prompt blank
              is a legitimate answer (T03). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('skip')}
            onPress={() => (isLast ? onSave() : setIndex(index + 1))}
            className="h-12 justify-center active:opacity-70"
          >
            <Text variant="callout" className="text-[17px]">
              {t('skip')}
            </Text>
          </Pressable>

          <Button
            label={isLast ? t('save') : t('next')}
            onPress={() => (isLast ? onSave() : setIndex(index + 1))}
            className="px-[30px]"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepBody({
  step,
  entry,
  onChange,
}: {
  step: Step;
  entry: JournalEntry;
  onChange: (patch: Partial<JournalEntry>) => void;
}) {
  const { t } = useTranslation('journal');

  return (
    <View className="flex-1">
      <Text variant="heading" className="text-[32px] leading-[40px]">
        {t(step.prompt)}
      </Text>

      {step.kind === 'text' && step.hint !== undefined ? (
        <Text variant="callout" className="mt-[10px] text-[18px] leading-[27px]">
          {t(step.hint)}
        </Text>
      ) : null}

      {step.kind === 'text' ? (
        <View
          className="mt-5 border border-border-paper bg-surface-paper p-6"
          style={{ borderRadius: radius.note, minHeight: step.tall ? 230 : 190 }}
        >
          <TextInput
            // Uncontrolled: `key` on the parent remounts it per step, so the
            // default is the stored value and typing does not re-render.
            defaultValue={valueFor(entry, step)}
            multiline
            autoFocus
            scrollEnabled={false}
            allowFontScaling
            accessibilityLabel={t(step.prompt)}
            onChangeText={(next) => onChange({ [step.field]: next })}
            className="font-sans text-[19px] leading-[30px] text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
      ) : null}

      {step.kind === 'emotion' ? (
        <View className="mt-5 gap-6">
          <View
            className="border border-border-paper bg-surface-paper p-6"
            style={{ borderRadius: radius.note }}
          >
            <TextInput
              defaultValue={entry.emotion}
              allowFontScaling
              accessibilityLabel={t('emotion')}
              onChangeText={(next) => onChange({ emotion: next })}
              className="font-sans text-[19px] leading-[30px] text-foreground"
            />
          </View>

          <View className="gap-3">
            <Text variant="bodySm" className="text-secondary">
              {t('intensity')}
            </Text>
            <IntensityScale
              value={entry.emotionIntensity}
              accessibilityLabel={t('intensity')}
              onChange={(value) => onChange({ emotionIntensity: value })}
            />
          </View>
        </View>
      ) : null}

      {step.kind === 'reRate' ? (
        <View className="mt-6 gap-3">
          <IntensityScale
            value={entry.emotionIntensityAfter}
            accessibilityLabel={t('reRate')}
            onChange={(value) => onChange({ emotionIntensityAfter: value })}
          />

          {/*
            The delta, stated and not judged (T05).
            No arrow, no colour, no "well done" and no "keep trying". An
            increase is an entirely normal outcome of looking straight at
            something, and the copy for it is the same shape as the copy for a
            decrease.
          */}
          {entry.emotionIntensityAfter !== null ? (
            <Text variant="callout" className="mt-3">
              {t('reRateResult', {
                before: entry.emotionIntensity,
                after: entry.emotionIntensityAfter,
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
