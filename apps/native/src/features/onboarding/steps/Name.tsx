import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';

/**
 * B11 — Name. `designs/extracted/b11-name-{light,dark}.html`.
 *
 * OPTIONAL, AND SKIP IS A FULL-SIZE PILL DIRECTLY BENEATH CONTINUE.
 *
 * The designer's note is precise about this: "identical target, no pitch about
 * personalising". Not a grey word, not a smaller link, not a "you can always
 * add it later" nudge. Two 62px pills, one after the other, and the second one
 * is a real answer.
 *
 * EVERY GREETING IN THE APP READS NATURALLY WITH NO NAME SET. `common:greeting`
 * carries `plain` and `named` as two whole sentences rather than one sentence
 * with a hole in it, so an empty name is never a missing word — it is a
 * different, equally finished greeting. That is what makes skipping here
 * genuinely free rather than a slightly worse app.
 *
 * "ONLY STORED ON THIS PHONE" IS LITERALLY TRUE, which is why it can be said.
 * There is no network layer to send it over.
 *
 * The keyboard is up and the field focused on arrival, with both actions above
 * it, so nothing is hidden and nothing jumps when it appears.
 */
export function Name({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation(['onboarding', 'common']);
  const { prefs: prefsRepo } = useRepositories();
  const updatePrefs = usePrefsStore((state) => state.update);
  const { theme } = useUniwind();

  const [name, setName] = useState('');

  const save = () => {
    const trimmed = name.trim();
    // Empty stays `null`, never an empty string. `prefs.name` is nullable and
    // every greeting branches on that; an empty string would pass the check
    // and render "You're here, ." at someone.
    void updatePrefs(prefsRepo, { name: trimmed === '' ? null : trimmed });
    onContinue();
  };

  return (
    <View className="flex-1">
      <View className="mt-4 gap-2">
        <Text variant="heading">{t('onboarding:name.title')}</Text>
        <Text variant="callout">{t('onboarding:name.hint')}</Text>
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
        autoCorrect={false}
        // No `maxLength`. A name is not a field to be validated, and a
        // character limit is a way of telling someone their name is wrong.
        returnKeyType="done"
        onSubmitEditing={save}
        accessibilityLabel={t('onboarding:name.title')}
        placeholder={t('onboarding:name.placeholder')}
        placeholderTextColor={theme === 'dark' ? '#8F98A3' : '#5B6873'}
        allowFontScaling
        className="mt-[22px] h-[66px] rounded-card border-[1.5px] border-accent-wash-border bg-surface px-5 font-sans text-[19px] text-foreground"
      />

      <View className="mt-[22px] gap-2">
        <Button label={t('common:continue')} onPress={save} />
        {/* Same height, same shape, same distance from the thumb. */}
        <Button variant="secondary" label={t('common:skip')} onPress={onContinue} />
      </View>

      <View className="flex-1" />
    </View>
  );
}
