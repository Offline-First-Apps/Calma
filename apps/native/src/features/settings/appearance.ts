import type { OrbTheme, ThemePref } from '@calma/domain';

/**
 * Appearance — what can be chosen, and what only looks like it can.
 *
 * Pure, and in a `.ts` file, because "which orb themes exist" is a fact about
 * the app rather than about a screen, and `apps/native/vitest.config.ts` runs
 * Node with no renderer.
 */

/**
 * System first, and system is the default.
 *
 * A LIVE BINDING, LIKE THE LOCALE SENTINEL. Someone whose phone switches to
 * dark at sunset expects Calma to switch with it; storing the resolved theme
 * at the moment they chose would break that quietly, hours later, in a way
 * nobody would connect back to this screen. `Uniwind.setTheme` takes
 * `'system'` directly, so the sentinel is stored and resolved rather than
 * flattened.
 */
export const THEME_OPTIONS: readonly ThemePref[] = ['system', 'light', 'dark'];

/**
 * The orb themes that actually exist.
 *
 * One. `wave` and `bloom` are in the prefs schema and in the designs, and
 * neither is built — there is a single `Orb.tsx` and it draws an orb.
 *
 * T06 asks for them to read as "coming soon" rather than as broken options,
 * which is the same call `PrivacyScreen` made for iCloud and export: an
 * absence is honest, a control that silently does nothing is not. So they are
 * listed, visibly not yet, and unselectable — which is enforced by
 * `isOrbThemeAvailable` rather than by remembering to disable a row.
 */
export const AVAILABLE_ORB_THEMES: readonly OrbTheme[] = ['orb'];

/** Every orb theme the prefs schema knows, in the order the screen lists them. */
export const ORB_OPTIONS: readonly OrbTheme[] = ['orb', 'wave', 'bloom'];

export function isOrbThemeAvailable(theme: OrbTheme): boolean {
  return AVAILABLE_ORB_THEMES.includes(theme);
}
