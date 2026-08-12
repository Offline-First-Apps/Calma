import type { Worry } from '@calma/domain';

/**
 * Worry storage.
 *
 * Async signatures over a synchronous store. It costs nothing today and means
 * a SQLite adapter needs no call-site changes
 * (systems/02-data-layer.md § Ports and adapters).
 */

export interface NewWorry {
  text: string;
  /** Epoch ms. Defaults to now. Injectable so tests can pin the day. */
  capturedAt?: number;
}

export interface WorryRepo {
  create(input: NewWorry): Promise<Worry>;
  get(id: string): Promise<Worry | null>;
  /** Oldest first — the order they were carried in. */
  listPending(): Promise<Worry[]>;
  listByDay(dayKey: string): Promise<Worry[]>;
  countCapturedOn(dayKey: string): Promise<number>;
  markProcessed(id: string, actionText: string): Promise<void>;
  markReleased(id: string): Promise<void>;
  /**
   * Hard delete. No soft-delete, no tombstone: when someone releases a worry
   * it is gone, and that is the emotional premise of the feature.
   */
  delete(id: string): Promise<void>;
}
