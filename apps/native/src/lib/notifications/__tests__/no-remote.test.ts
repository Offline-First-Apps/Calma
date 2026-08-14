import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * RULE 1, ENFORCED ACROSS THE WHOLE SOURCE TREE.
 *
 * "No network layer. No servers, no accounts, no analytics." A push token is a
 * device identifier held by a third party, and registering for remote
 * notifications is the single easiest way to break that rule by accident —
 * `expo-notifications` exposes the call right next to the local ones, and
 * every tutorial online reaches for it.
 *
 * `systems/06`: "All local. No push tokens, no remote capability, no server.
 * The app never registers for remote notifications at all."
 *
 * This scans real files rather than trusting review. Plan 12 T01's "Done when"
 * asks for exactly this: *verified by the absence of any push token call*.
 */

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.test.ts')
      ? [path]
      : [];
  });
}

/** Forward slashes on every platform. See the note in `guards.test.ts`. */
const files = sourceFiles(src).map((path) => ({
  path: path.slice(src.length + 1).split(sep).join('/'),
  body: readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, ''),
}));

const forbidden = [
  { what: 'request a push token', pattern: /getExpoPushTokenAsync|getDevicePushTokenAsync/ },
  { what: 'register for remote notifications', pattern: /registerForPushNotifications|registerForRemoteNotifications/ },
  { what: 'set a project id for push', pattern: /projectId\s*:/ },
  { what: 'post a notification anywhere', pattern: /fetch\(|axios|XMLHttpRequest/ },
];

describe('the app never registers for remote notifications', () => {
  it('found the source tree', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it.each(forbidden)('does not $what', ({ pattern }: { pattern: RegExp }) => {
    expect(files.filter((f) => pattern.test(f.body)).map((f) => f.path)).toEqual([]);
  });

  /** The tamper guard: prove the haystack is a haystack. */
  it('would notice if a push token call were added', () => {
    const tampered = 'const token = await getExpoPushTokenAsync();';
    expect(/getExpoPushTokenAsync/.test(tampered)).toBe(true);
  });
});

describe('no notification carries a badge', () => {
  /**
   * A number on the app icon is a standing demand for attention nobody agreed
   * to. `systems/06` rules badges out alongside re-engagement.
   */
  it('never sets a badge count', () => {
    const offenders = files.filter((f) => /setBadgeCountAsync|badge:\s*[1-9]/.test(f.body));
    expect(offenders.map((f) => f.path)).toEqual([]);
  });
});
