import type { JournalEntry } from '@calma/domain';

export type NewJournalEntry = Omit<
  JournalEntry,
  'id' | 'createdAt' | 'updatedAt'
> & {
  createdAt?: number;
};

export type JournalPatch = Partial<
  Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface JournalPage {
  entries: JournalEntry[];
  /** Day key to pass as `before` for the next page, or `null` at the end. */
  cursor: string | null;
}

export interface JournalRepo {
  create(input: NewJournalEntry): Promise<JournalEntry>;
  get(id: string): Promise<JournalEntry | null>;
  update(id: string, patch: JournalPatch): Promise<JournalEntry>;
  /** Saved entries only — a draft does not consume the weekly allowance. */
  listByWeek(weekKey: string): Promise<JournalEntry[]>;
  listDrafts(): Promise<JournalEntry[]>;
  /** Newest first, a page of days at a time. */
  listPaged(options?: { before?: string; days?: number }): Promise<JournalPage>;
  /**
   * Case-insensitive substring scan across every entry.
   *
   * Deliberately not indexed: an inverted index of someone's private journal
   * is an extra copy of sensitive text on disk, and a linear scan over a few
   * hundred short records is sub-millisecond
   * (systems/02-data-layer.md § Query strategy).
   */
  search(query: string): Promise<JournalEntry[]>;
  delete(id: string): Promise<void>;
}
