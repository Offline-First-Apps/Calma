import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, TextInput, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { useRepositories } from '@/src/lib/repositories';
import { usePrefsStore } from '@/src/stores/prefs';
import { Button } from '@/src/ui/Button';
import { Screen } from '@/src/ui/Screen';
import { Text } from '@/src/ui/Text';

/**
 * What we call you — plan 14 T03's destination.
 *
 * The preference has existed since onboarding's b11 and there has been no way
 * to change it since. Somebody who typed a nickname at 2am, or their full
 * name, or their ex's name, has been greeted with it ever since.
 *
 * CLEARING IT IS A REAL, EQUALLY-WEIGHTED ACTION.
 *
 * b11's rule was "identical target, no pitch about personalising", and the
 * same holds here: "Leave it blank" is a full-size pill directly beneath Save,
 * not a grey word, not an X inside the field, and with nothing between the
 * person and it.
 *
 * That is only honest because it is true downstream. `common:greeting` carries
 * `plain` and `named` as two whole sentences rather than one sentence with a
 * hole in it, so an empty name is a different finished greeting rather than a
 * missing word. Clearing costs nothing.
 *
 * EMPTY STAYS `null`, NEVER AN EMPTY STRING. `prefs.name` is nullable and
 * every greeting branches on that; an empty string passes a truthiness check
 * and renders "You're here, ." at somebody.
 */
export function NameScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const router = useRouter();
  const repositories = useRepositories();
  const { theme } = useUniwind();

  const stored = usePrefsStore((state) => state.prefs.name);
  const update = usePrefsStore((state) => state.update);

  const [name, setName] = useState(stored ?? '');

  async function save(value: string | null) {
    await update(repositories.prefs, { name: value });
    router.back();
  }

  const trimmed = name.trim();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="heading" className="text-[30px] leading-[36px]">
          {t('settings:name')}
        </Text>

        {/*
          "Only stored on this phone" is literally true, which is the only
          reason it can be said. There is no network layer to send it over.
        */}
        <Text
          variant="bodySm"
          className="mt-[14px] text-[18px] leading-[29px] text-card-secondary"
        >
          {t('settings:nameHint')}
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          // No `maxLength`. A name is not a field to be validated, and a
          // character limit is a way of telling somebody their name is wrong.
          returnKeyType="done"
          onSubmitEditing={() => void save(trimmed === '' ? null : trimmed)}
          accessibilityLabel={t('settings:name')}
          placeholder={t('settings:rows.nameUnset')}
          placeholderTextColor={theme === 'dark' ? '#8F98A3' : '#5B6873'}
          allowFontScaling
          className="mt-6 h-[66px] rounded-card border-[1.5px] border-accent-wash-border bg-surface px-5 font-sans text-[19px] text-foreground"
        />

        <View className="flex-1" style={{ minHeight: 24 }} />

        <View className="gap-2">
          <Button
            label={t('common:done')}
            onPress={() => void save(trimmed === '' ? null : trimmed)}
          />
          {/* Same height, same shape, same distance from the thumb. */}
          <Button
            variant="secondary"
            label={t('settings:nameClear')}
            onPress={() => void save(null)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
