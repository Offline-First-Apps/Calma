import {
  type BreathingSession,
  breathingSessionSchema,
  dayKey,
  newId,
} from '@calma/domain';

import { IDX_BREATH_DAYS, breathKey, idxBreathDay } from '../../keys';
import type { KeyValueStore } from '../../kv';
import type {
  BreathingRepo,
  BreathingStats,
  NewBreathingSession,
} from '../../ports/breathing.repo';
import {
  addToIndex,
  readIndex,
  removeFromIndex,
  removeIndexThenRecord,
  writeIndex,
  writeRecordThenIndex,
} from './indexes';
import { readRecord, readRecords } from './validate';

export interface BreathingRepoOptions {
  createId?: () => string;
}

export function createBreathingRepo(
  store: KeyValueStore,
  options: BreathingRepoOptions = {},
): BreathingRepo {
  const createId = options.createId ?? newId;

  function readDay(day: string): BreathingSession[] {
    const key = idxBreathDay(day);
    const ids = readIndex(store, key);
    const { records, dropped } = readRecords(
      store,
      ids,
      breathKey,
      breathingSessionSchema,
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

  return {
    async create(input: NewBreathingSession) {
      const session: BreathingSession = breathingSessionSchema.parse({
        ...input,
        id: createId(),
      });

      const day = dayKey(new Date(session.startedAt));

      writeRecordThenIndex(store, breathKey(session.id), session, () => {
        addToIndex(store, idxBreathDay(day), session.id);
        addToIndex(store, IDX_BREATH_DAYS, day, 'descending');
      });

      return session;
    },

    async get(id) {
      return readRecord(store, breathKey(id), breathingSessionSchema);
    },

    async listByDay(day) {
      return readDay(day);
    },

    async listDays(limit) {
      const days = readIndex(store, IDX_BREATH_DAYS);
      return limit === undefined ? days : days.slice(0, limit);
    },

    async statsForDays(dayKeys): Promise<BreathingStats> {
      const sessions = dayKeys.flatMap((day) => readDay(day));

      // A skipped rating is absent, not zero. Averaging `null` as 0 would say
      // that someone who declined to rate was perfectly calm, which would
      // flatter every number on the Progress tab (D-007).
      const rated = sessions
        .map((s) => s.preSuds)
        .filter((suds): suds is number => suds !== null);

      return {
        sessions: sessions.length,
        totalSeconds: sessions.reduce((sum, s) => sum + s.durationSec, 0),
        averagePreSuds: rated.length === 0
          ? null
          : rated.reduce((sum, suds) => sum + suds, 0) / rated.length,
        improvedCount: sessions.filter((s) => s.postFeeling === 'better').length,
      };
    },

    async delete(id) {
      const session = readRecord(store, breathKey(id), breathingSessionSchema);

      removeIndexThenRecord(store, breathKey(id), () => {
        if (!session) return;

        const day = dayKey(new Date(session.startedAt));
        removeFromIndex(store, idxBreathDay(day), id);

        if (readIndex(store, idxBreathDay(day)).length <= 1) {
          removeFromIndex(store, IDX_BREATH_DAYS, day);
        }
      });
    },
  };
}
