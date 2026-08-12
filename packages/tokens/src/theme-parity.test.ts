import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  fontVars,
  radiusVars,
  spacingVars,
  staticColors,
  themedColors,
} from './tailwind';

/**
 * The tokens and the stylesheet must not drift.
 *
 * Tailwind v4 is CSS-first, so the theme has to be written as literal CSS --
 * which means the design tokens exist twice: once as TypeScript that the
 * whole app imports, once as custom properties that only the bundler reads.
 * Two copies of the same truth is exactly the arrangement that rots.
 *
 * It rotted once already, silently and for three sessions: the old v3 JS
 * preset was never loaded by anything, so the tokens described a warm room
 * while the app rendered in heroui's stock blue and no test complained.
 *
 * This is the test that would have caught it on day one.
 */

const themeCss = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../apps/native/global.css'),
  'utf8',
);

/** The body of `:root { @variant <theme> { ... } }`, brace-matched. */
function variantBlock(theme: 'light' | 'dark'): string {
  const start = themeCss.indexOf(`@variant ${theme} {`);
  expect(start, `global.css has no @variant ${theme} block`).toBeGreaterThan(-1);

  let depth = 0;
  for (let i = themeCss.indexOf('{', start); i < themeCss.length; i += 1) {
    if (themeCss[i] === '{') depth += 1;
    if (themeCss[i] === '}') {
      depth -= 1;
      if (depth === 0) return themeCss.slice(start, i);
    }
  }

  throw new Error(`unterminated @variant ${theme} block`);
}

const blocks = { light: variantBlock('light'), dark: variantBlock('dark') };

/**
 * Every `--name: value;` in a chunk of CSS, as a map.
 *
 * Parsed rather than pattern-matched per lookup. Building one regex per
 * expected value means escaping arbitrary token strings, and token strings
 * include `rgba(190,116,88,0.12)` — parentheses, dots and all — which is the
 * kind of escaping that is wrong once and then quietly matches nothing.
 */
function declarations(css: string): Map<string, string> {
  const found = new Map<string, string>();

  for (const match of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    // Last write wins, which is also how the cascade reads it.
    found.set(match[1]!.toLowerCase(), normalise(match[2]!));
  }

  return found;
}

/**
 * Values are compared without whitespace and case-insensitively.
 *
 * `#E39A45` is `#e39a45`, and `rgba(190, 116, 88, 0.12)` is
 * `rgba(190,116,88,0.12)`. The stylesheet is allowed to be formatted like
 * CSS rather than like a TypeScript string literal — the point of this test
 * is that the colours agree, not that the spacing does.
 */
function normalise(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

const declared = {
  light: declarations(blocks.light),
  dark: declarations(blocks.dark),
  all: declarations(themeCss),
};

function declares(scope: Map<string, string>, name: string, value: string): boolean {
  return scope.get(name.toLowerCase()) === normalise(value);
}

describe('theme parity between @calma/tokens and apps/native/global.css', () => {
  describe.each(['light', 'dark'] as const)('%s', (theme) => {
    it.each(themedColors)('--$cssVar', (entry) => {
      const expected = theme === 'light' ? entry.lightValue : entry.darkValue;
      expect(
        declared[theme].get(entry.cssVar),
        `--${entry.cssVar} in the @variant ${theme} block`,
      ).toBe(normalise(expected));
    });
  });

  it.each(Object.entries(staticColors))('%s is theme-independent', (name, value) => {
    expect(declares(declared.all, name, value)).toBe(true);
    // A static colour must not also be overridden per theme, or it is not
    // static and the name is lying.
    expect(declared.light.has(name.toLowerCase())).toBe(false);
    expect(declared.dark.has(name.toLowerCase())).toBe(false);
  });

  it.each([
    ...Object.entries(fontVars),
    ...Object.entries(spacingVars),
    ...Object.entries(radiusVars),
  ])('%s', (name, value) => {
    expect(declares(declared.all, name, value)).toBe(true);
  });
});

describe('the rules that survive any visual revision', () => {
  /**
   * systems/03-design-system.md. These are not style preferences: a red alert
   * to an anxious person is a small act of harm, and pure black on pure white
   * is the clinic we are deliberately not.
   */
  it('uses no pure white and no pure black', () => {
    const hexes = themeCss.match(/#[0-9a-f]{6}\b/gi) ?? [];
    expect(hexes.map((h) => h.toUpperCase())).not.toContain('#FFFFFF');
    expect(hexes.map((h) => h.toUpperCase())).not.toContain('#000000');
  });

  it('declares no danger or error colour of its own', () => {
    // heroui ships `--danger` and we do not override it, because nothing in
    // Calma is ever an error. If a future commit sets one, it is a mistake
    // worth stopping for -- problems are stated in navy text with a clay
    // accent, and this test is where that decision is enforced.
    for (const block of [blocks.light, blocks.dark]) {
      expect(block).not.toMatch(/--danger\s*:/);
      expect(block).not.toMatch(/--error\s*:/);
    }
  });

  it('drops amber intensity in dark mode', () => {
    // The 2am rule. A full-strength fill sears a dark-adapted eye, so the
    // dark accent must be a genuinely different, quieter value.
    const accent = themedColors.find((c) => c.cssVar === 'accent');
    expect(accent?.lightValue).not.toBe(accent?.darkValue);
  });

  it('keeps a separate warm text colour in dark mode', () => {
    // D-017. If these ever collapse, every serif line in the app starts
    // reading like a system notification and nothing else will flag it.
    const warm = themedColors.find((c) => c.cssVar === 'warm');
    const foreground = themedColors.find((c) => c.cssVar === 'foreground');
    expect(warm?.darkValue).not.toBe(foreground?.darkValue);
  });
});
