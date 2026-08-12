import { View } from 'react-native';

import { ProgressHairline } from '@/src/ui/ProgressHairline';

/**
 * Onboarding's position indicator, and the app's only one.
 *
 * `plans/17-screens.md` bans progress indicators everywhere. This is the
 * documented exception (`systems/11-onboarding.md`), and the argument for it
 * is not "onboarding is different" but something narrower: in a breathing
 * session a progress bar converts rest into a task being completed, whereas in
 * a setup flow *not* knowing how much is left is its own low-grade anxiety.
 * Removing that is the same job the rest of the app is doing.
 *
 * The constraints that keep it on the right side of that line:
 *
 *   - No percentage, no "4 of 11", nothing countable. The designer's note on
 *     b5 sets the target: "enough to sense position, nowhere near enough to
 *     count."
 *   - Hidden from screen readers entirely. A spoken step count is exactly what
 *     the system doc rules out, and VoiceOver already announces the heading of
 *     each new step, which is the position information that actually helps.
 *   - Absent on the welcome and on the first breath. Not an oversight in
 *     either case — see `STEP_PROGRESS` in the machine.
 *   - Never reaches the end, so the last step is not a finish line.
 *
 * This wrapper exists so the exception has a name in `features/onboarding`.
 * If a second caller of `ProgressHairline` ever appears anywhere in the app,
 * it is a bug, and this file is the trail back to why.
 */
export function Progress({ fraction }: { fraction: number }) {
  return (
    <View className="w-full">
      <ProgressHairline fraction={fraction} />
    </View>
  );
}
