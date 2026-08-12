import type { KeyValueStore } from '../../kv';

/**
 * Index maintenance.
 *
 * MMKV has no transactions, so ordering is the only guarantee available:
 * **write the record first, then the index.** A crash between the two leaves
 * an orphan record — invisible and harmless, cleaned up by `repairIndexes()` —
 * rather than a dangling index pointer, which is a crash on read.
 *
 * `writeRecordThenIndex` is the only sanctioned way to do a write that touches
 * both. See systems/02-data-layer.md § Index invariant.
 */

/** Reads an index, tolerating absence and corruption alike. */
export function readIndex(store: KeyValueStore, key: string): string[] {
  const raw = store.getString(key);
  if (raw === undefined) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    // A corrupt index is recoverable — every id in it is derivable from a key
    // scan. Losing it is a repair job, not a crash.
    return [];
  }
}

export function writeIndex(
  store: KeyValueStore,
  key: string,
  ids: readonly string[],
): void {
  store.set(key, JSON.stringify(ids));
}

export type IndexOrder = 'ascending' | 'descending';

/**
 * Adds an id to a sorted index, without duplicating it.
 *
 * Ids are ULID-style, so sorting them lexicographically sorts them by creation
 * time. That is why no index needs a stored timestamp.
 */
export function addToIndex(
  store: KeyValueStore,
  key: string,
  id: string,
  order: IndexOrder = 'ascending',
): void {
  const ids = readIndex(store, key);
  if (ids.includes(id)) return;

  ids.push(id);
  ids.sort();
  if (order === 'descending') ids.reverse();

  writeIndex(store, key, ids);
}

export function removeFromIndex(
  store: KeyValueStore,
  key: string,
  id: string,
): void {
  const ids = readIndex(store, key);
  const next = ids.filter((existing) => existing !== id);
  if (next.length === ids.length) return;

  writeIndex(store, key, next);
}

/** Whether an index currently points at an id. */
export function indexContains(
  store: KeyValueStore,
  key: string,
  id: string,
): boolean {
  return readIndex(store, key).includes(id);
}

/**
 * Writes a record and then its indexes, in that order, always.
 *
 * @param indexWrites run after the record lands. If one of them throws, the
 * record survives as an orphan — which is the failure we chose.
 */
export function writeRecordThenIndex(
  store: KeyValueStore,
  recordKey: string,
  record: unknown,
  indexWrites: () => void,
): void {
  store.set(recordKey, JSON.stringify(record));
  indexWrites();
}

/**
 * Removes a record and its index entries.
 *
 * The order reverses for deletion: **index first, then the record.** An
 * interruption then leaves an unreferenced record rather than an index
 * pointing at something that no longer exists.
 */
export function removeIndexThenRecord(
  store: KeyValueStore,
  recordKey: string,
  indexWrites: () => void,
): void {
  indexWrites();
  store.delete(recordKey);
}
