import {
  type BreathTimeline,
  type BreathingEntryPoint,
  type BreathingPatternId,
  type CustomRatio,
  type PostFeeling,
  cyclesCompletedAt,
} from '@calma/domain';
import { useCallback, useRef, useState } from 'react';

import { useRepositories } from '@/src/lib/repositories';

/**
 * Recording what actually happened in a breathing session.
 *
 * `durationSec` IS WHAT HAPPENED, NOT WHAT WAS INTENDED. Someone who stops
 * forty seconds into a three-minute session did forty seconds of breathing.
 * The Progress tab says forty seconds. Rounding that up to the session they
 * chose would make the app's own record of someone's week into a flattering
 * fiction, and the one thing a private, offline journal has going for it is
 * that it is true.
 *
 * EVERY SESSION IS WRITTEN, INCLUDING THE ABANDONED ONES. `completed: false`
 * is a fact, not a failure -- there is no partial-credit logic here and no
 * threshold below which a session stops counting. Forty seconds of trying to
 * breathe on a bad night is a thing that happened.
 */

export interface StartSessionInput {
  pattern: BreathingPatternId;
  customRatio?: CustomRatio;
  entryPoint: BreathingEntryPoint;
  /** 0-10, or `null` when skipped or never asked (D-007). */
  preSuds: number | null;
}

export interface SessionOutcome {
  durationSec: number;
  cyclesCompleted: number;
  completed: boolean;
  preSuds: number | null;
  postFeeling: PostFeeling | null;
  /**
   * The stored session's id, or `null` when the write failed (T10).
   *
   * An entry written from the offer is linked to the session that prompted
   * it. `null` rather than a placeholder when storage was unavailable,
   * because a link to a session that was never written is worse than no link:
   * it is a claim the app cannot honour later.
   */
  sessionId: string | null;
}

/**
 * Whether to offer journaling after a session.
 *
 * Two triggers, both of them "this did not land":
 *   - the person arrived at 7 or above out of 10, or
 *   - they came out feeling the same or worse.
 *
 * Note what is NOT a trigger: a short session, a skipped rating, or a low
 * score. Someone who felt fine and feels fine is not offered a worksheet.
 *
 * D-015 is the reason this is only an offer and never a redirect: journaling
 * reached solely through "that didn't work" would make it structurally the
 * consolation prize, when for some people it is the main tool. It has its own
 * tab for exactly that reason.
 */
export function shouldOfferJournaling(outcome: {
  preSuds: number | null;
  postFeeling: PostFeeling | null;
}): boolean {
  if (outcome.preSuds !== null && outcome.preSuds >= 7) return true;
  return outcome.postFeeling === 'same' || outcome.postFeeling === 'worse';
}

export function useSession() {
  const { breathing } = useRepositories();

  const startedAt = useRef<number | null>(null);
  const input = useRef<StartSessionInput | null>(null);
  // Guards the "never re-prompt for the same session" rule. A ref, not state:
  // it must not survive into a new session and must not cause a render.
  const offeredFor = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);

  const begin = useCallback((next: StartSessionInput) => {
    input.current = next;
    startedAt.current = Date.now();
  }, []);

  /**
   * Writes the session.
   *
   * Storage failure is swallowed. There is no retry prompt and no error
   * toast: someone who has just finished breathing at 3am does not need to be
   * told that a local database write failed, and there is nothing they could
   * usefully do about it. The read-only degraded boot already told them once,
   * calmly, if it applies.
   */
  const finish = useCallback(
    async (
      timeline: BreathTimeline,
      elapsedSec: number,
      completed: boolean,
      postFeeling: PostFeeling | null,
    ): Promise<SessionOutcome | null> => {
      const started = startedAt.current;
      const details = input.current;
      if (started === null || details === null) return null;

      const outcome: SessionOutcome = {
        durationSec: Math.max(0, Math.round(elapsedSec)),
        cyclesCompleted: cyclesCompletedAt(timeline, elapsedSec),
        completed,
        preSuds: details.preSuds,
        postFeeling,
        sessionId: null,
      };

      setSaving(true);
      try {
        const saved = await breathing.create({
          pattern: details.pattern,
          ...(details.customRatio ? { customRatio: details.customRatio } : {}),
          entryPoint: details.entryPoint,
          startedAt: started,
          durationSec: outcome.durationSec,
          cyclesCompleted: outcome.cyclesCompleted,
          preSuds: outcome.preSuds,
          postFeeling: outcome.postFeeling,
          completed: outcome.completed,
        });
        offeredFor.current = saved.id;
        outcome.sessionId = saved.id;
      } catch {
        // See above. A session that failed to save still happened.
        offeredFor.current = `unsaved:${started}`;
      } finally {
        setSaving(false);
        startedAt.current = null;
      }

      return outcome;
    },
    [breathing],
  );

  /** Elapsed seconds since `begin`, for an early stop. */
  const elapsed = useCallback((): number => {
    const started = startedAt.current;
    return started === null ? 0 : (Date.now() - started) / 1000;
  }, []);

  const reset = useCallback(() => {
    startedAt.current = null;
    input.current = null;
    offeredFor.current = null;
  }, []);

  return { begin, finish, elapsed, reset, saving };
}
