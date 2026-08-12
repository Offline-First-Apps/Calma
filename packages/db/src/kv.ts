/**
 * The one thing a repository needs from storage.
 *
 * MMKV is synchronous, so this interface is too — wrapping it in promises here
 * would be a lie about what the machine is doing. The *ports* are async,
 * because that is the boundary a SQLite adapter would have to cross; this is
 * the layer underneath.
 *
 * Everything above this interface is testable in Node with `MemoryStore`,
 * which is why the repositories take a store rather than reaching for MMKV.
 */
export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
}

/** The three instances from systems/02-data-layer.md. */
export interface Stores {
  /** Encrypted. Worries, journal entries, breathing sessions. */
  data: KeyValueStore;
  /** Encrypted. Name, window time, ratios, theme, toggles. */
  prefs: KeyValueStore;
  /**
   * Not encrypted. Entitlement cache, last-seen version, onboarding flag.
   * Sensitive content never touches this one.
   */
  cache: KeyValueStore;
}

/**
 * An in-memory store, for tests and for the degraded read-only boot that
 * happens when SecureStore is unavailable.
 *
 * `failWritesAfter` exists to test the index invariant: MMKV has no
 * transactions, so the only way to prove that an interrupted write leaves an
 * orphan record rather than a dangling index pointer is to interrupt one.
 */
export class MemoryStore implements KeyValueStore {
  private readonly map = new Map<string, string>();

  private writesLeft = Number.POSITIVE_INFINITY;

  constructor(initial?: Record<string, string>) {
    if (initial) {
      for (const [key, value] of Object.entries(initial)) {
        this.map.set(key, value);
      }
    }
  }

  /** Every write after the next `count` throws. */
  failWritesAfter(count: number): void {
    this.writesLeft = count;
  }

  getString(key: string): string | undefined {
    return this.map.get(key);
  }

  set(key: string, value: string): void {
    if (this.writesLeft <= 0) {
      throw new Error('storage write interrupted');
    }
    this.writesLeft -= 1;
    this.map.set(key, value);
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  getAllKeys(): string[] {
    return [...this.map.keys()];
  }

  clearAll(): void {
    this.map.clear();
  }

  /** Test helper. Never used by app code. */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.map);
  }
}

export function createMemoryStores(): Stores & {
  data: MemoryStore;
  prefs: MemoryStore;
  cache: MemoryStore;
} {
  return {
    data: new MemoryStore(),
    prefs: new MemoryStore(),
    cache: new MemoryStore(),
  };
}
