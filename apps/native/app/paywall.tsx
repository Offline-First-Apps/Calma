import { PlansScreen } from '@/src/features/entitlement/PlansScreen';
import { PlusActiveScreen } from '@/src/features/entitlement/PlusActiveScreen';
import { useTier } from '@/src/features/entitlement/store';

/**
 * One route, two screens: i1 when there is nothing yet, i2 when there is.
 *
 * They are the same destination -- "my Plus" -- reached the same way, and
 * splitting them into two routes would mean every caller had to know which
 * one applied and would get it wrong the moment a purchase completed.
 */
export default function Paywall() {
  return useTier() === 'plus' ? <PlusActiveScreen /> : <PlansScreen />;
}
