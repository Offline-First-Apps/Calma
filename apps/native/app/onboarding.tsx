import { OnboardingFlow } from '@/src/features/onboarding/OnboardingFlow';

/**
 * Onboarding. Full-screen, no tab bar, no panic FAB.
 *
 * The FAB's absence is not a gap: `features/onboarding/CrisisExit.tsx` is on
 * every step, higher in the reading order and worded rather than symbolic,
 * because someone who has never seen this app before cannot be expected to
 * know what an amber circle in the corner does. Step six then teaches the
 * circle by having them press it.
 *
 * `gestureEnabled: false` in the stack (see `app/_layout.tsx`): a swipe back
 * out of onboarding would land on a Home the person has not been set up for.
 * The way out is the crisis exit, which is deliberate and goes somewhere.
 */
export default function Onboarding() {
  return <OnboardingFlow />;
}
