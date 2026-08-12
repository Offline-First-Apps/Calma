import { META_SCHEMA_VERSION } from '../keys';
import type { Stores } from '../kv';

/**
 * Forward-only migrations.
 *
 * Each one is idempotent and runs inside its own version step. A migration
 * that throws leaves the version unincremented and reports a failure — the app
 * then boots read-only rather than continuing on top of half-migrated data.
 * Destroying someone's journal to recover from a bad release is not a trade
 * available to us (systems/02-data-layer.md § Migrations).
 */

export interface Migration {
  version: number;
  up: (stores: Stores) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    // The initial schema. Nothing to move: this exists so a store written by
    // the first release is recognisably at version 1 rather than at zero.
    up: () => {},
  },
];

export const LATEST_VERSION = migrations.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0,
);

export type MigrationResult =
  | { ok: true; from: number; to: number }
  | { ok: false; from: number; failedAt: number; error: string };

export function readSchemaVersion(stores: Stores): number {
  const raw = stores.data.getString(META_SCHEMA_VERSION);
  if (raw === undefined) return 0;

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function runMigrations(
  stores: Stores,
  toRun: readonly Migration[] = migrations,
): MigrationResult {
  const from = readSchemaVersion(stores);
  let current = from;

  const pending = [...toRun]
    .filter((migration) => migration.version > from)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    try {
      migration.up(stores);
    } catch (error) {
      // The version stays where it was, so the next boot retries this same
      // step rather than skipping it.
      return {
        ok: false,
        from,
        failedAt: migration.version,
        error: error instanceof Error ? error.message : 'unknown failure',
      };
    }

    current = migration.version;
    stores.data.set(META_SCHEMA_VERSION, String(current));
  }

  return { ok: true, from, to: current };
}
