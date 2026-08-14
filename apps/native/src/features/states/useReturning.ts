import { dayKey } from '@calma/domain';
import { useCallback, useState } from 'react';

import { useStorage } from '@/src/lib/repositories';

import { isReturning } from './returning';

/**
 * k6's trigger: has it been a long time since the last visit?
 *
 * THE THRESHOLD IS 21 DAYS, and it is a judgement call. The screen is called
 * "returning after a month", but a month is too long to be the boundary: three
 * weeks is already past the point where someone wonders whether their writing
 * survived, which is the fear the screen answers. Below three weeks a greeting
 * like this reads as the app noticing a gap that was not one.
 *
 * SHOWN ONCE, THEN NOT AGAIN. There is no counter and nothing that escalates —
 * a person returning after six months gets exactly the same screen as one
 * returning after three weeks, because the alternative is the app grading
 * their absence.
 *
 * Lives in `cache`, not `data`: it is a fact about launches, not user content.
 */
const LAST_SEEN = 'state:lastSeenDay';

export interface Returning {
  show: boolean;
  acknowledge: () => void;
}

export function useReturning(today: Date = new Date()): Returning {
  const { stores } = useStorage();

  /*
   * READ, DECIDE, THEN WRITE — IN THAT ORDER, ONCE.
   *
   * The first draft of this exposed a `markSeen` for the boot gate to call and
   * nothing ever called it, so the key was never written and k6 could not fire
   * at all. Worse, wiring it into boot would have written today's key *before*
   * Home read it, so the check would compare today against today and the
   * screen would be dead either way.
   *
   * A `useState` initialiser runs exactly once per mount, before any effect,
   * which makes it the one place the read is guaranteed to happen ahead of the
   * write. The write then follows immediately, so a person who force-quits
   * without pressing anything still does not get greeted twice.
   */
  const [show] = useState(() => {
    const last = stores.cache.getString(LAST_SEEN);
    const greeting = isReturning(last, dayKey(today));
    stores.cache.set(LAST_SEEN, dayKey(today));
    return greeting;
  });

  const [acknowledged, setAcknowledged] = useState(false);
  const acknowledge = useCallback(() => setAcknowledged(true), []);

  return { show: show && !acknowledged, acknowledge };
}
