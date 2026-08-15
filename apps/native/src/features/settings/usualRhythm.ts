import type { BreathingPatternId, CustomRatio } from '@calma/domain';

/**
 * "Your usual rhythm" — the one preference that decides what Home offers.
 *
 * PURE, AND IN A `.ts` FILE, because it holds two decisions and a decision
 * inside a component is a decision that stops being checked
 * (`apps/native/vitest.config.ts` runs pure Node with no renderer).
 *
 * THE ONE RULE THIS FILE EXISTS FOR: `getPattern('custom')` THROWS WITHOUT A
 * RATIO.
 *
 * Someone can set a custom rhythm, use it for a month, and then erase
 * everything — or arrive on a build where a stored ratio failed validation and
 * was salvaged away. `prefs.defaultPattern` would still say `'custom'` and the
 * next tap on Home would throw a `RangeError` on the one screen that must
 * never fail. So the pairing is resolved here, once, and Home reads a pattern
 * that is always playable.
 *
 * Falling back to the sigh rather than to the last preset: the sigh is what
 * Calma offers a person who has expressed no preference at all, and someone
 * whose custom ratio has gone missing has, functionally, expressed none.
 */

/** What Calma offers when nobody has chosen. Also the panic path's pattern. */
export const FALLBACK_PATTERN: BreathingPatternId = 'physiological-sigh';

/**
 * The pattern to actually start, given what is stored.
 *
 * @param defaultPattern `prefs.defaultPattern`.
 * @param customRatio `prefs.customRatio` — `null` when none has been built.
 */
export function resolveUsualPattern(
  defaultPattern: BreathingPatternId,
  customRatio: CustomRatio | null,
): BreathingPatternId {
  if (defaultPattern === 'custom' && customRatio === null) {
    return FALLBACK_PATTERN;
  }
  return defaultPattern;
}

/**
 * The i18n key segment for a pattern, so `breathing:patterns.*` can be reached
 * from an id.
 *
 * A record rather than a `switch` with a `default`, so that adding a pattern
 * to the domain is a type error here rather than a missing name at runtime.
 * The names themselves are spoken, never numeric — "Even breathing", not
 * "5-5-5-5" — which is why the key is not simply the id.
 */
export const PATTERN_KEY: Record<
  BreathingPatternId,
  'sigh' | '478' | 'box' | 'custom'
> = {
  'physiological-sigh': 'sigh',
  '4-7-8': '478',
  '5-5-5-5': 'box',
  custom: 'custom',
};

/**
 * The order the picker offers, which is d1's order and not the domain's.
 *
 * `PRESET_PATTERNS` lists 4-7-8 first because that is the order the maths was
 * written in. Both pickers lead with the sigh, because the most likely reason
 * someone is choosing a rhythm is that they want something that works soon.
 */
export const PICKER_ORDER: readonly BreathingPatternId[] = [
  'physiological-sigh',
  '4-7-8',
  '5-5-5-5',
  'custom',
];
