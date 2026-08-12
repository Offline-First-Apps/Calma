import {
  type BreathingEntryPoint,
  type BreathingPatternId,
  breathingEntryPointSchema,
  breathingPatternIdSchema,
} from '@calma/domain';
import { useLocalSearchParams } from 'expo-router';

import { SessionScreen } from '@/src/features/breathing/SessionScreen';
import { usePrefsStore } from '@/src/stores/prefs';

/**
 * A breathing session, launched by pattern.
 *
 * Route params arrive as untyped strings, so both are parsed rather than
 * cast. A bad `pattern` falls back to the physiological sigh: it is the
 * shortest of the three and the one that works soonest, which makes it the
 * right thing to do when we do not know why someone is here.
 */
export default function Session() {
  const params = useLocalSearchParams<{
    pattern: string;
    entryPoint?: string;
    seconds?: string;
  }>();

  const customRatio = usePrefsStore((state) => state.prefs.customRatio);

  const pattern: BreathingPatternId =
    breathingPatternIdSchema.safeParse(params.pattern).data ?? 'physiological-sigh';

  const entryPoint: BreathingEntryPoint =
    breathingEntryPointSchema.safeParse(params.entryPoint).data ?? 'breathe-tab';

  const seconds = Number(params.seconds);

  return (
    <SessionScreen
      pattern={pattern}
      // A custom pattern with no stored ratio would throw in `getPattern`.
      // Only pass one when it is actually needed.
      {...(pattern === 'custom' && customRatio ? { customRatio } : {})}
      entryPoint={entryPoint}
      {...(Number.isFinite(seconds) && seconds > 0 ? { targetSeconds: seconds } : {})}
    />
  );
}
