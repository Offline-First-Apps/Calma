import { z } from 'zod';
import { customRatioSchema } from './breathing';

/**
 * Everything the app remembers about how a person wants Calma to behave.
 *
 * See systems/02-data-layer.md § Entities.
 */

/**
 * Sentinel for `Prefs.locale`. Stored rather than resolved, because it is a
 * live binding: someone who picks "system" and later changes their phone's
 * language expects Calma to follow, not to have snapshotted the old value.
 */
export const SYSTEM_LOCALE = 'system';

/** `'system'`, or a BCP-47 tag such as `'en'` or `'pt-BR'`. */
export const localePrefSchema = z.string().min(1);

export type LocalePref = z.infer<typeof localePrefSchema>;

/** Local wall-clock `HH:mm`, 24-hour. Never stored with an offset. */
export const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: 'expected HH:mm',
});

/** 15 is forced on free (systems/05-entitlements.md). */
export const worryWindowMinutesSchema = z.union([
  z.literal(15),
  z.literal(20),
  z.literal(30),
]);

export type WorryWindowMinutes = z.infer<typeof worryWindowMinutesSchema>;

export const orbThemeSchema = z.enum(['orb', 'wave', 'bloom']);

export type OrbTheme = z.infer<typeof orbThemeSchema>;

export const themePrefSchema = z.enum(['system', 'light', 'dark']);

export type ThemePref = z.infer<typeof themePrefSchema>;

/** The three multi-select answers from onboarding. Editable in Settings. */
export const onboardingAnswersSchema = z.object({
  why: z.array(z.string()),
  when: z.array(z.string()),
  helped: z.array(z.string()),
});

export type OnboardingAnswers = z.infer<typeof onboardingAnswersSchema>;

export const prefsSchema = z.object({
  name: z.string().nullable(),
  locale: localePrefSchema,
  worryWindowTime: timeOfDaySchema,
  worryWindowMinutes: worryWindowMinutesSchema,
  customRatio: customRatioSchema.nullable(),
  orbTheme: orbThemeSchema,
  theme: themePrefSchema,
  soundEnabled: z.boolean(),
  hapticsEnabled: z.boolean(),
  /** Epoch ms, or `null` if onboarding has not been finished. */
  onboardingCompletedAt: z.number().int().nullable(),
  /** Left via the crisis exit — allows exactly one re-offer, and no more. */
  onboardingEscaped: z.boolean(),
  onboardingReOffered: z.boolean(),
  onboardingAnswers: onboardingAnswersSchema.nullable(),
  /** Whether we have asked for notification permission. We ask at most once. */
  notificationsAsked: z.boolean(),
});

export type Prefs = z.infer<typeof prefsSchema>;

/**
 * The state a device is in before anyone has touched a setting.
 *
 * 19:00 is the default worry window: late enough to have collected the day,
 * early enough not to hand someone their worries at bedtime.
 */
export const defaultPrefs: Prefs = {
  name: null,
  locale: SYSTEM_LOCALE,
  worryWindowTime: '19:00',
  worryWindowMinutes: 15,
  customRatio: null,
  orbTheme: 'orb',
  theme: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
  onboardingCompletedAt: null,
  onboardingEscaped: false,
  onboardingReOffered: false,
  onboardingAnswers: null,
  notificationsAsked: false,
};
