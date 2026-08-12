import type { z } from 'zod';

import type { KeyValueStore } from '../../kv';

/**
 * Reading, with the assumption that a record might be wrong.
 *
 * Every record is parsed with its schema on read. One malformed journal entry
 * must never take down the Progress tab, so a failure drops the record from
 * the returned collection and de-indexes it rather than throwing.
 *
 * **The key is recorded, never the content.** The content is someone's private
 * writing; it does not belong in a log, a crash report, or a dev buffer.
 */

export interface CorruptionEvent {
  key: string;
  reason: 'unparseable' | 'invalid-shape';
}

/** Dev-only, in memory, bounded. Never persisted, never sent anywhere. */
const buffer: CorruptionEvent[] = [];
const BUFFER_LIMIT = 50;

export function recordCorruption(event: CorruptionEvent): void {
  buffer.push(event);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();
}

export function corruptionEvents(): readonly CorruptionEvent[] {
  return [...buffer];
}

export function clearCorruptionEvents(): void {
  buffer.length = 0;
}

/**
 * Reads and validates one record.
 *
 * @returns the record, or `null` if it is absent, unparseable, or the wrong
 * shape. The caller cannot tell the three apart, and should not need to.
 */
export function readRecord<T>(
  store: KeyValueStore,
  key: string,
  schema: z.ZodType<T>,
): T | null {
  const raw = store.getString(key);
  if (raw === undefined) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    recordCorruption({ key, reason: 'unparseable' });
    return null;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    recordCorruption({ key, reason: 'invalid-shape' });
    return null;
  }

  return result.data;
}

/**
 * Reads many records by id, dropping the bad ones and reporting which.
 *
 * The caller uses `dropped` to prune the index it read the ids from, so a
 * corrupt record is only ever seen once.
 */
export function readRecords<T>(
  store: KeyValueStore,
  ids: readonly string[],
  keyFor: (id: string) => string,
  schema: z.ZodType<T>,
): { records: T[]; dropped: string[] } {
  const records: T[] = [];
  const dropped: string[] = [];

  for (const id of ids) {
    const record = readRecord(store, keyFor(id), schema);
    if (record === null) dropped.push(id);
    else records.push(record);
  }

  return { records, dropped };
}
