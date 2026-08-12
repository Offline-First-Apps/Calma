import type { JournalPatch, JournalRepo } from '@calma/db';
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { useJournalStore } from './store';

/**
 * Continuous autosave for a journal entry.
 *
 * THE THING THIS EXISTS TO PREVENT.
 *
 * A half-written journal entry is the most emotionally costly thing this app
 * holds. Losing one is worse than a crash, because a crash does not take
 * anything with it (`plans/19-review-findings.md` R3). Someone has just spent
 * ten minutes writing down the worst thought they had this year; if the app
 * is killed and that is gone, they will not write it again.
 *
 * So saving is CONTINUOUS AND DEBOUNCED, not on blur. Blur-only saving loses
 * everything typed into the field that was focused when the phone was
 * force-quit — which is, by definition, the field they were in the middle of.
 *
 * Three triggers, deliberately overlapping:
 *
 *   1. A debounce while typing. The steady state.
 *   2. Backgrounding. `AppState` fires before iOS suspends, and a suspended
 *      app can be killed without ever running code again.
 *   3. Unmount. Navigating away is not a save point in the user's mind, so
 *      it must not be one in the code either — it flushes and moves on.
 *
 * The debounce is short on purpose. 800ms means the worst case is under a
 * sentence, and MMKV writes are synchronous and small enough that saving this
 * often costs nothing measurable.
 */
const DEBOUNCE_MS = 800;

export function useAutosave(repo: JournalRepo, id: string | null) {
  const patchStore = useJournalStore((state) => state.patch);

  /** Fields changed since the last write. Merged, never queued. */
  const dirty = useRef<JournalPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    const patch = dirty.current;
    if (id === null || Object.keys(patch).length === 0) return;

    // Cleared BEFORE the await, so keystrokes landing during the write are
    // recorded as newly dirty rather than being wiped by the completion of a
    // save that did not include them.
    dirty.current = {};
    void patchStore(repo, id, patch);
  }, [id, patchStore, repo]);

  const save = useCallback(
    (patch: JournalPatch) => {
      dirty.current = { ...dirty.current, ...patch };

      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  // Backgrounding. The last chance to run before the OS may kill the process.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') flush();
    });

    return () => subscription.remove();
  }, [flush]);

  // Unmount. Navigating away must not be able to lose the tail of a sentence.
  useEffect(() => flush, [flush]);

  return { save, flush };
}
