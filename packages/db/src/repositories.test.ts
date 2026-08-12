import { createIdFactory, defaultPrefs } from '@calma/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  EMPTY_WEEK,
  daysInWeek,
  markWorryWindowCompleted,
  readStreak,
  readWeekAggregate,
  recomputeStreak,
  recomputeWeek,
} from './adapters/mmkv/aggregates';
import { readIndex } from './adapters/mmkv/indexes';
import { repairIndexes } from './adapters/mmkv/repair';
import { clearCorruptionEvents, corruptionEvents } from './adapters/mmkv/validate';
import { createRepositories, type Repositories } from './index';
import {
  IDX_JOURNAL_DAYS,
  IDX_WORRY_PENDING,
  META_SCHEMA_VERSION,
  idxWorryDay,
  journalKey,
  worryKey,
} from './keys';
import { MemoryStore, createMemoryStores } from './kv';
import { runMigrations, type Migration } from './migrations/index';

const AT = (y: number, m: number, d: number, h = 12): number =>
  new Date(y, m - 1, d, h).getTime();

let stores: ReturnType<typeof createMemoryStores>;
let repos: Repositories;
let clock: number;

beforeEach(() => {
  clearCorruptionEvents();
  stores = createMemoryStores();
  clock = AT(2026, 8, 12, 9);
  repos = createRepositories(stores, {
    now: () => clock,
    // A fixed clock means the shared id factory would collide across tests
    // if it were not also fresh each time.
    createId: createIdFactory({ now: () => clock }),
  });
});

const draft = {
  situation: '',
  automaticThought: '',
  emotion: '',
  emotionIntensity: 0,
  evidenceFor: '',
  evidenceAgainst: '',
  balancedThought: '',
  emotionIntensityAfter: null,
  isDraft: true,
  linkedSessionId: null,
};

const saved = { ...draft, isDraft: false };

const session = {
  pattern: '4-7-8' as const,
  entryPoint: 'breathe-tab' as const,
  startedAt: AT(2026, 8, 12, 9),
  durationSec: 180,
  cyclesCompleted: 9,
  preSuds: 7,
  postFeeling: 'better' as const,
  completed: true,
};

describe('WorryRepo', () => {
  it('captures a worry as pending', async () => {
    const worry = await repos.worry.create({ text: 'The meeting.' });

    expect(worry.status).toBe('pending');
    expect(worry.resolvedAt).toBeNull();
    expect(worry.actionText).toBeNull();
    expect(await repos.worry.get(worry.id)).toEqual(worry);
  });

  it('lists pending worries oldest first', async () => {
    const first = await repos.worry.create({ text: 'one' });
    clock += 1000;
    const second = await repos.worry.create({ text: 'two' });
    clock += 1000;
    const third = await repos.worry.create({ text: 'three' });

    const pending = await repos.worry.listPending();
    expect(pending.map((w) => w.id)).toEqual([first.id, second.id, third.id]);
  });

  it('counts captures by the day they were captured', async () => {
    await repos.worry.create({ text: 'a', capturedAt: AT(2026, 8, 12, 8) });
    await repos.worry.create({ text: 'b', capturedAt: AT(2026, 8, 12, 20) });
    await repos.worry.create({ text: 'c', capturedAt: AT(2026, 8, 11, 20) });

    expect(await repos.worry.countCapturedOn('2026-08-12')).toBe(2);
    expect(await repos.worry.countCapturedOn('2026-08-11')).toBe(1);
    expect(await repos.worry.countCapturedOn('2026-08-10')).toBe(0);
  });

  it('leaves the pending list when a worry is processed', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    clock += 1000;
    await repos.worry.markProcessed(worry.id, 'Send the email.');

    const stored = await repos.worry.get(worry.id);
    expect(stored?.status).toBe('processed');
    expect(stored?.actionText).toBe('Send the email.');
    expect(stored?.resolvedAt).toBe(clock);
    expect(await repos.worry.listPending()).toEqual([]);
  });

  it('leaves the pending list when a worry is released', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    await repos.worry.markReleased(worry.id);

    expect((await repos.worry.get(worry.id))?.status).toBe('released');
    expect(await repos.worry.listPending()).toEqual([]);
    // The record stays so the day's summary can still count it. Only the
    // waiting stops.
    expect(await repos.worry.listByDay('2026-08-12')).toHaveLength(1);
  });

  it('hard-deletes, leaving nothing behind', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    await repos.worry.delete(worry.id);

    expect(await repos.worry.get(worry.id)).toBeNull();
    expect(stores.data.getString(worryKey(worry.id))).toBeUndefined();
    expect(readIndex(stores.data, IDX_WORRY_PENDING)).toEqual([]);
    expect(readIndex(stores.data, idxWorryDay('2026-08-12'))).toEqual([]);
  });

  it('does nothing when asked to resolve a worry that is gone', async () => {
    await expect(
      repos.worry.markProcessed('nope', 'x'),
    ).resolves.toBeUndefined();
    await expect(repos.worry.markReleased('nope')).resolves.toBeUndefined();
  });
});

describe('the index invariant', () => {
  it('leaves an orphan record, not a dangling pointer, when a write dies', async () => {
    // MMKV has no transactions. The only guarantee available is ordering:
    // record first, index second. An orphan is invisible and repairable; a
    // pointer to a record that was never written is a crash on read.
    const store = new MemoryStore();
    const repo = createRepositories(
      { data: store, prefs: new MemoryStore(), cache: new MemoryStore() },
      { now: () => clock, createId: createIdFactory({ now: () => clock }) },
    ).worry;

    store.failWritesAfter(1); // the record lands, the index write throws

    await expect(repo.create({ text: 'interrupted' })).rejects.toThrow();

    const recordKeys = store
      .getAllKeys()
      .filter((key) => key.startsWith('worry:'));
    expect(recordKeys).toHaveLength(1);
    expect(readIndex(store, IDX_WORRY_PENDING)).toEqual([]);
  });

  it('recovers the orphan on repair', async () => {
    const store = new MemoryStore();
    const stores2 = {
      data: store,
      prefs: new MemoryStore(),
      cache: new MemoryStore(),
    };
    const repo = createRepositories(stores2, {
      now: () => clock,
      createId: createIdFactory({ now: () => clock }),
    }).worry;

    store.failWritesAfter(1);
    await expect(repo.create({ text: 'interrupted' })).rejects.toThrow();

    store.failWritesAfter(Number.POSITIVE_INFINITY); // storage comes back
    const report = repairIndexes(store);
    expect(report.worries).toBe(1);
    expect(readIndex(store, IDX_WORRY_PENDING)).toHaveLength(1);
    expect(await repo.listPending()).toHaveLength(1);
  });
});

describe('JournalRepo', () => {
  it('keeps drafts out of the week list', async () => {
    await repos.journal.create({ ...saved, situation: 'kept' });
    await repos.journal.create({ ...draft, situation: 'half a thought' });

    const week = await repos.journal.listByWeek('2026-W33');
    expect(week).toHaveLength(1);
    expect(week[0]?.situation).toBe('kept');

    const drafts = await repos.journal.listDrafts();
    expect(drafts).toHaveLength(1);
  });

  it('updates without moving the entry to another day', async () => {
    const entry = await repos.journal.create({ ...draft });
    clock += 60_000;

    const updated = await repos.journal.update(entry.id, {
      isDraft: false,
      situation: 'finished',
    });

    expect(updated.createdAt).toBe(entry.createdAt);
    expect(updated.updatedAt).toBe(clock);
    expect(readIndex(stores.data, IDX_JOURNAL_DAYS)).toEqual(['2026-08-12']);
  });

  it('refuses to update something that does not exist', async () => {
    await expect(repos.journal.update('nope', {})).rejects.toThrow();
  });

  it('searches case-insensitively, newest first', async () => {
    await repos.journal.create({
      ...saved,
      situation: 'The Meeting went badly',
      createdAt: AT(2026, 8, 10),
    });
    clock += 1000;
    await repos.journal.create({
      ...saved,
      balancedThought: 'the meeting was fine',
      createdAt: AT(2026, 8, 12),
    });
    clock += 1000;
    await repos.journal.create({ ...saved, situation: 'unrelated' });

    const hits = await repos.journal.search('MEETING');
    expect(hits).toHaveLength(2);
    expect(hits[0]?.createdAt).toBeGreaterThan(hits[1]?.createdAt ?? 0);
  });

  it('returns nothing for an empty search', async () => {
    await repos.journal.create({ ...saved, situation: 'something' });
    expect(await repos.journal.search('   ')).toEqual([]);
  });

  it('pages newest first', async () => {
    for (const day of [10, 11, 12]) {
      clock += 1000;
      await repos.journal.create({ ...saved, createdAt: AT(2026, 8, day) });
    }

    const page = await repos.journal.listPaged({ days: 2 });
    expect(page.entries).toHaveLength(2);
    expect(page.cursor).toBe('2026-08-11');

    const next = await repos.journal.listPaged({ days: 2, before: page.cursor! });
    expect(next.entries).toHaveLength(1);
    expect(next.cursor).toBeNull();
  });

  it('drops a day from the day index once it is empty', async () => {
    const entry = await repos.journal.create({ ...saved });
    await repos.journal.delete(entry.id);

    expect(readIndex(stores.data, IDX_JOURNAL_DAYS)).toEqual([]);
    expect(await repos.journal.search('anything')).toEqual([]);
  });
});

describe('BreathingRepo', () => {
  it('records everything a session was', async () => {
    const created = await repos.breathing.create(session);

    expect(created.pattern).toBe('4-7-8');
    expect(created.entryPoint).toBe('breathe-tab');
    expect(created.cyclesCompleted).toBe(9);
    expect(created.completed).toBe(true);
    expect(await repos.breathing.listByDay('2026-08-12')).toHaveLength(1);
    expect(await repos.breathing.listDays()).toEqual(['2026-08-12']);
  });

  it('excludes a skipped rating from the average rather than counting it as 0', async () => {
    clock += 1;
    await repos.breathing.create({ ...session, preSuds: 8 });
    clock += 1;
    await repos.breathing.create({ ...session, preSuds: 6 });
    clock += 1;
    await repos.breathing.create({ ...session, preSuds: null });

    const stats = await repos.breathing.statsForDays(['2026-08-12']);
    expect(stats.sessions).toBe(3);
    // 7, not 4.67 — "I'd rather not say" is not "completely calm".
    expect(stats.averagePreSuds).toBe(7);
  });

  it('reports no average at all when nobody rated', async () => {
    await repos.breathing.create({ ...session, preSuds: null });
    const stats = await repos.breathing.statsForDays(['2026-08-12']);
    expect(stats.averagePreSuds).toBeNull();
  });

  it('counts sessions that helped', async () => {
    clock += 1;
    await repos.breathing.create({ ...session, postFeeling: 'better' });
    clock += 1;
    await repos.breathing.create({ ...session, postFeeling: 'same' });

    const stats = await repos.breathing.statsForDays(['2026-08-12']);
    expect(stats.improvedCount).toBe(1);
    expect(stats.totalSeconds).toBe(360);
  });
});

describe('PrefsRepo', () => {
  it('returns defaults before anything is stored', async () => {
    expect(await repos.prefs.get()).toEqual(defaultPrefs);
  });

  it('round-trips every field', async () => {
    const patch = {
      name: 'Sam',
      locale: 'pt-BR',
      worryWindowTime: '21:30',
      worryWindowMinutes: 30 as const,
      customRatio: [4, 7, 8, 0] as [number, number, number, number],
      orbTheme: 'wave' as const,
      theme: 'dark' as const,
      soundEnabled: false,
      hapticsEnabled: false,
      onboardingCompletedAt: clock,
      onboardingEscaped: true,
      onboardingReOffered: true,
      onboardingAnswers: { why: ['night'], when: ['late'], helped: [] },
      notificationsAsked: true,
    };

    await repos.prefs.set(patch);
    expect(await repos.prefs.get()).toEqual({ ...defaultPrefs, ...patch });
  });

  it('merges a patch instead of replacing everything', async () => {
    await repos.prefs.set({ name: 'Sam' });
    await repos.prefs.set({ theme: 'dark' });

    const prefs = await repos.prefs.get();
    expect(prefs.name).toBe('Sam');
    expect(prefs.theme).toBe('dark');
  });

  it('keeps the settings it can when one field goes bad', async () => {
    await repos.prefs.set({ name: 'Sam', theme: 'dark' });

    const stored = JSON.parse(stores.prefs.getString('prefs') ?? '{}');
    stores.prefs.set(
      'prefs',
      JSON.stringify({ ...stored, worryWindowTime: 'half seven' }),
    );

    const prefs = await repos.prefs.get();
    expect(prefs.name).toBe('Sam');
    expect(prefs.theme).toBe('dark');
    expect(prefs.worryWindowTime).toBe(defaultPrefs.worryWindowTime);
    expect(corruptionEvents().map((e) => e.key)).toContain('prefs');
  });

  it('ignores a key it has never heard of', async () => {
    stores.prefs.set(
      'prefs',
      JSON.stringify({ ...defaultPrefs, favouriteColour: 'amber' }),
    );

    const prefs = await repos.prefs.get();
    expect(prefs).toEqual(defaultPrefs);
    expect('favouriteColour' in prefs).toBe(false);
  });

  it('falls back to defaults when the whole thing is unreadable', async () => {
    stores.prefs.set('prefs', 'not json at all');
    expect(await repos.prefs.get()).toEqual(defaultPrefs);
  });

  it('resets to first-launch state', async () => {
    await repos.prefs.set({ name: 'Sam', theme: 'dark' });
    expect(await repos.prefs.reset()).toEqual(defaultPrefs);
    expect(await repos.prefs.get()).toEqual(defaultPrefs);
  });
});

describe('corruption', () => {
  it('drops a bad record from a collection rather than throwing', async () => {
    const good = await repos.worry.create({ text: 'fine' });
    clock += 1000;
    const bad = await repos.worry.create({ text: 'about to break' });

    stores.data.set(worryKey(bad.id), '{ not json');

    const pending = await repos.worry.listPending();
    expect(pending.map((w) => w.id)).toEqual([good.id]);
  });

  it('de-indexes the bad record so it is only met once', async () => {
    const bad = await repos.worry.create({ text: 'x' });
    stores.data.set(worryKey(bad.id), '{ not json');

    await repos.worry.listPending();
    expect(readIndex(stores.data, IDX_WORRY_PENDING)).toEqual([]);
  });

  it('logs the key and never the content', async () => {
    const entry = await repos.journal.create({
      ...saved,
      situation: 'something private',
    });
    stores.data.set(journalKey(entry.id), JSON.stringify({ id: entry.id }));

    await repos.journal.listByWeek('2026-W33');

    const events = corruptionEvents();
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.key).toContain('journal:');
      expect(JSON.stringify(event)).not.toContain('something private');
    }
  });

  it('survives one broken entry without losing the rest of the tab', async () => {
    const keep = await repos.journal.create({ ...saved, situation: 'keep me' });
    clock += 1000;
    const lose = await repos.journal.create({ ...saved, situation: 'lose me' });
    stores.data.set(journalKey(lose.id), 'corrupt');

    const week = await repos.journal.listByWeek('2026-W33');
    expect(week.map((e) => e.id)).toEqual([keep.id]);
  });
});

describe('repairIndexes', () => {
  it('rebuilds every index from the records', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    clock += 1000;
    await repos.journal.create({ ...saved });
    clock += 1000;
    await repos.breathing.create(session);

    // Wreck every index.
    for (const key of stores.data.getAllKeys()) {
      if (key.startsWith('idx:')) stores.data.delete(key);
    }
    expect(await repos.worry.listPending()).toEqual([]);

    const report = repairIndexes(stores.data);
    expect(report).toMatchObject({
      worries: 1,
      journalEntries: 1,
      breathingSessions: 1,
      dropped: [],
    });
    expect((await repos.worry.listPending()).map((w) => w.id)).toEqual([
      worry.id,
    ]);
    expect(await repos.journal.listByWeek('2026-W33')).toHaveLength(1);
    expect(await repos.breathing.listDays()).toEqual(['2026-08-12']);
  });

  it('does not re-index a worry that is no longer pending', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    await repos.worry.markReleased(worry.id);

    repairIndexes(stores.data);
    expect(await repos.worry.listPending()).toEqual([]);
    expect(await repos.worry.listByDay('2026-08-12')).toHaveLength(1);
  });

  it('drops unreadable records and reports their keys', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    stores.data.set(worryKey(worry.id), 'corrupt');

    const report = repairIndexes(stores.data);
    expect(report.worries).toBe(0);
    expect(report.dropped).toEqual([worryKey(worry.id)]);
    expect(stores.data.getString(worryKey(worry.id))).toBeUndefined();
  });

  it('clears a stale index left over from a deleted record', async () => {
    stores.data.set('idx:worry:day:2020-01-01', JSON.stringify(['ghost']));
    repairIndexes(stores.data);
    expect(readIndex(stores.data, 'idx:worry:day:2020-01-01')).toEqual([]);
  });
});

describe('migrations', () => {
  it('runs forward from zero and records the version', () => {
    const result = runMigrations(stores);
    expect(result).toEqual({ ok: true, from: 0, to: 1 });
    expect(stores.data.getString(META_SCHEMA_VERSION)).toBe('1');
  });

  it('is idempotent', () => {
    runMigrations(stores);
    const again = runMigrations(stores);
    expect(again).toEqual({ ok: true, from: 1, to: 1 });
  });

  it('runs each pending step once, in order', () => {
    const seen: number[] = [];
    const set: Migration[] = [
      { version: 1, up: () => void seen.push(1) },
      { version: 2, up: () => void seen.push(2) },
      { version: 3, up: () => void seen.push(3) },
    ];

    expect(runMigrations(stores, set)).toEqual({ ok: true, from: 0, to: 3 });
    expect(seen).toEqual([1, 2, 3]);

    runMigrations(stores, set);
    expect(seen).toEqual([1, 2, 3]);
  });

  it('leaves the version unincremented when a step throws', () => {
    const set: Migration[] = [
      { version: 1, up: () => {} },
      {
        version: 2,
        up: () => {
          throw new Error('bad migration');
        },
      },
    ];

    const result = runMigrations(stores, set);
    expect(result).toEqual({
      ok: false,
      from: 0,
      failedAt: 2,
      error: 'bad migration',
    });
    // Version 1 landed and stuck; 2 did not. The next boot retries 2 rather
    // than skipping it, and nothing was destroyed to get here.
    expect(stores.data.getString(META_SCHEMA_VERSION)).toBe('1');
  });

  it('treats a nonsense version as zero', () => {
    stores.data.set(META_SCHEMA_VERSION, 'banana');
    expect(runMigrations(stores).from).toBe(0);
  });
});

describe('aggregates', () => {
  it('lists the seven days of an ISO week', () => {
    expect(daysInWeek('2026-W33')).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
      '2026-08-15',
      '2026-08-16',
    ]);
    // Week 1 of 2026 starts in December 2025.
    expect(daysInWeek('2026-W01')[0]).toBe('2025-12-29');
  });

  it('returns an empty week before anything happens', () => {
    expect(readWeekAggregate(stores.data, '2026-W33')).toEqual(EMPTY_WEEK);
  });

  it('recomputes a week from the records', async () => {
    const worry = await repos.worry.create({ text: 'a' });
    clock += 1000;
    await repos.worry.markProcessed(worry.id, 'do the thing');
    clock += 1000;
    const released = await repos.worry.create({ text: 'b' });
    clock += 1000;
    await repos.worry.markReleased(released.id);
    clock += 1000;
    await repos.journal.create({ ...saved });
    clock += 1000;
    await repos.breathing.create(session);

    const week = await recomputeWeek(stores.data, '2026-W33', repos);

    expect(week).toEqual({
      sessions: 1,
      totalMinutes: 3,
      worriesProcessed: 1,
      worriesReleased: 1,
      journalEntries: 1,
      avgPreSuds: 7,
      improvedCount: 1,
    });
    expect(readWeekAggregate(stores.data, '2026-W33')).toEqual(week);
  });

  it('counts a day for a saved entry, and not for a draft', async () => {
    await repos.journal.create({ ...draft });
    let streak = await recomputeStreak(
      stores.data,
      repos.journal,
      new Date(AT(2026, 8, 12)),
    );
    expect(streak.current).toBe(0);

    clock += 1000;
    await repos.journal.create({ ...saved });
    streak = await recomputeStreak(
      stores.data,
      repos.journal,
      new Date(AT(2026, 8, 12)),
    );
    expect(streak.current).toBe(1);
  });

  it('counts a day for a completed worry window', async () => {
    markWorryWindowCompleted(stores.data, '2026-08-11');
    markWorryWindowCompleted(stores.data, '2026-08-12');

    const streak = await recomputeStreak(
      stores.data,
      repos.journal,
      new Date(AT(2026, 8, 12)),
    );
    expect(streak.current).toBe(2);
    expect(readStreak(stores.data)).toEqual(streak);
  });

  it('does not count breathing alone', async () => {
    await repos.breathing.create(session);

    const streak = await recomputeStreak(
      stores.data,
      repos.journal,
      new Date(AT(2026, 8, 12)),
    );
    expect(streak.current).toBe(0);
  });

  it('counts a day once when it qualified twice', async () => {
    await repos.journal.create({ ...saved });
    markWorryWindowCompleted(stores.data, '2026-08-12');

    const streak = await recomputeStreak(
      stores.data,
      repos.journal,
      new Date(AT(2026, 8, 12)),
    );
    expect(streak.current).toBe(1);
  });

  it('breaks a streak after a missed day', async () => {
    markWorryWindowCompleted(stores.data, '2026-08-08');
    markWorryWindowCompleted(stores.data, '2026-08-09');

    const streak = await recomputeStreak(
      stores.data,
      repos.journal,
      new Date(AT(2026, 8, 12)),
    );
    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(2);
  });
});

describe('createRepositories', () => {
  it('returns all four repositories', () => {
    expect(Object.keys(repos).sort()).toEqual([
      'breathing',
      'journal',
      'prefs',
      'worry',
    ]);
  });

  it('keeps prefs in their own store, away from the data', async () => {
    await repos.prefs.set({ name: 'Sam' });
    await repos.worry.create({ text: 'a' });

    expect(stores.prefs.getAllKeys()).toEqual(['prefs']);
    expect(stores.data.getAllKeys().some((k) => k.startsWith('worry:'))).toBe(
      true,
    );
    expect(stores.cache.getAllKeys()).toEqual([]);
  });
});
