import { describe, expect, it } from 'vitest';

import { pseudoString } from './pseudo';
import { NAMESPACES, resources } from './resources';

type Leaf = { path: string; value: string };

function flatten(bundle: unknown, prefix = ''): Leaf[] {
  if (typeof bundle === 'string') return [{ path: prefix, value: bundle }];
  if (typeof bundle !== 'object' || bundle === null) return [];

  return Object.entries(bundle).flatMap(([key, value]) =>
    flatten(value, prefix === '' ? key : `${prefix}.${key}`),
  );
}

const locales = Object.entries(resources) as [
  string,
  Record<string, unknown>,
][];

const enLeaves = flatten(resources.en);

describe('bundle structure', () => {
  it('ships every namespace the app expects', () => {
    for (const namespace of NAMESPACES) {
      expect(Object.keys(resources.en)).toContain(namespace);
    }
    expect(Object.keys(resources.en)).toHaveLength(NAMESPACES.length);
  });

  it('has no empty strings', () => {
    for (const leaf of enLeaves) {
      expect(leaf.value.trim()).not.toBe('');
    }
  });
});

describe('key parity', () => {
  // Only `en` ships today. The check exists so that the day a second locale
  // lands, a missing key is a failing test rather than a raw key on screen.
  const enPaths = new Set(enLeaves.map((l) => l.path));

  it('gives every locale exactly the keys en has', () => {
    for (const [tag, bundle] of locales) {
      const paths = new Set(flatten(bundle).map((l) => l.path));

      const missing = [...enPaths].filter((p) => !paths.has(p));
      const extra = [...paths].filter((p) => !enPaths.has(p));

      expect({ tag, missing }).toEqual({ tag, missing: [] });
      expect({ tag, extra }).toEqual({ tag, extra: [] });
    }
  });
});

describe('plural forms', () => {
  const suffixed = enLeaves.filter((l) => /_(one|other)$/.test(l.path));

  it('gives every count-bearing string both forms', () => {
    // `{{count}}` is i18next's plural trigger. A key using it without an
    // `_other` sibling is how an app ends up saying "1 things waiting".
    const withCount = enLeaves.filter((l) => l.value.includes('{{count}}'));
    expect(withCount.length).toBeGreaterThan(0);

    for (const leaf of withCount) {
      expect(leaf.path).toMatch(/_(one|other)$/);
    }
  });

  it('never leaves a plural form without its pair', () => {
    const paths = new Set(suffixed.map((l) => l.path));

    for (const path of paths) {
      const stem = path.replace(/_(one|other)$/, '');
      expect(paths.has(`${stem}_one`)).toBe(true);
      expect(paths.has(`${stem}_other`)).toBe(true);
    }
  });

  it('covers the strings the copy guide calls out', () => {
    const paths = new Set(enLeaves.map((l) => l.path));
    for (const stem of [
      'worry.pending',
      'progress.streak',
      'notifications.worryWindowSoon',
    ]) {
      expect(paths.has(`${stem}_one`)).toBe(true);
      expect(paths.has(`${stem}_other`)).toBe(true);
    }
  });
});

describe('tone', () => {
  // systems/07-copy-and-tone.md, made mechanical. This is the plan 16 tone
  // audit; running it here means it cannot be skipped.

  it('contains no exclamation marks anywhere', () => {
    const offenders = enLeaves.filter((l) => l.value.includes('!'));
    expect(offenders).toEqual([]);
  });

  /**
   * The rule is "never all-caps, it reads as shouting" — which is about
   * SETTING WORDS IN CAPS FOR EMPHASIS, not about the handful of names that
   * are simply spelled that way.
   *
   * Session 14 added j1, j3 and k4 and hit four: "Face ID" twice, "Your GP",
   * and "Text SHOUT to 85258". None of them is emphasis. `Face ID` is Apple's
   * product name and lowercasing it is wrong on the platform's own terms; `GP`
   * is how everyone in the UK writes it; and `SHOUT` is the literal SMS
   * keyword a person types to reach a crisis service — the one string in the
   * app where altering the casing could plausibly stop something working.
   *
   * So the allowance is an explicit list rather than a looser pattern. A
   * pattern like "ignore words under five letters" would quietly permit
   * "STOP" and "FREE" and every other shouted word this test exists to
   * catch. Adding a name here should require the same argument these four
   * had to make.
   */
  it('contains no all-caps words, proper nouns aside', () => {
    const PROPER_NOUNS = ['Face ID', 'GP', 'SHOUT'];

    const offenders = enLeaves.filter((l) => {
      let text = l.value.replace(/\{\{[^}]+\}\}/g, '');
      for (const name of PROPER_NOUNS) text = text.split(name).join('');
      return /\b[A-Z]{2,}\b/.test(text);
    });
    expect(offenders).toEqual([]);
  });

  /** The allowance above must not have turned the rule off. */
  it('still catches a genuinely shouted word', () => {
    const shouted = 'Tap START to begin';
    let text = shouted;
    for (const name of ['Face ID', 'GP', 'SHOUT']) text = text.split(name).join('');
    expect(/\b[A-Z]{2,}\b/.test(text)).toBe(true);
  });

  it('contains no emoji', () => {
    // The three feeling faces are the one exception, and they live in the
    // component rather than here precisely so this test can stay absolute.
    const offenders = enLeaves.filter((l) => /\p{Extended_Pictographic}/u.test(l.value));
    expect(offenders).toEqual([]);
  });

  it('never diagnoses', () => {
    // The disclaimer keys are allowed to name what Calma is *not* — both app
    // stores scrutinise mental-health claims, and "not treatment" is a
    // disclaimer rather than a diagnosis.
    const disclaimers = new Set(['settings.help.body']);
    const banned = /\b(your anxiety|disorder|symptoms?|diagnos\w*|treatment|therapy|patient)\b/i;

    const offenders = enLeaves.filter(
      (l) => !disclaimers.has(l.path) && banned.test(l.value),
    );
    expect(offenders).toEqual([]);
  });

  it('never guilts or hurries', () => {
    const banned = /\b(don't forget|you missed|you haven't|hurry|last chance|act now)\b/i;
    const offenders = enLeaves.filter((l) => banned.test(l.value));
    expect(offenders).toEqual([]);
  });

  it('uses the words from the replacement table', () => {
    const banned = /\b(error|failed|invalid|are you sure)\b/i;
    const offenders = enLeaves.filter((l) => banned.test(l.value));
    expect(offenders).toEqual([]);
  });

  it('says nothing at all about losing a streak', () => {
    const offenders = enLeaves.filter((l) => /streak/i.test(l.value));
    expect(offenders).toEqual([]);
  });

  it('uses named interpolation only', () => {
    // Positional placeholders would stop a translator reordering a sentence.
    const offenders = enLeaves.filter((l) =>
      /\{\{\s*\d+\s*\}\}|\{\d+\}|%[sd]/.test(l.value),
    );
    expect(offenders).toEqual([]);
  });
});

describe('the pseudo-locale', () => {
  it('inflates a string by roughly 40% and brackets it', () => {
    const out = pseudoString('Breathe in');
    expect(out.startsWith('[')).toBe(true);
    expect(out.endsWith(']')).toBe(true);
    expect(out.length).toBeGreaterThan('Breathe in'.length * 1.35);
  });

  it('leaves interpolation placeholders intact', () => {
    const out = pseudoString('You have {{count}} things waiting.');
    expect(out).toContain('{{count}}');
  });

  it('handles several placeholders in one string', () => {
    const out = pseudoString('{{a}} of {{b}}');
    expect(out).toContain('{{a}}');
    expect(out).toContain('{{b}}');
  });

  it('inflates every string in the real bundle without losing one', () => {
    for (const leaf of enLeaves) {
      const out = pseudoString(leaf.value);
      expect(out.length).toBeGreaterThanOrEqual(leaf.value.length);
      for (const placeholder of leaf.value.match(/\{\{[^}]+\}\}/g) ?? []) {
        expect(out).toContain(placeholder);
      }
    }
  });
});
