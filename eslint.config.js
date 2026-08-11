/**
 * Root lint config.
 *
 * Boundaries are checked from the repo root rather than per package, because
 * the rules are about the relationships *between* packages — a per-package run
 * cannot see that `packages/db` is the one place MMKV is allowed.
 *
 * The rules themselves live in `@calma/config/eslint/base.js`.
 */
import boundaries from '@calma/config/eslint/base.js';

export default [...boundaries];
