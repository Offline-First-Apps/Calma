import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The guarantees the journal makes about not losing what someone wrote
 * (plan 09 T13), checked by reading the source.
 *
 * WHY THIS READS FILES RATHER THAN RENDERING.
 *
 * "No code path clears the editor without an explicit discard" is a claim
 * about every path, including the ones a future commit adds. A render test
 * can only show that the paths it happened to try did not clear anything,
 * which is the weaker statement and stops being true the moment someone adds
 * a branch. Reading the source proves the mechanism is absent. Same reasoning
 * and same shape as `features/onboarding/__tests__/guards.test.ts` and
 * `packages/tokens/src/theme-parity.test.ts`.
 *
 * The thing being protected: a half-written journal entry is the most
 * emotionally costly thing this app holds. Losing one is worse than a crash,
 * because a crash does not take anything with it
 * (`plans/19-review-findings.md` R3).
 */

const journal = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const features = resolve(journal, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      // Not the test folder. A test that names the forbidden things must not
      // be scanned for them.
      return item.name === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(item.name) && !item.name.endsWith('.test.ts')
      ? [path]
      : [];
  });
}

/**
 * Comments say what must never happen; code is what would make it happen.
 *
 * Without this every rule below trips on the comment explaining it, and the
 * fix people reach for is deleting the explanation.
 */
function stripComments(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const files = sourceFiles(journal).map((path) => ({
  path: path.slice(journal.length + 1),
  body: stripComments(readFileSync(path, 'utf8')),
}));

const editor = files.find((f) => f.path === 'EditorScreen.tsx');
const store = files.find((f) => f.path === 'store.ts');

describe('the journal source', () => {
  it('was actually found', () => {
    // A path that silently resolves to nothing would make every rule below
    // pass forever. This is the negative control for the whole file.
    expect(files.length).toBeGreaterThan(6);
    expect(files.map((f) => f.path)).toContain('EditorScreen.tsx');
    expect(files.map((f) => f.path)).toContain('useAutosave.ts');
  });
});

describe('nothing clears what someone typed', () => {
  it('the editor never assigns an empty string to a field', () => {
    // `onChange({ situation: '' })`, `setEntry({ ...blank })` and friends.
    // The editor writes only what the person typed.
    expect(editor!.body).not.toMatch(/:\s*''\s*[,}]/);
    expect(editor!.body).not.toMatch(/\bblankEntry\b/);
  });

  it('the editor holds no reset, clear or discard of its own', () => {
    for (const forbidden of [/\bclear\w*\(/i, /\breset\w*\(/i, /\bsetEntry\(null\)/]) {
      expect(editor!.body).not.toMatch(forbidden);
    }
  });

  it('only the store deletes, and only from an explicit discard', () => {
    // `repo.delete` appears exactly once in the whole feature, inside
    // `discard`. Anything else calling it is a second way to destroy writing.
    const deletions = files.filter((f) => /\.delete\(/.test(f.body));
    expect(deletions.map((f) => f.path)).toEqual(['store.ts']);
    expect(store!.body.match(/\.delete\(/g)).toHaveLength(1);
  });

  it('discarding is reached from a confirmation, never from a save or a limit', () => {
    const drafts = files.find((f) => f.path === 'DraftList.tsx')!;
    expect(drafts.body).toMatch(/setConfirming\(true\)/);
    // The confirmation is a state the card enters, not an OS alert: an alert
    // is a modal in a foreign material, and it is the one control style the
    // designs never use.
    expect(drafts.body).not.toMatch(/\bAlert\b/);
  });
});

describe('saving cannot cost anyone a word or an allowance', () => {
  it('save is idempotent for 600ms', () => {
    // A lagging double-tap must not create two entries or burn two weekly
    // allowances (R1). Same window and same reason as the capture field.
    expect(editor!.body).toMatch(/SAVE_LOCKOUT_MS\s*=\s*600/);
    expect(editor!.body).toMatch(/now - lastSave\.current < SAVE_LOCKOUT_MS/);
  });

  it('finishing flips a flag rather than rewriting the entry', () => {
    // `finish` sets `isDraft: false` and touches nothing else. A finish that
    // rebuilt the record is a finish that can drop a field.
    expect(store!.body).toMatch(/isDraft:\s*false/);
  });

  it('autosave writes continuously rather than on blur', () => {
    const autosave = files.find((f) => f.path === 'useAutosave.ts')!;
    expect(autosave.body).toMatch(/DEBOUNCE_MS\s*=\s*800/);
    // Backgrounding and unmount, because a suspended app can be killed
    // without ever running code again.
    expect(autosave.body).toMatch(/AppState\.addEventListener/);
    expect(autosave.body).not.toMatch(/onBlur/);
  });
});

describe('the panic path never reaches the journaling offer', () => {
  /**
   * Plan 07: no modal, prompt or offer may appear on the panic path. Session
   * 12 found a `panic?: boolean` flag that had quietly put one there, and the
   * fix was to remove the mechanism rather than the call. This is the test
   * that keeps it removed.
   */
  const panicFiles = ['breathing/PanicSession.tsx', 'breathing/PanicEnding.tsx'].map(
    (path) => ({
      path,
      body: stripComments(readFileSync(join(features, path), 'utf8')),
    }),
  );

  it.each(panicFiles)('$path does not import the offer', (file) => {
    expect(file.body).not.toMatch(/JournalOffer/);
    expect(file.body).not.toMatch(/shouldOfferJournaling/);
    expect(file.body).not.toMatch(/journal\//);
  });

  it('the panic screens exist and were read', () => {
    // Negative control: a typo in a path above would otherwise assert
    // nothing, forever.
    expect(panicFiles.every((f) => f.body.length > 200)).toBe(true);
  });
});
