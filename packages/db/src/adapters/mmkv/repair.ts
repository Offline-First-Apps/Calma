import {
  breathingSessionSchema,
  dayKey,
  journalEntrySchema,
  worrySchema,
} from '@calma/domain';

import {
  IDX_BREATH_DAYS,
  IDX_JOURNAL_DAYS,
  IDX_WORRY_PENDING,
  RECORD_PREFIXES,
  breathKey,
  idFromKey,
  idxBreathDay,
  idxJournalDay,
  idxWorryDay,
  journalKey,
  worryKey,
} from '../../keys';
import type { KeyValueStore } from '../../kv';
import { writeIndex } from './indexes';
import { readRecord } from './validate';

/**
 * Rebuilds every index from a full key scan.
 *
 * Indexes are derived data — every id in one is recoverable from the records
 * themselves — so this can always run, and running it can only improve
 * matters. It runs on migration and from a hidden Settings row.
 *
 * Corrupt records are dropped as it goes: a record that cannot be parsed
 * cannot be indexed, and leaving a pointer to it would reintroduce the exact
 * crash-on-read this whole design avoids.
 */

export interface RepairReport {
  worries: number;
  journalEntries: number;
  breathingSessions: number;
  /** Record keys dropped for being unreadable. Keys only, never content. */
  dropped: string[];
}

export function repairIndexes(store: KeyValueStore): RepairReport {
  const report: RepairReport = {
    worries: 0,
    journalEntries: 0,
    breathingSessions: 0,
    dropped: [],
  };

  const keys = store.getAllKeys();

  const worryPending: string[] = [];
  const worryDays = new Map<string, string[]>();

  const journalDays = new Map<string, string[]>();
  const breathDays = new Map<string, string[]>();

  const push = (map: Map<string, string[]>, day: string, id: string): void => {
    const ids = map.get(day) ?? [];
    ids.push(id);
    map.set(day, ids);
  };

  for (const key of keys) {
    if (key.startsWith(RECORD_PREFIXES.worry)) {
      const id = idFromKey('worry', key);
      const worry = id === null ? null : readRecord(store, key, worrySchema);
      if (!worry || id === null) {
        report.dropped.push(key);
        store.delete(key);
        continue;
      }

      report.worries += 1;
      if (worry.status === 'pending') worryPending.push(id);
      push(worryDays, dayKey(new Date(worry.capturedAt)), id);
      continue;
    }

    if (key.startsWith(RECORD_PREFIXES.journal)) {
      const id = idFromKey('journal', key);
      const entry = id === null
        ? null
        : readRecord(store, key, journalEntrySchema);
      if (!entry || id === null) {
        report.dropped.push(key);
        store.delete(key);
        continue;
      }

      report.journalEntries += 1;
      push(journalDays, dayKey(new Date(entry.createdAt)), id);
      continue;
    }

    if (key.startsWith(RECORD_PREFIXES.breath)) {
      const id = idFromKey('breath', key);
      const session = id === null
        ? null
        : readRecord(store, key, breathingSessionSchema);
      if (!session || id === null) {
        report.dropped.push(key);
        store.delete(key);
        continue;
      }

      report.breathingSessions += 1;
      push(breathDays, dayKey(new Date(session.startedAt)), id);
    }
  }

  // Clear every existing index before writing, so a stale day index left over
  // from a deleted record does not survive the repair.
  for (const key of keys) {
    if (key.startsWith('idx:')) store.delete(key);
  }

  writeIndex(store, IDX_WORRY_PENDING, worryPending.sort());
  for (const [day, ids] of worryDays) {
    writeIndex(store, idxWorryDay(day), ids.sort());
  }

  writeIndex(
    store,
    IDX_JOURNAL_DAYS,
    [...journalDays.keys()].sort().reverse(),
  );
  for (const [day, ids] of journalDays) {
    writeIndex(store, idxJournalDay(day), ids.sort());
  }

  writeIndex(store, IDX_BREATH_DAYS, [...breathDays.keys()].sort().reverse());
  for (const [day, ids] of breathDays) {
    writeIndex(store, idxBreathDay(day), ids.sort());
  }

  return report;
}

/** Key builders, exported so the repair suite can assert against them. */
export const recordKeyFor = {
  worry: worryKey,
  journal: journalKey,
  breath: breathKey,
} as const;
