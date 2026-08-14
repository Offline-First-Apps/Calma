import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * A ZUSTAND SELECTOR MUST NOT ALLOCATE.
 *
 * zustand v5 reads through `useSyncExternalStore`, which compares snapshots by
 * reference. A selector that builds a new array or object cannot ever return
 * an equal snapshot, so React re-renders, calls it again, gets another new
 * value, and loops until it gives up:
 *
 *     ERROR  The result of getSnapshot should be cached to avoid an infinite loop
 *     ERROR  Maximum update depth exceeded
 *
 * That is what `selectDrafts` did — `[...state.drafts].sort(...)` — and it
 * made the Write tab unopenable. It was invisible to every other test in the
 * repo, because the logic was correct; only the identity was wrong.
 *
 * Derive on WRITE (sort as the store is updated) or in a `useMemo` at the call
 * site. Never in the selector.
 */

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

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

const files = sourceFiles(src).map((path) => ({
  path: path.slice(src.length + 1).split(sep).join('/'),
  body: readFileSync(path, 'utf8'),
}));

/** `export const selectX = (state: T): R => <body up to the next blank line>` */
function selectorBodies(body: string): { name: string; expression: string }[] {
  return [
    ...body.matchAll(
      /export const (select\w+)\s*[:=][^=]*=>\s*([\s\S]*?);\s*(?:\n\n|\n\/\*|$)/g,
    ),
  ].map((m) => ({ name: m[1] ?? '', expression: m[2] ?? '' }));
}

/**
 * The `\(?` matters: an arrow function returning an object literal is written
 * `(state) => ({ ... })`, so the brace sits behind a paren and an anchored
 * `^\s*[{]` misses the single most common shape of this bug.
 */
const ALLOCATING = /\.(map|filter|sort|slice|concat|flatMap)\(|\.\.\.|^\s*\(?\s*[[{]/;

describe('zustand selectors return stable references', () => {
  it('found some selectors to check', () => {
    const all = files.flatMap((f) => selectorBodies(f.body));
    expect(all.length).toBeGreaterThan(2);
  });

  it('never allocate a new array or object', () => {
    const offenders: string[] = [];

    for (const file of files) {
      for (const { name, expression } of selectorBodies(file.body)) {
        if (ALLOCATING.test(expression)) {
          offenders.push(`${file.path} → ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  /**
   * The tamper guard. A pattern that matches nothing passes forever, and this
   * is the exact expression that broke the Write tab.
   */
  it('would catch the selector that caused the crash', () => {
    expect(ALLOCATING.test('[...state.drafts].sort((a, b) => b.updatedAt - a.updatedAt)')).toBe(true);
    expect(ALLOCATING.test('state.entries.filter((e) => e.isDraft)')).toBe(true);
    expect(ALLOCATING.test('({ a: state.a, b: state.b })')).toBe(true);
  });

  it('does not flag a plain property read or a computed primitive', () => {
    expect(ALLOCATING.test('state.drafts')).toBe(false);
    expect(ALLOCATING.test('state.pendingIds.length')).toBe(false);
  });
});
