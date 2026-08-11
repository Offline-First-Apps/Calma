import { z } from 'zod';

/**
 * A worry, captured to be dealt with later rather than now.
 *
 * There is no soft-delete and no tombstone anywhere near this entity. When
 * someone releases a worry it is gone — that is the whole emotional premise of
 * the feature (systems/02-data-layer.md § Deletion).
 */

export const worryStatusSchema = z.enum(['pending', 'processed', 'released']);

export type WorryStatus = z.infer<typeof worryStatusSchema>;

export const worrySchema = z.object({
  id: z.string(),
  text: z.string(),
  /** Epoch ms. */
  capturedAt: z.number().int(),
  status: worryStatusSchema,
  resolvedAt: z.number().int().nullable(),
  /** Set only when `status === 'processed'`. */
  actionText: z.string().nullable(),
});

export type Worry = z.infer<typeof worrySchema>;
