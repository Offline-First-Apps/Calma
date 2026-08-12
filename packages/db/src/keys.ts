/**
 * The key schema, in one place.
 *
 * See systems/02-data-layer.md § Key schema. Building these by hand at call
 * sites is how an index and a record end up disagreeing about where something
 * lives.
 */

export const META_SCHEMA_VERSION = 'meta:schemaVersion';

export const breathKey = (id: string): string => `breath:${id}`;
export const worryKey = (id: string): string => `worry:${id}`;
export const journalKey = (id: string): string => `journal:${id}`;

export const IDX_BREATH_DAYS = 'idx:breath:days';
export const idxBreathDay = (dayKey: string): string =>
  `idx:breath:day:${dayKey}`;

export const IDX_WORRY_PENDING = 'idx:worry:pending';
export const idxWorryDay = (dayKey: string): string => `idx:worry:day:${dayKey}`;

export const IDX_JOURNAL_DAYS = 'idx:journal:days';
export const idxJournalDay = (dayKey: string): string =>
  `idx:journal:day:${dayKey}`;

export const STATE_SESSION_ACTIVE = 'state:session:active';
export const STATE_WORRY_WINDOW = 'state:worryWindow';

/**
 * Day keys on which a worry window was carried through to the end.
 *
 * Added in session 7. The streak rule needs to know a window was *completed*,
 * and `state:worryWindow` is transient — it is gone the moment the window
 * closes. Deriving it from the worries themselves does not work either: a
 * window processes whatever was pending, which may all have been captured on
 * other days.
 */
export const IDX_WINDOW_COMPLETED = 'idx:window:completed';

export const aggWeek = (weekKey: string): string => `agg:week:${weekKey}`;
export const AGG_STREAK = 'agg:streak';

export const PREFS_KEY = 'prefs';

/** Record key prefixes, for the full scans that `repairIndexes` does. */
export const RECORD_PREFIXES = {
  breath: 'breath:',
  worry: 'worry:',
  journal: 'journal:',
} as const;

export type RecordKind = keyof typeof RECORD_PREFIXES;

/** The id half of a record key, or `null` if the key is not that kind. */
export function idFromKey(kind: RecordKind, key: string): string | null {
  const prefix = RECORD_PREFIXES[kind];
  return key.startsWith(prefix) ? key.slice(prefix.length) : null;
}
