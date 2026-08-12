import { z } from 'zod';

/**
 * A CBT thought record.
 *
 * Every text field may legitimately be empty — a draft is saved as the person
 * types, and half a thought is still worth keeping. Validation here is about
 * shape, never about whether someone filled the form in "properly".
 */

export const journalEntrySchema = z.object({
  id: z.string(),
  situation: z.string(),
  automaticThought: z.string(),
  emotion: z.string(),
  /** 0–10. */
  emotionIntensity: z.number().int().min(0).max(10),
  evidenceFor: z.string(),
  evidenceAgainst: z.string(),
  balancedThought: z.string(),
  /** 0–10, or `null` if the entry has not been re-rated. */
  emotionIntensityAfter: z.number().int().min(0).max(10).nullable(),
  /** Drafts do not consume the weekly allowance (systems/05-entitlements.md). */
  isDraft: z.boolean(),
  linkedSessionId: z.string().nullable(),
  /** Epoch ms. */
  createdAt: z.number().int(),
  /** Epoch ms. */
  updatedAt: z.number().int(),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;
