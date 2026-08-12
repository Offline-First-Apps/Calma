import { type Worry, dayKey, newId, worrySchema } from '@calma/domain';

import { IDX_WORRY_PENDING, idxWorryDay, worryKey } from '../../keys';
import type { KeyValueStore } from '../../kv';
import type { NewWorry, WorryRepo } from '../../ports/worry.repo';
import {
  addToIndex,
  readIndex,
  removeFromIndex,
  removeIndexThenRecord,
  writeIndex,
  writeRecordThenIndex,
} from './indexes';
import { readRecord, readRecords } from './validate';

export interface WorryRepoOptions {
  now?: () => number;
  createId?: () => string;
}

export function createWorryRepo(
  store: KeyValueStore,
  options: WorryRepoOptions = {},
): WorryRepo {
  const now = options.now ?? (() => Date.now());
  const createId = options.createId ?? newId;

  /** Reads ids, drops anything corrupt, and prunes the index that named it. */
  function readThrough(indexKey: string): Worry[] {
    const ids = readIndex(store, indexKey);
    const { records, dropped } = readRecords(store, ids, worryKey, worrySchema);

    if (dropped.length > 0) {
      writeIndex(
        store,
        indexKey,
        ids.filter((id) => !dropped.includes(id)),
      );
    }

    return records;
  }

  function save(worry: Worry): void {
    store.set(worryKey(worry.id), JSON.stringify(worry));
  }

  return {
    async create(input: NewWorry) {
      const capturedAt = input.capturedAt ?? now();
      const worry: Worry = {
        id: createId(),
        text: input.text,
        capturedAt,
        status: 'pending',
        resolvedAt: null,
        actionText: null,
      };

      const day = idxWorryDay(dayKey(new Date(capturedAt)));

      writeRecordThenIndex(store, worryKey(worry.id), worry, () => {
        // Ascending: ids sort by creation time, so the pending list comes back
        // oldest first without storing an order anywhere.
        addToIndex(store, IDX_WORRY_PENDING, worry.id);
        addToIndex(store, day, worry.id);
      });

      return worry;
    },

    async get(id) {
      return readRecord(store, worryKey(id), worrySchema);
    },

    async listPending() {
      return readThrough(IDX_WORRY_PENDING);
    },

    async listByDay(day) {
      return readThrough(idxWorryDay(day));
    },

    async countCapturedOn(day) {
      // Counted from the index rather than from a stored counter, so there is
      // nothing that can drift out of sync with the records themselves.
      return readThrough(idxWorryDay(day)).length;
    },

    async markProcessed(id, actionText) {
      const worry = readRecord(store, worryKey(id), worrySchema);
      if (!worry) return;

      save({
        ...worry,
        status: 'processed',
        resolvedAt: now(),
        actionText,
      });
      removeFromIndex(store, IDX_WORRY_PENDING, id);
    },

    async markReleased(id) {
      const worry = readRecord(store, worryKey(id), worrySchema);
      if (!worry) return;

      // The record stays, so the day's summary can still say how many were
      // let go. What leaves is the pending list — nothing is waiting anymore.
      save({
        ...worry,
        status: 'released',
        resolvedAt: now(),
        actionText: null,
      });
      removeFromIndex(store, IDX_WORRY_PENDING, id);
    },

    async delete(id) {
      const worry = readRecord(store, worryKey(id), worrySchema);

      removeIndexThenRecord(store, worryKey(id), () => {
        removeFromIndex(store, IDX_WORRY_PENDING, id);
        if (worry) {
          removeFromIndex(
            store,
            idxWorryDay(dayKey(new Date(worry.capturedAt))),
            id,
          );
        }
      });
    },
  };
}
