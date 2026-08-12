import type { KeyValueStore, WorryRepo } from '@calma/db';
import { STATE_WORRY_WINDOW } from '@calma/db';
import {
  isResumable,
  openWindow,
  reconcileWindow,
  type TriageState,
} from '@calma/domain';
import { create } from 'zustand';

/**
 * Worries, as the app holds them in memory.
 *
 * THE STORE HOLDS IDS, NOT TEXT. THIS IS THE WHOLE FEATURE.
 *
 * `pendingIds` is a list of strings that mean nothing on their own. The
 * Worries tab renders its length and never anything else; f1's caption is
 * explicit — "no previews, no list, no first lines — showing them back would
 * undo the postponement". Holding `Worry[]` here would put every worry
 * someone has written into the state tree of the screen whose entire job is
 * not showing them, and the first well-meant "just the first line?" would
 * then be a one-line change with nothing in the way.
 *
 * Text is read one worry at a time, by the triage screen, for the worry
 * currently on screen. It is never accumulated and never cached.
 *
 * Writes go action → repository → store, like every other store in Calma.
 * Nothing here auto-persists (systems/01-architecture.md § State).
 */

interface WorryState {
  /** Oldest first. Ids only — see the note above. */
  pendingIds: string[];
  hydrated: boolean;
  /**
   * The open worry window, or `null`.
   *
   * Mirrored into `state:worryWindow` on every transition so a cold boot can
   * resume. The store is the working copy; the key is the record.
   */
  window: TriageState | null;

  hydrate: (repo: WorryRepo) => Promise<void>;
  capture: (repo: WorryRepo, text: string) => Promise<void>;
  beginWindow: (repo: WorryRepo, store: KeyValueStore) => Promise<void>;
  setWindow: (store: KeyValueStore, next: TriageState) => void;
  closeWindow: (store: KeyValueStore) => void;
  restoreWindow: (repo: WorryRepo, store: KeyValueStore) => Promise<void>;
  markProcessed: (
    repo: WorryRepo,
    store: KeyValueStore,
    id: string,
    actionText: string,
  ) => Promise<void>;
  markReleased: (
    repo: WorryRepo,
    store: KeyValueStore,
    id: string,
  ) => Promise<void>;
}

/** Writes the window to disk, or clears the key when there is none. */
function persist(store: KeyValueStore, window: TriageState | null): void {
  if (window === null) {
    store.delete(STATE_WORRY_WINDOW);
    return;
  }
  store.set(STATE_WORRY_WINDOW, JSON.stringify(window));
}

function readPersisted(store: KeyValueStore): TriageState | null {
  const raw = store.getString(STATE_WORRY_WINDOW);
  if (raw === undefined) return null;

  try {
    // Shape-checked by `reconcileWindow` against what is actually pending
    // rather than by a schema here. A window whose queue no longer matches
    // storage is the realistic corruption, not a malformed field.
    const parsed = JSON.parse(raw) as TriageState;
    return Array.isArray(parsed.queue) ? parsed : null;
  } catch {
    return null;
  }
}

export const useWorryStore = create<WorryState>((set, get) => ({
  pendingIds: [],
  hydrated: false,
  window: null,

  async hydrate(repo) {
    const pending = await repo.listPending();
    set({ pendingIds: pending.map((worry) => worry.id), hydrated: true });
  },

  /**
   * Capture.
   *
   * The store updates from the record the repository returns rather than
   * from the text that was passed in, so the id in `pendingIds` is always one
   * that exists on disk. Optimistically appending a locally-invented id would
   * make the count right and the window's queue wrong.
   */
  async capture(repo, text) {
    const worry = await repo.create({ text });
    set((state) => ({ pendingIds: [...state.pendingIds, worry.id] }));
  },

  async beginWindow(repo, store) {
    // Re-read rather than trusting `pendingIds`: the tab may have been open
    // for hours, and the queue is fixed at this moment for the whole window.
    const pending = await repo.listPending();
    const window = openWindow(pending.map((worry) => worry.id));

    persist(store, window);
    set({ window, pendingIds: pending.map((worry) => worry.id) });
  },

  setWindow(store, next) {
    persist(store, next);
    set({ window: next });
  },

  /**
   * Leaving the window.
   *
   * Everything not yet dealt with stays pending, with no confirmation, no
   * penalty, and nothing recorded about the fact that someone left. "The rest
   * can wait" is the copy and it is also the behaviour (D-008).
   */
  closeWindow(store) {
    persist(store, null);
    set({ window: null });
  },

  /**
   * Resume a window across a cold boot.
   *
   * Reconciled against what is still pending before it is trusted: a worry
   * can leave the queue behind the window's back, and resuming onto an id
   * whose record no longer exists would hand the triage screen a blank.
   */
  async restoreWindow(repo, store) {
    const saved = readPersisted(store);
    if (saved === null) return;

    const pending = await repo.listPending();
    const reconciled = reconcileWindow(
      saved,
      pending.map((worry) => worry.id),
    );

    if (!isResumable(reconciled)) {
      persist(store, null);
      set({ window: null, pendingIds: pending.map((worry) => worry.id) });
      return;
    }

    persist(store, reconciled);
    set({
      window: reconciled,
      pendingIds: pending.map((worry) => worry.id),
      hydrated: true,
    });
  },

  async markProcessed(repo, store, id, actionText) {
    await repo.markProcessed(id, actionText);
    set((state) => ({
      pendingIds: state.pendingIds.filter((pendingId) => pendingId !== id),
    }));
    persist(store, get().window);
  },

  /**
   * Release.
   *
   * `markReleased` keeps the record with `status: 'released'` so the window
   * summary and the day's aggregate can still count it; `delete` is the hard
   * removal. The distinction is the repository's, and this is the call site
   * that has to get it right: the *text* is what someone let go of, and it is
   * gone from every screen the moment this returns.
   */
  async markReleased(repo, store, id) {
    await repo.markReleased(id);
    set((state) => ({
      pendingIds: state.pendingIds.filter((pendingId) => pendingId !== id),
    }));
    persist(store, get().window);
  },
}));

/** The only number the Worries tab is allowed to render. */
export const selectPendingCount = (state: WorryState): number =>
  state.pendingIds.length;
