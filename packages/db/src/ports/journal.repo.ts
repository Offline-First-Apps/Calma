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
  /**
   * Clears `linkedSessionId` on every entry pointing at a session.
   *
   * Called when a breathing session is deleted (plan 09 T10). The entry is
   * left completely intact -- only the link goes. Deleting someone's writing
   * because they cleared their session history would be the single worst
   * cascade this app could contain, and an entry left pointing at a session
   * that no longer exists is a dangling reference that reads as data loss the
   * first time something tries to follow it.
   *
   * Returns the number of entries changed, so a caller can assert on it.
   */
  unlinkSession(sessionId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
