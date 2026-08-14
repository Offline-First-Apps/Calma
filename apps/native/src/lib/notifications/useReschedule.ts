import { readStreak } from '@calma/db';
import { dayKey } from '@calma/domain';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useTier } from '@/src/features/entitlement/store';
import { usePrefsStore } from '@/src/stores/prefs';

import { useRepositories, useStorage } from '../repositories';
import { rescheduleAll } from './schedule';

/**
 * Rebuilds the whole schedule whenever anything it depends on changes.
 *
 * ONE HOOK, MOUNTED ONCE, RATHER THAN A CALL AT EVERY MUTATION SITE.
 * `systems/06` lists seven things that must trigger a reschedule — window
 * time, duration, tier, pending count, permission, timezone, boot — and
 * scattering `rescheduleAll()` across seven call sites is how one of them gets
 * forgotten and somebody's reminder keeps firing at the old time.
 *
 * Expressing them as a dependency array instead makes the list checkable by
 * reading four lines, and makes "did we remember to reschedule?" a question
 * React answers rather than a person.
 *
 * The pending count is read here rather than watched: it changes on capture
 * and on triage, both of which end with a navigation back to a screen this
 * hook's host outlives.
 */
export function useReschedule(): void {
  const { t } = useTranslation('notifications');
  const { stores } = useStorage();
  const repositories = useRepositories();
  const tier = useTier();

  const worryWindowTime = usePrefsStore((s) => s.prefs.worryWindowTime);
  const worryWindowMinutes = usePrefsStore((s) => s.prefs.worryWindowMinutes);
  const notificationsAsked = usePrefsStore((s) => s.prefs.notificationsAsked);
  const hydrated = usePrefsStore((s) => s.hydrated);

  useEffect(() => {
    // Nothing before prefs are real. Scheduling against `defaultPrefs` would
    // put a stranger's reminder at 19:00 for the seconds before hydration.
    if (!hydrated) return;

    let alive = true;

    void (async () => {
      const pending = await repositories.worry.listPending();
      const streak = readStreak(stores.data);
      if (!alive) return;

      await rescheduleAll({
        t,
        tier,
        worryWindowTime,
        pendingWorries: pending.length,
        streak: streak.current,
        qualifiedToday: streak.lastQualifyingDay === dayKey(new Date()),
        // `notificationsAsked` is our record of having asked; `rescheduleAll`
        // re-checks the real OS permission before scheduling anything.
        permitted: notificationsAsked,
      });
    })();

    return () => {
      alive = false;
    };
  }, [
    hydrated,
    t,
    tier,
    worryWindowTime,
    // Not read by the planner, but a duration change alters when the window
    // ends and `systems/06` lists it as a reschedule trigger.
    worryWindowMinutes,
    notificationsAsked,
    repositories,
    stores,
  ]);
}
