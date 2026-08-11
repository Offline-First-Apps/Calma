import { View } from 'react-native';

/**
 * DELIBERATE EXCEPTION to the app-wide ban on progress indicators.
 *
 * Elsewhere a progress bar turns rest into a task being completed. In
 * onboarding, NOT knowing how much is left is its own low-grade anxiety, and
 * reducing that is exactly on-brand (systems/11-onboarding.md).
 *
 * It must stay a sense of position — never a percentage, never a spoken step
 * count. Per the designer's note on B1, it does not appear until the asking
 * starts. Do not reuse this anywhere else in the app.
 */
export function ProgressHairline({ step, total }: { step: number; total: number }) {
  const pct = Math.max(0, Math.min(1, step / total));
  return (
    <View
      className="h-[2px] w-full overflow-hidden rounded-full bg-separator"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="h-full rounded-full bg-accent" style={{ width: `${pct * 100}%` }} />
    </View>
  );
}
