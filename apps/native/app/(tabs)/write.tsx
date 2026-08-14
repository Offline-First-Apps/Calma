import { LockGate } from '@/src/features/settings/LockGate';
import { WriteScreen } from '@/src/features/journal/WriteScreen';

/**
 * The Write tab, behind the lock when one is set.
 *
 * The gate is here rather than inside `WriteScreen` so that the screen itself
 * has no idea a lock exists — and so the wrapping is visible at the route,
 * where "what is protected" is a question someone might actually ask.
 */
export default function Write() {
  return (
    <LockGate>
      <WriteScreen />
    </LockGate>
  );
}
