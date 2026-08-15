import { useEffect } from 'react';
import { Uniwind } from 'uniwind';

import { usePrefsStore } from '@/src/stores/prefs';

/**
 * Applies `prefs.theme` to Uniwind, and keeps applying it.
 *
 * WITHOUT THIS THE APPEARANCE SCREEN WOULD BE A LIE THAT LASTED ONE LAUNCH.
 * `AppThemeProvider` wraps `Uniwind.setTheme` but has never read a preference,
 * so a theme chosen in Settings would survive until the app was next opened
 * and then quietly revert to the phone's.
 *
 * MOUNTED ONCE, AT THE ROOT, rather than called from the picker. A picker that
 * applies the theme itself is correct exactly once — on the tap — and the
 * store is the thing that outlives the screen. This runs on every change to
 * `prefs.theme`, including the one hydration makes at boot, so the stored
 * theme is applied before anything is drawn.
 *
 * `'system'` is passed through rather than resolved. Uniwind takes the
 * sentinel and tracks the OS itself, which is what makes "match my phone" a
 * live binding rather than a snapshot (see `appearance.ts`).
 */
export function useThemePreference(): void {
  const theme = usePrefsStore((state) => state.prefs.theme);

  useEffect(() => {
    Uniwind.setTheme(theme);
  }, [theme]);
}
