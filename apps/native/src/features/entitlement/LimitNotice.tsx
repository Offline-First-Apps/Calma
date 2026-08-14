import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/ui/Text';

import { usePaywallGate } from './gateStore';
import { PaywallSheet } from './PaywallSheet';
import { SETTLE_MS } from './paywallGate';
import type { Limit } from './useLimit';

/**
 * The two limits somebody hits repeatedly, and the only two with inline copy.
 *
 * `LimitKind` also covers `history` and `customRatio`, but those are one-shot
 * gates on a screen rather than an allowance that refills — there is no second
 * hit to write a line for, and `useLimit` does not accept them either.
 */
type RecurringKind = 'worry' | 'journal';

/**
 * Whatever the gate decided, rendered — and nothing when it decided nothing.
 *
 * THE POINT OF THIS COMPONENT IS THAT NO SCREEN RE-DERIVES THE RULES.
 *
 * `paywallDecision` already knows every condition under which a paywall must
 * not appear (T12), and it has fifteen assertions behind it. If each call site
 * decided for itself when to show a sheet, those assertions would cover a
 * function nobody consults, and the fourth screen to be wired would get it
 * subtly wrong. So the call sites do one thing — say "the limit was reached"
 * — and this turns that into a sheet, a line, or silence.
 *
 * `silent` is the common answer and it is not a failure mode. Someone
 * mid-session, mid-window, mid-entry or within seconds of finishing one gets
 * nothing at all, however many times they hit the limit.
 */
export function useLimitNotice(kind: RecurringKind, limit: Limit) {
  const [showing, setShowing] = useState<'sheet' | 'inline' | null>(null);
  const [queued, setQueued] = useState(false);

  // Subscribed to purely so the queue below re-evaluates when the gate opens.
  // Nothing here reads them; `limit.decide()` builds its own context.
  const blockers = usePaywallGate((state) => state.blockers);
  const completedAt = usePaywallGate((state) => state.completedAt);

  /** Asks the gate, and shows whatever it allows. True if anything appeared. */
  const present = useCallback(() => {
    const decision = limit.decide();
    if (decision === 'silent') return false;

    if (decision === 'sheet') limit.record();
    setShowing(decision);
    return true;
  }, [limit]);

  /**
   * Call when the limit was reached. The gate decides the rest.
   *
   * If nothing may be shown right now, the request is HELD rather than
   * dropped — T12 says the paywall is "suppressed and queued to the next
   * boundary", and dropping it is why the capture field could never show one:
   * it holds `'field'` for as long as it has focus, and T16 keeps that focus
   * through a submit, so the answer at the moment of capture is always silent.
   *
   * Only deferrable silence queues. A build that cannot sell anything, or a
   * limit whose sheet was already seen today, is a settled answer.
   */
  const offer = useCallback(() => {
    if (present()) return;
    if (limit.deferrable()) setQueued(true);
  }, [limit, present]);

  useEffect(() => {
    if (!queued) return;

    if (present()) {
      setQueued(false);
      return;
    }

    /*
     * The settle window closes on its own, and nothing tells us.
     *
     * A blocker being released re-renders this hook, because `blockers` is
     * subscribed above. The four seconds after a completion do not: no store
     * changes, so without this the queued offer would wait for some unrelated
     * event and arrive at a random later moment — which is precisely the kind
     * of out-of-nowhere appearance T12 exists to prevent.
     */
    if (completedAt === null || blockers.size > 0) return;

    const remaining = completedAt + SETTLE_MS - Date.now();
    if (remaining <= 0) return;

    const timer = setTimeout(() => {
      if (present()) setQueued(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [queued, present, blockers, completedAt]);

  const dismiss = useCallback(() => {
    setQueued(false);
    setShowing(null);
  }, []);

  const notice =
    showing === 'sheet' ? (
      <PaywallSheet kind={kind} onDismiss={dismiss} />
    ) : showing === 'inline' ? (
      <InlineLine kind={kind} />
    ) : null;

  return { offer, notice, dismiss };
}

/**
 * The second time in a day, and every time after.
 *
 * One line, in the flow, with no button and nothing to dismiss. The sheet
 * already made the offer once; repeating it is the app asking again after
 * being told no, which `systems/05` forbids in as many words.
 */
function InlineLine({ kind }: { kind: RecurringKind }) {
  const { t } = useTranslation('entitlement');

  return (
    <View className="mt-4">
      <Text variant="footnote" className="text-label-quiet">
        {t(`inlineLimit.${kind}`)}
      </Text>
    </View>
  );
}
