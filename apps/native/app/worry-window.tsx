import { WorryWindowScreen } from '@/src/features/worry/WorryWindowScreen';

/**
 * The worry window. Full screen, tab bar hidden.
 *
 * Leaving is free: back closes the window with worries still pending, no
 * confirmation and no penalty.
 */
export default function WorryWindow() {
  return <WorryWindowScreen />;
}
