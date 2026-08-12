import { z } from 'zod';

/**
 * A completed (or abandoned) breathing session.
 *
 * `durationSec` is what actually happened, not what was intended — someone who
 * stops after forty seconds of a three-minute session did forty seconds, and
 * the Progress tab should say so.
 *
 * See systems/02-data-layer.md § Entities.
 */

export const breathingPatternIdSchema = z.enum([
  '4-7-8',
  '5-5-5-5',
  'physiological-sigh',
  'custom',
]);

export type BreathingPatternId = z.infer<typeof breathingPatternIdSchema>;

/** in / hold / out / hold, in seconds. */
export const customRatioSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

export type CustomRatio = z.infer<typeof customRatioSchema>;

export const breathingEntryPointSchema = z.enum([
  'panic',
  'sigh',
  'breathe-tab',
  'journal-prompt',
  /**
   * Onboarding's first breath (b7).
   *
   * It is a REAL session, recorded and counted, not a demo — that is the
   * whole argument of `systems/11-onboarding.md`, and it is why this needs
   * its own entry point rather than borrowing 'sigh': someone looking at
   * their history a month later should be able to see that the first one
   * happened before they had finished setting the app up.
   *
   * Adding a member to this enum is safe for data already on disk. No
   * existing record changes shape, so there is no migration.
   */
  'onboarding',
]);

export type BreathingEntryPoint = z.infer<typeof breathingEntryPointSchema>;

export const postFeelingSchema = z.enum(['better', 'same', 'worse']);

export type PostFeeling = z.infer<typeof postFeelingSchema>;

export const breathingSessionSchema = z.object({
  id: z.string(),
  pattern: breathingPatternIdSchema,
  customRatio: customRatioSchema.optional(),
  entryPoint: breathingEntryPointSchema,
  /** Epoch ms. */
  startedAt: z.number().int(),
  /** Actual, not intended. */
  durationSec: z.number().nonnegative(),
  cyclesCompleted: z.number().int().nonnegative(),
  /** 0–10. `null` means the user skipped the question (D-007). */
  preSuds: z.number().int().min(0).max(10).nullable(),
  postFeeling: postFeelingSchema.nullable(),
  /** `false` = the user stopped early. Not a failure, just a fact. */
  completed: z.boolean(),
});

export type BreathingSession = z.infer<typeof breathingSessionSchema>;
