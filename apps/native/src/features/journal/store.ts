import type { JournalPatch, JournalRepo } from '@calma/db';
import type { JournalEntry } from '@calma/domain';
import { weekKey } from '@calma/domain';
import { create } from 'zustand';

/**
 * Journal entries.
 *
 * Unlike the worry store, this one DOES hold text — because the journal is
 * the one place in Calma whose entire purpose is to give someone their own
 * words back. The rule there and the rule here come from the same principle
 * applied to opposite features: a worry is set down to be stopped thinking
 * about, an entry is written down to be returned to.
 *
 * What it still does not hold is everything at once. `entries` is a page, and
 * `listPaged` is what refills it.
 */

interface JournalState {
  drafts: JournalEntry[];
  /** Saved entries this ISO week. Drives the tier check, not a display. */
  weekCount: number;
  hydrated: boolean;

  hydrate: (repo: JournalRepo) => Promise<void>;
  /**
   * Starts an entry. It is a DRAFT from its first keystroke.
   *
   * Nothing is ever held only in component state waiting to be "saved". The
   * record exists before the first character does, so there is no window in
   * which someone's writing lives somewhere a force-quit can take it
   * (`plans/19-review-findings.md` R3).
   */
  startDraft: (
    repo: JournalRepo,
    linkedSessionId?: string | null,
  ) => Promise<JournalEntry>;
  patch: (
    repo: JournalRepo,
    id: string,
    patch: JournalPatch,
  ) => Promise<void>;
  /** Draft → entry. The only place the weekly allowance is consumed. */
  finish: (repo: JournalRepo, id: string) => Promise<void>;
  discard: (repo: JournalRepo, id: string) => Promise<void>;
}

/** A blank thought record. Every field may legitimately stay empty. */
export function blankEntry(linkedSessionId: string | null = null) {
  return {
    situation: '',
    automaticThought: '',
    emotion: '',
    emotionIntensity: 0,
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    emotionIntensityAfter: null,
    isDraft: true,
    linkedSessionId,
  };
}

export const useJournalStore = create<JournalState>((set, get) => ({
  drafts: [],
  weekCount: 0,
  hydrated: false,

  async hydrate(repo) {
    const [drafts, thisWeek] = await Promise.all([
      repo.listDrafts(),
      repo.listByWeek(weekKey(new Date())),
    ]);

    set({ drafts, weekCount: thisWeek.length, hydrated: true });
  },

  async startDraft(repo, linkedSessionId = null) {
    const entry = await repo.create(blankEntry(linkedSessionId));
    set((state) => ({ drafts: [entry, ...state.drafts] }));
    return entry;
  },

  /**
   * Every keystroke's worth of change, eventually.
   *
   * Called from `useAutosave` on a debounce. The store is updated from what
   * the repository returns so `updatedAt` in memory matches disk — the draft
   * list sorts on it, and a list that disagrees with storage about which
   * draft is most recent is the kind of bug nobody reports and everybody
   * notices.
   */
  async patch(repo, id, patch) {
    const updated = await repo.update(id, patch);
    set((state) => ({
      drafts: state.drafts.map((draft) => (draft.id === id ? updated : draft)),
    }));
  },

  async finish(repo, id) {
    await repo.update(id, { isDraft: false });
    set((state) => ({
      drafts: state.drafts.filter((draft) => draft.id !== id),
      weekCount: state.weekCount + 1,
    }));
  },

  /**
   * The only path that destroys writing, and it is never automatic.
   *
   * T13 requires that no code path clears the editor without an explicit
   * discard. This is that path, it is reached from one confirmation, and
   * nothing else in the feature calls `repo.delete`.
   */
  async discard(repo, id) {
    await repo.delete(id);
    set((state) => ({
      drafts: state.drafts.filter((draft) => draft.id !== id),
    }));
  },
}));

/** Drafts, newest first. */
export const selectDrafts = (state: JournalState): JournalEntry[] =>
  [...state.drafts].sort((a, b) => b.updatedAt - a.updatedAt);

/**
 * The first step of an entry that has nothing in it yet.
 *
 * Resuming drops someone where they stopped rather than at the beginning,
 * because re-reading four answered prompts to reach the empty one is a tax on
 * having been interrupted (T07).
 */
export function firstEmptyStep(entry: JournalEntry): number {
  const filled = [
    entry.situation,
    entry.automaticThought,
    entry.emotion,
    entry.evidenceFor,
    entry.evidenceAgainst,
    entry.balancedThought,
  ];

  const index = filled.findIndex((value) => value.trim().length === 0);
  return index === -1 ? filled.length - 1 : index;
}
