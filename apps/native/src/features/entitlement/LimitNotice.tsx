import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/src/ui/Text';

import { PaywallSheet } from './PaywallSheet';
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

  /**
   * Call AFTER the action succeeded, never before it.
   *
   * `systems/05-entitlements.md`: the action is attempted and a gentle card
   * follows. Nothing is ever disabled, so this cannot be used to decide
   * whether something is allowed — by the time it runs, it already happened.
   */
  const offer = useCallback(() => {
    const decision = limit.decide();
    if (decision === 'silent') return;

    if (decision === 'sheet') limit.record();
    setShowing(decision);
  }, [limit]);

  const dismiss = useCallback(() => setShowing(null), []);

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
