# Data Layer

Everything Calma knows about a person lives on their device, encrypted, and is reachable only through `packages/db`. See D-001.

---

## Encryption & key custody

```
expo-secure-store  ──holds──▶  32-byte random key (base64)
        │                              │
        │ WHEN_UNLOCKED_THIS_DEVICE_ONLY│
        ▼                              ▼
   Keychain / Keystore          new MMKV({ id, encryptionKey })
```

- Key generated once on first launch with `expo-crypto`'s `getRandomBytesAsync(32)`.
- Stored under `calma.storage.key` with `keychainAccessible: WHEN_UNLOCKED_THIS_DEVICE_ONLY` — not synced to iCloud, not restored to a new device.
- **Consequence, stated plainly:** device loss means data loss. This is the correct trade for this app, and Settings says so in one honest sentence. No backup, no export in V1 (backlog).
- The key is read exactly once at boot and never logged, never held in Zustand, never crosses a package boundary.

### MMKV instances

| Instance id | Encrypted | Contents |
|---|---|---|
| `calma.data` | yes | worries, journal entries, breathing sessions |
| `calma.prefs` | yes | name, window time, ratios, theme, toggles |
| `calma.cache` | no | entitlement cache, last-seen app version, onboarding-complete flag |

Sensitive content never touches `calma.cache`.

---

## Ports and adapters

```
packages/db/src/
├── ports/            interfaces only — zero runtime imports
│   ├── worry.repo.ts
│   ├── journal.repo.ts
│   ├── breathing.repo.ts
│   └── prefs.repo.ts
├── adapters/mmkv/    the V1 implementation
│   ├── storage.ts    instance creation + key bootstrap
│   ├── index.ts      index maintenance helpers
│   └── *.mmkv.ts     one file per repo
├── migrations/
└── index.ts          factory — the single line that swaps adapters
```

Ports are written against domain entities from `@calma/domain`. Feature code imports the port type and the factory, never the adapter.

```ts
// packages/db/src/ports/worry.repo.ts
export interface WorryRepo {
  create(input: NewWorry): Promise<Worry>;
  get(id: string): Promise<Worry | null>;
  listPending(): Promise<Worry[]>;          // oldest first
  listByDay(dayKey: string): Promise<Worry[]>;
  countCapturedOn(dayKey: string): Promise<number>;
  markProcessed(id: string, actionText: string): Promise<void>;
  markReleased(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
```

Async signatures even though MMKV is synchronous. This costs nothing today and means a SQLite adapter needs no call-site changes.

---

## Entities

Defined in `@calma/domain`, validated with zod on read (see *Corruption* below).

```ts
type BreathingSession = {
  id: string;              // ULID
  pattern: '4-7-8' | '5-5-5-5' | 'physiological-sigh' | 'custom';
  customRatio?: [number, number, number, number];  // in/hold/out/hold, seconds
  entryPoint: 'panic' | 'sigh' | 'breathe-tab' | 'journal-prompt';
  startedAt: number;       // epoch ms
  durationSec: number;     // actual, not intended
  cyclesCompleted: number;
  preSuds: number | null;  // 0–10, null = skipped (D-007)
  postFeeling: 'better' | 'same' | 'worse' | null;
  completed: boolean;      // false = user stopped early
};

type Worry = {
  id: string;
  text: string;
  capturedAt: number;
  status: 'pending' | 'processed' | 'released';
  resolvedAt: number | null;
  actionText: string | null;   // set only when status === 'processed'
};

type JournalEntry = {
  id: string;
  situation: string;
  automaticThought: string;
  emotion: string;
  emotionIntensity: number;      // 0–10
  evidenceFor: string;
  evidenceAgainst: string;
  balancedThought: string;
  emotionIntensityAfter: number | null;
  isDraft: boolean;
  linkedSessionId: string | null;
  createdAt: number;
  updatedAt: number;
};

type Prefs = {
  name: string | null;
  locale: 'system' | string;     // BCP-47 tag; 'system' is a live binding, not a snapshot
  worryWindowTime: string;       // 'HH:mm' local
  worryWindowMinutes: 15 | 20 | 30;   // 15 forced on free
  customRatio: [number, number, number, number] | null;
  orbTheme: 'orb' | 'wave' | 'bloom';
  theme: 'system' | 'light' | 'dark';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  onboardingCompletedAt: number | null;
  onboardingEscaped: boolean;    // left via the crisis exit — allows exactly one re-offer
  onboardingReOffered: boolean;
  onboardingAnswers: {           // editable in Settings
    why: string[];
    when: string[];
    helped: string[];
  } | null;
  notificationsAsked: boolean;
};
```

### IDs

ULID-style: `{base32 timestamp}{random}`. Lexicographically sortable by creation time, which means "sort ids" is free and no secondary time index is needed for chronological reads.

---

## Key schema

```
meta:schemaVersion            → number

breath:{id}                   → BreathingSession
worry:{id}                    → Worry
journal:{id}                  → JournalEntry

idx:breath:days               → string[]                  sorted dayKeys, desc
idx:breath:day:{YYYY-MM-DD}   → string[]                  session ids
idx:worry:pending             → string[]                  oldest first
idx:worry:day:{YYYY-MM-DD}    → string[]                  captured that day
idx:journal:days              → string[]
idx:journal:day:{YYYY-MM-DD}  → string[]

state:session:active          → ActiveSessionSnapshot | absent
state:worryWindow             → { openedAt, cursorIndex, queue: string[] } | absent

idx:window:completed          → string[]                  dayKeys, ascending
```

`idx:window:completed` was added in session 7. The streak rule needs to know a
worry window was carried to the end, and `state:worryWindow` is transient — it
is gone the moment the window closes. It cannot be derived from the worries
either: a window processes whatever was pending, which may all have been
captured on other days.

`dayKey` is computed from the device's *current* timezone at write time via `lib/time.ts`. Never store an offset.

### Index invariant

Every write that touches a record must update its indexes **in the same synchronous block**. MMKV has no transactions, so ordering matters: **write the record first, then the index.** A crash between the two leaves an orphan record (invisible, harmless) rather than a dangling index pointer (a crash on read).

A `repairIndexes()` routine rebuilds all indexes from a full key scan. It runs on migration and is callable from a hidden Settings debug row.

---

## Query strategy, and where it breaks

| Query | Method | Cost |
|---|---|---|
| Pending worries | read `idx:worry:pending`, map | O(pending), tiny |
| Worries captured today | read day index | O(1) index + O(n) |
| This week's stats | 7 day-index reads | trivial |
| Monthly trends (Plus) | ~30 day-index reads, aggregate in memory | fine |
| Full history (Plus) | paginate `idx:*:days` descending, 30 days per page | fine |
| Journal search (Plus) | **linear scan** of all entries, lowercase substring | acceptable to ~2,000 entries |

Journal search is deliberately not indexed. At 2 entries/week free and realistically <5/week on Plus, a user hits ~250 entries a year. A linear scan over 250 short JSON blobs is sub-millisecond. Building an inverted index would be premature, and an inverted index of someone's private journal is an extra copy of sensitive text on disk.

**Revisit threshold:** search latency >100ms, or >2,000 entries. Then move to the SQLite adapter with FTS5 — not to a hand-rolled index.

---

## Aggregate cache

Dashboard aggregates are recomputed on write, not on read:

```
agg:week:{YYYY-Www}  → { sessions, totalMinutes, worriesProcessed, worriesReleased,
                         journalEntries, avgPreSuds, improvedCount }
agg:streak           → { current, longest, lastQualifyingDay }
```

Recomputed by the repository whenever a qualifying record is written. Cheap, and it makes the Progress tab render instantly.

### Streak rule

A day qualifies if the user **saved a journal entry** *or* **completed a worry window** (processed every queued worry). Breathing alone does not count — the blueprint is explicit, and it keeps the streak meaningful rather than trivially farmable.

Streak breaks after one full missed calendar day. **No streak-loss notification, ever.** Losing a streak is not something we punish someone for.

---

## Migrations

```ts
const migrations = [
  { version: 1, up: (s) => { /* initial */ } },
];
```

Run at boot, sequentially, from `meta:schemaVersion`. Forward-only. Each migration is idempotent. A migration that throws leaves the version unincremented and boots the app read-only rather than destroying data.

---

## Corruption & validation

Every record is parsed with its zod schema on read. On failure:

1. Log the key (never the content) to an in-memory dev-only buffer.
2. Drop the record from the returned collection.
3. Remove it from indexes.

One malformed journal entry must never take down the Progress tab.

---

## Deletion

- **Single record:** hard delete + index removal. No soft-delete, no tombstone. When someone releases a worry, it is gone — that's the entire emotional premise of the feature.
- **Erase everything** (Settings): clears all three MMKV instances, deletes the SecureStore key, cancels notifications, resets stores. Two-step confirmation, plain language, no dark patterns to retain.
