import { LANGUAGES, SYSTEM_LOCALE } from '@calma/i18n';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/ui/Text';
import { Stagger } from '@/src/ui/Stagger';
import { Touchable } from '@/src/ui/Touchable';

/**
 * The language picker, shared verbatim by onboarding (b2) and Settings
 * (plan 18 T13, plan 14 T02).
 *
 * ONE COMPONENT WITH NO VARIANTS, WHICH IS WHAT "SHARED VERBATIM" MEANS.
 *
 * Two copies of a list of languages drift the first time a language is added,
 * and they drift silently — a picker missing an entry looks exactly like a
 * picker. This has no `compact`, no `showSystem`, no props that change what is
 * listed. Both call sites render the same rows.
 *
 * EACH LANGUAGE IN ITS OWN LANGUAGE, AND NO FLAGS.
 *
 * "Deutsch", never "German": somebody looking for their language does not read
 * the current one. Flags are countries rather than languages, and getting that
 * wrong is a way of telling a Swiss German or a Brazilian which country the
 * app thinks they belong to. The native names are content, not copy — the same
 * string in every locale — so they never go through i18n.
 *
 * "MATCH MY PHONE" IS A LIVE BINDING, AND IS DESCRIBED AS ONE.
 *
 * It stores the `'system'` sentinel rather than resolving to a tag, because
 * somebody who picks it and later changes their phone's language expects
 * Calma to follow. Snapshotting the resolved tag would break that quietly, a
 * month later, in a way nobody would connect to this screen. Its second line
 * names the language it currently resolves to, so "match my phone" is never a
 * mystery about what will happen.
 *
 * NOTHING IS MARKED AS RECOMMENDED. The device's own language is already the
 * default via the sentinel; badging it as well would be telling somebody their
 * choice was the wrong one.
 */
export function LanguagePicker({
  /** `prefs.locale`: `'system'`, or an explicit BCP-47 tag. */
  value,
  /** What `'system'` resolves to right now, from `resolvePreferredLocale`. */
  resolved,
  onChange,
}: {
  value: string;
  resolved: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation('settings');

  const resolvedName =
    LANGUAGES.find((language) => language.tag === resolved)?.nativeName ?? '';

  return (
    <Stagger className="gap-[10px]">
      <Row
        label={t('languageSystem')}
        detail={resolvedName}
        selected={value === SYSTEM_LOCALE}
        onPress={() => onChange(SYSTEM_LOCALE)}
      />

      {LANGUAGES.map((language) => (
        <Row
          key={language.tag}
          label={language.nativeName}
          selected={value === language.tag}
          onPress={() => onChange(language.tag)}
        />
      ))}
    </Stagger>
  );
}

/**
 * b2's row. The wash, the edge and the filled dot together — three signals,
 * none of them brightness alone, because a brightness step is invisible on a
 * dimmed screen at 2am and in greyscale, which are exactly the conditions this
 * app is designed around.
 */
function Row({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      className={`min-h-option-card flex-row items-center justify-between gap-4 rounded-card px-5 py-4 ${
        selected
          ? 'border-[1.5px] border-accent-wash-border bg-accent-wash'
          : 'border border-border bg-surface'
      }`}
    >
      {/*
        The design sets unselected rows at weight 400 and the selected one at
        500. Both render at `control` here rather than stacking a second
        font-family utility on the variant's own — two of those resolve by
        stylesheet order rather than class order, which is a coin toss dressed
        up as an override. The wash, the border and the dot already carry it.
      */}
      <View className="shrink gap-1">
        <Text variant="control">{label}</Text>
        {detail ? <Text variant="callout">{detail}</Text> : null}
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`h-[22px] w-[22px] flex-none rounded-full ${
          selected ? 'bg-accent' : 'border-[1.5px] border-option-mark'
        }`}
      />
    </Touchable>
  );
}
