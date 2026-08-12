import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisExit } from './CrisisExit';
import { Progress } from './Progress';

/**
 * The furniture every onboarding step shares, in the same places every time.
 *
 * The designer's note on b5 is the reason this is one component rather than a
 * pattern each step repeats: "same furniture in the same places as B4, so the
 * second ask costs no new reading." Three questions in a row only feel like
 * one conversation if the hairline, the exit and the heading do not move by a
 * pixel between them.
 *
 * WHY THIS DOES NOT USE `ui/Screen`. Screen pads its content down from the
 * safe area by a fixed chrome height. Onboarding puts the progress hairline
 * *above* that inset — it belongs to the flow rather than to the screen — so
 * the padding has to be split around it. This is the only place in the app
 * with anything above the content inset, which is why the exception lives
 * here and not in Screen.
 *
 * THE CRISIS EXIT IS NOT OPTIONAL AND NOT A PROP. Every step gets one, on
 * every ground, with no way for a step to turn it off. That is D-014 made
 * structural: a future step cannot forget it, because a step cannot express
 * the idea of not having it.
 */

/** Which ground a step stands on. All three come from the design files. */
export type StepGround = 'base' | 'lift' | 'immersive';

const GROUNDS: Record<StepGround, string> = {
  /** The ordinary onboarding ground. Eight of the ten steps. */
  base: 'bg-background',
  /** The reveal (b9). "Warmest ground in onboarding." */
  lift: 'bg-lift',
  /** The first breath (b7), which shares the session screen's ground. */
  immersive: 'bg-immersive',
};

export function StepFrame({
  ground = 'base',
  progress,
  onEscape,
  children,
}: {
  ground?: StepGround;
  /** Hairline position, or `null` on the steps that show none (b1, b7). */
  progress: number | null;
  onEscape: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View className={`flex-1 ${GROUNDS[ground]}`} style={{ paddingTop: Math.max(insets.top, 20) }}>
      {/* Sits above the content inset, in the gap under the status bar. */}
      <View className="px-8 pt-2">
        {progress === null ? null : <Progress fraction={progress} />}
      </View>

      <View
        className="flex-1 px-8"
        style={{ paddingTop: 14, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
      >
        <CrisisExit onEscape={onEscape} />
        {children}
      </View>
    </View>
  );
}
