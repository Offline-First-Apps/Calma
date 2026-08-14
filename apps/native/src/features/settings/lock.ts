/**
 * The lock, and the one rule that shapes every decision in it.
 *
 * **THE LOCK PROTECTS THE WRITING. IT NEVER GUARDS THE PANIC PATH.**
 *
 * Rule 3 — "no friction on the panic path" — is not negotiable, and a lock is
 * the most obvious way to break it. Someone at 3am who cannot get Face ID to
 * read their face has, at that exact moment, the least patience they will ever
 * have. So `k4` puts breathing above unlocking, and this module exists to make
 * that structural rather than a promise: `LOCKED_ROUTES` is an allowlist of
 * what the lock covers, and everything not on it is reachable while locked.
 *
 * Pure and dependency-free so the rule can be asserted in Node. A lock whose
 * scope can only be checked by navigating a running app is a lock whose scope
 * will drift.
 */

/**
 * The route prefixes the lock covers. Writing, and nothing else.
 *
 * ADDING TO THIS LIST IS A DECISION ABOUT RULE 3, not a routing detail. In
 * particular `/panic`, `/session`, `/(tabs)/breathe` and `/(tabs)` itself must
 * never appear here, and `guards.test.ts` asserts as much.
 */
export const LOCKED_ROUTES: readonly string[] = [
  '/(tabs)/write',
  '/journal',
  '/settings/privacy',
];

/**
 * Whether a route needs the lock cleared first.
 *
 * Prefix-matched, so `/journal/drafts` and `/journal/[id]` are both covered by
 * one entry — a per-route list would be a place to forget a screen.
 */
export function isLockedRoute(route: string): boolean {
  return LOCKED_ROUTES.some(
    (locked) => route === locked || route.startsWith(`${locked}/`),
  );
}

/**
 * Whether the lock should be presented at all, right now.
 *
 * `enabled` is the preference; `hardwareReady` is whether the device can
 * actually authenticate. A phone whose biometrics have been removed — or whose
 * passcode was turned off — must not become a phone whose owner is locked out
 * of their own journal, so an unavailable authenticator means no lock rather
 * than an impassable one.
 */
export function shouldLock(
  enabled: boolean,
  hardwareReady: boolean,
  alreadyUnlocked: boolean,
): boolean {
  if (!enabled || !hardwareReady) return false;
  return !alreadyUnlocked;
}
