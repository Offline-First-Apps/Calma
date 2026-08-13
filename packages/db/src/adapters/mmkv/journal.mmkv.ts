import {
  type JournalEntry,
  dayKey,
  journalEntrySchema,
  newId,
  weekKey,
} from '@calma/domain';

import {
  IDX_JOURNAL_DAYS,
  RECORD_PREFIXES,
  idFromKey,
  idxJournalDay,
  journalKey,
} from '../../keys';
import type { KeyValueStore } from '../../kv';
import type {
  JournalPage,
  JournalPatch,
  JournalRepo,
  NewJournalEntry,
} from '../../ports/journal.repo';
import {
  addToIndex,
  readIndex,
  removeFromIndex,
  removeIndexThenRecord,
  writeIndex,
  writeRecordThenIndex,
} from './indexes';
import { readRecord, readRecords } from './validate';

export interface JournalRepoOptions {
  now?: () => number;
  createId?: () => string;
}

const DEFAULT_PAGE_DAYS = 30;

export function createJournalRepo(
  store: KeyValueStore,
  options: JournalRepoOptions = {},
): JournalRepo {
  const now = options.now ?? (() => Date.now());
  const createId = options.createId ?? newId;

  function readDay(day: string): JournalEntry[] {
    const key = idxJournalDay(day);
    const ids = readIndex(store, key);
    const { records, dropped } = readRecords(
      store,
      ids,
      journalKey,
      journalEntrySchema,
    );

    if (dropped.length > 0) {
      writeIndex(
        store,
        key,
        ids.filter((id) => !dropped.includes(id)),
      );
    }

    return records;
  }

  /** Day keys, newest first. */
  function days(): string[] {
    return readIndex(store, IDX_JOURNAL_DAYS);
  }

  return {
    async create(input: NewJournalEntry) {
      const createdAt = input.createdAt ?? now();
      const { createdAt: _ignored, ...rest } = input;

      const entry: JournalEntry = journalEntrySchema.parse({
        ...rest,
        id: createId(),
        createdAt,
        updatedAt: createdAt,
      });

      const day = dayKey(new Date(createdAt));

      writeRecordThenIndex(store, journalKey(entry.id), entry, () => {
        addToIndex(store, idxJournalDay(day), entry.id);
        addToIndex(store, IDX_JOURNAL_DAYS, day, 'descending');
      });

      return entry;
    },

    async get(id) {
      return readRecord(store, journalKey(id), journalEntrySchema);
    },

    async update(id, patch: JournalPatch) {
      const existing = readRecord(store, journalKey(id), journalEntrySchema);
      if (!existing) throw new Error(`no journal entry ${id}`);

      const next: JournalEntry = journalEntrySchema.parse({
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now(),
      });

      // The day index keys off `createdAt`, which never moves, so a plain
      // record write is enough — no index touch, no ordering concern.
      store.set(journalKey(id), JSON.stringify(next));
      return next;
    },

    async listByWeek(week) {
      // Saved entries only. A draft is someone mid-thought; it does not
      // consume the weekly allowance and does not belong in the week's list.
      return days()
        .filter((day) => weekKey(dayKeyToLocalDate(day)) === week)
        .flatMap((day) => readDay(day))
        .filter((entry) => !entry.isDraft)
        .sort((a, b) => b.createdAt - a.createdAt);
    },

    async listDrafts() {
      return days()
        .flatMap((day) => readDay(day))
        .filter((entry) => entry.isDraft)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async listPaged(pageOptions = {}): Promise<JournalPage> {
      const { before, days: pageSize = DEFAULT_PAGE_DAYS } = pageOptions;

      const all = days();
      const start = before ? all.findIndex((day) => day < before) : 0;
      if (start === -1) return { entries: [], cursor: null };

      const page = all.slice(start, start + pageSize);
      const entries = page
        .flatMap((day) => readDay(day))
        .sort((a, b) => b.createdAt - a.createdAt);

      const nextIndex = start + pageSize;
      return {
        entries,
        cursor: nextIndex < all.length ? (page.at(-1) ?? null) : null,
      };
    },

    async search(query) {
      const needle = query.trim().toLowerCase();
      if (needle === '') return [];

      // A full scan of the record keys, not of an index — search should still
      // find an entry whose index entry was lost.
      const ids = store
        .getAllKeys()
        .filter((key) => key.startsWith(RECORD_PREFIXES.journal))
        .map((key) => idFromKey('journal', key))
        .filter((id): id is string => id !== null);

      const { records } = readRecords(
        store,
        ids,
        journalKey,
        journalEntrySchema,
      );

      return records
        .filter((entry) => searchableText(entry).includes(needle))
        .sort((a, b) => b.createdAt - a.createdAt);
    },

    async unlinkSession(sessionId) {
      const linked = days()
        .flatMap((day) => readDay(day))
        .filter((entry) => entry.linkedSessionId === sessionId);

      for (const entry of linked) {
        // A plain record write, exactly as `update` does: the day index keys
        // off `createdAt` and nothing here moves it. `updatedAt` is left
        // alone deliberately -- the app cleaning up its own reference is not
        // the person having touched their entry, and the draft list sorts on
        // that field.
        store.set(
          journalKey(entry.id),
          JSON.stringify({ ...entry, linkedSessionId: null }),
        );
      }

      return linked.length;
    },

    async delete(id) {
      const entry = readRecord(store, journalKey(id), journalEntrySchema);

      removeIndexThenRecord(store, journalKey(id), () => {
        if (!entry) return;

        const day = dayKey(new Date(entry.createdAt));
        removeFromIndex(store, idxJournalDay(day), id);

        // Drop the day from the day index once nothing is left on it.
        if (readIndex(store, idxJournalDay(day)).length <= 1) {
          removeFromIndex(store, IDX_JOURNAL_DAYS, day);
        }
      });
    },
  };
}

function searchableText(entry: JournalEntry): string {
  return [
    entry.situation,
    entry.automaticThought,
    entry.emotion,
    entry.evidenceFor,
    entry.evidenceAgainst,
    entry.balancedThought,
  ]
    .join('\n')
    .toLowerCase();
}

/** Midday, so no timezone shift can slide a day key onto its neighbour. */
function dayKeyToLocalDate(day: string): Date {
  const [year, month, date] = day.split('-').map(Number) as [
    number,
    number,
    number,
  ];
  return new Date(year, month - 1, date, 12);
}
