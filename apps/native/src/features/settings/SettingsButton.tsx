import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

/**
 * The way into Settings, and the only one.
 *
 * NO DESIGN DRAWS IT. c1 has no settings affordance at all — the caption is
 * "the room, and the thing the room is for", and the screen is deliberately
 * one greeting and one button. So this is an invented control, and the
 * invention is constrained by what c1 is protecting:
 *
 *   - it is 24px of drawn marks in a 44px target, in the corner, above the
 *     greeting. Nothing moves; nothing else on Home shifts to make room;
 *   - it is `muted`, the quietest colour on the screen, because the one thing
 *     Home is allowed to draw the eye to is the amber button;
 *   - it is not a cog. A cog is machinery, and this app is not a machine. Four
 *     short rules of decreasing length — the same mark the settings rows
 *     themselves are made of — read as "a list of things you can adjust".
 *
 * `plans/14` T01's "Done when" says "reachable from Home", so the placement is
 * the plan's decision rather than this session's. The DRAWING is this
 * session's, and it is recorded as a Note (session 16).
 */
export function SettingsButton() {
  const { t } = useTranslation('settings');
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/settings')}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.openSettings')}
      hitSlop={12}
      className="h-11 w-11 items-center justify-end gap-[5px] self-end py-[10px] active:opacity-60"
    >
      {[24, 18, 12].map((width) => (
        <View
          key={width}
          className="bg-muted"
          style={{ width, height: 2, borderRadius: 1 }}
        />
      ))}
    </Pressable>
  );
}
