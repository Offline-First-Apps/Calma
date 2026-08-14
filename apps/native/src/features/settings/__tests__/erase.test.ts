import { MemoryStore, createRepositories } from '@calma/db';
import { defaultPrefs } from '@calma/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import { countEverything, eraseEverything } from '../erase';
import { addMinutes, windowRange } from '../windowRange';

/** The minimum a schema will accept. Content is irrelevant to these tests. */
const anEntry = () => ({
  situation: 'something private',
  automaticThought: '',
  emotion: '',
  emotionIntensity: 5,
  evidenceFor: '',
  evidenceAgainst: '',
  balancedThought: '',
  emotionIntensityAfter: null,
  isDraft: false,
  linkedSessionId: null,
  updatedAt: Date.now(),
});

const aWorry = () => ({
  text: 'a worry',
  capturedAt: Date.now(),
  status: 'pending' as const,
  resolvedAt: null,
  actionText: null,
});

function freshStores() {
  return {
    data: new MemoryStore(),
    prefs: new MemoryStore(),
    cache: new MemoryStore(),
  };
}

describe('eraseEverything', () => {
  let stores: ReturnType<typeof freshStores>;
  let repositories: ReturnType<typeof createRepositories>;

  beforeEach(async () => {
    stores = freshStores();
    repositories = createRepositories(stores);

    await repositories.journal.create(anEntry());
    await repositories.worry.create(aWorry());
    stores.cache.set('entitlement', '{"tier":"plus"}');
  });

  /**
   * The promise the screen makes, and the only one that matters. If this
   * assertion ever weakens, someone who pressed "Delete everything" has been
   * lied to.
   */
  it('leaves no user content in any of the three stores', async () => {
    await eraseEverything({ stores, repositories, resetStores: () => undefined });

    const leftover = [
      ...stores.data.getAllKeys(),
      ...stores.cache.getAllKeys(),
    ];
    expect(leftover).toEqual([]);
  });

  it('clears the unencrypted cache too, not just the encrypted stores', async () => {
    await eraseEverything({ stores, repositories, resetStores: () => undefined });
    expect(stores.cache.getAllKeys()).toEqual([]);
  });

  /**
   * Re-seeded, not left absent. An empty prefs record is not a first launch:
   * every reader would fall back individually and onboarding would not
   * reliably re-run.
   */
  it('returns prefs to their first-launch values', async () => {
    await repositories.prefs.set({ name: 'Sam', soundEnabled: false });
    await eraseEverything({ stores, repositories, resetStores: () => undefined });

    expect(await repositories.prefs.get()).toEqual(defaultPrefs);
  });

  it('resets the in-memory stores as well as the disk ones', async () => {
    let reset = false;
    await eraseEverything({
      stores,
      repositories,
      resetStores: () => {
        reset = true;
      },
    });
    expect(reset).toBe(true);
  });

  /**
   * Plan 14 T11's two remaining clauses, which session 15 recorded as not
   * done on the mistaken belief that `key.ts` had no delete.
   */
  it('destroys the encryption key, and only after the stores are empty', async () => {
    const order: string[] = [];

    await eraseEverything({
      stores,
      repositories,
      resetStores: () => order.push('reset'),
      destroyKey: async () => {
        // If this runs first, the stores are left as an encrypted blob nobody
        // can open -- which is worse than either state on its own.
        order.push(`destroyKey(dataKeys=${stores.data.getAllKeys().length})`);
      },
    });

    expect(order[0]).toBe('destroyKey(dataKeys=0)');
  });

  it('cancels notifications before anything is deleted', async () => {
    const order: string[] = [];

    await eraseEverything({
      stores,
      repositories,
      resetStores: () => undefined,
      cancelNotifications: async () => {
        order.push(`cancel(dataKeys=${stores.data.getAllKeys().length})`);
      },
    });

    // Non-zero: the records are still there when the cancel runs.
    expect(order[0]).toMatch(/^cancel\(dataKeys=[1-9]/);
  });

  /**
   * A reminder that fires after the data it refers to is gone is the one way
   * this operation can still speak to somebody afterwards -- but a scheduling
   * failure must never be the reason a deletion does not happen.
   */
  it('deletes everything even when cancelling notifications throws', async () => {
    await eraseEverything({
      stores,
      repositories,
      resetStores: () => undefined,
      cancelNotifications: async () => {
        throw new Error('notification module unavailable');
      },
    });

    expect(stores.data.getAllKeys()).toEqual([]);
  });

  it('deletes everything even when destroying the key throws', async () => {
    await eraseEverything({
      stores,
      repositories,
      resetStores: () => undefined,
      destroyKey: async () => {
        throw new Error('keychain unavailable');
      },
    });

    expect(stores.data.getAllKeys()).toEqual([]);
  });

  it('is safe to run twice', async () => {
    const deps = { stores, repositories, resetStores: () => undefined };
    await eraseEverything(deps);
    await expect(eraseEverything(deps)).resolves.toBeUndefined();
  });
});

describe('countEverything', () => {
  it('counts entries and worries without reading their content', async () => {
    const stores = freshStores();
    const repositories = createRepositories(stores);

    await repositories.worry.create(aWorry());

    const counts = countEverything(stores);
    expect(counts).toEqual({ entries: 0, worries: 1 });
  });

  it('is zero on a fresh device rather than throwing', () => {
    expect(countEverything(freshStores())).toEqual({ entries: 0, worries: 0 });
  });
});

describe('windowRange', () => {
  // A stand-in for the real formatter, so this tests the trimming rather than
  // Intl's output on whichever ICU build the CI happens to have.
  const twelveHour = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number) as [number, number];
    const suffix = h < 12 ? 'am' : 'pm';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${m < 10 ? '0' : ''}${m} ${suffix}`;
  };

  it('drops the shared suffix and a redundant :00', () => {
    expect(windowRange('20:00', 20, 'en', twelveHour)).toBe('8–8:20 pm');
  });

  it('keeps both suffixes when they differ', () => {
    expect(windowRange('11:50', 20, 'en', twelveHour)).toBe('11:50 am–12:10 pm');
  });

  /** A 24-hour locale never produces a suffix, so nothing is trimmed. */
  it('leaves a 24-hour format untouched', () => {
    const plain = (hhmm: string) => hhmm;
    expect(windowRange('20:00', 20, 'de', plain)).toBe('20:00–20:20');
  });
});

describe('addMinutes', () => {
  it('wraps past midnight', () => {
    expect(addMinutes('23:50', 20)).toBe('00:10');
  });

  it('pads both halves', () => {
    expect(addMinutes('08:05', 4)).toBe('08:09');
  });
});
