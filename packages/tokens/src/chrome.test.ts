import { gunzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { dark, light } from './colors';

/**
 * THE FURNITURE, WHICH NO SCREEN'S AUDIT WILL EVER COVER.
 *
 * The tab bar was wrong on all five tabs for five sessions. It rendered as
 * React Navigation's default full-width bar in `--background` while every
 * design in the set draws a floating shelf. Nobody caught it, and the reason
 * is structural rather than careless: the per-session audit step says *"for
 * each screen you built, open its design file"*, and the tab bar is not a
 * screen. It belongs to no plan, so no plan's audit reaches it.
 *
 * The same exposure applies to anything that appears on top of everything —
 * the panic FAB, the home indicator, the shelf. This file is the audit those
 * things do not otherwise get, and it pins GEOMETRY as well as colour, because
 * the shelf's bug was mostly geometry: a bar is a shelf with the wrong
 * position, height, radius and margins, wearing the right palette.
 *
 * It reads the delivered designs directly, so it cannot drift from them the
 * way a hardcoded expectation would.
 */

const DESIGNS = join(import.meta.dirname, '../../../designs/html');

function decodeBundle(html: string): string {
  const template = /<script type="__bundler\/template">(.*?)<\/script>/s.exec(
    html,
  );
  if (!template?.[1]) return '';

  const manifest = /<script type="__bundler\/manifest">(.*?)<\/script>/s.exec(
    html,
  );

  let assets = '';
  if (manifest?.[1]) {
    const entries = JSON.parse(manifest[1]) as Record<
      string,
      { mime: string; compressed?: boolean; data: string }
    >;
    for (const entry of Object.values(entries)) {
      if (!entry.mime.startsWith('text/')) continue;
      const raw = Buffer.from(entry.data, 'base64');
      assets += (entry.compressed ? gunzipSync(raw) : raw).toString('utf8');
    }
  }

  return (JSON.parse(template[1]) as string) + assets;
}

const markup = readdirSync(DESIGNS)
  .filter((name) => name.endsWith('.html'))
  .map((name) => decodeBundle(readFileSync(join(DESIGNS, name), 'utf8')))
  .join('\n');

/** Every `style="..."` block that looks like the tab shelf. */
const shelfStyles = [
  ...markup.matchAll(/style="([^"]*height: 78px; margin: 0 16px 30px[^"]*)"/g),
].map((match) => match[1] ?? '');

describe('the tab shelf', () => {
  it('is drawn on more than one screen, so this test has something to check', () => {
    // A pattern that matches nothing passes forever. This is the tamper guard.
    expect(shelfStyles.length).toBeGreaterThan(5);
  });

  /**
   * The four numbers the shipped bar got wrong. `_layout.tsx` must keep
   * agreeing with these; if a redesign moves them, this fails and the layout
   * is updated deliberately rather than drifting.
   */
  it('is 78 tall, inset 16, lifted 30, with a 28 radius', () => {
    for (const style of shelfStyles) {
      expect(style).toContain('height: 78px');
      expect(style).toContain('margin: 0 16px 30px');
      expect(style).toContain('border-radius: 28px');
    }
  });

  it('floats: every instance carries a shadow, not a top hairline', () => {
    for (const style of shelfStyles) {
      expect(style).toContain('box-shadow');
      expect(style).not.toContain('border-top:');
    }
  });

  /**
   * THE ASSERTION THAT FOUND THE BUG.
   *
   * Session 16 tokenised ONE shelf. There are three: the shelf is mixed
   * against the ground it stands on, exactly as `surfaceQuiet`,
   * `surfaceImmersive` and `surfaceWorryQuiet` are. This test failed on its
   * first run and is the reason `shelfWorry` and `shelfWrite` exist.
   */
  it('is one of the three tokenised shelves, on every screen that draws it', () => {
    const known = [
      light.shelf,
      light.shelfWorry,
      light.shelfWrite,
      dark.shelf,
      dark.shelfWorry,
      dark.shelfWrite,
    ];

    for (const style of shelfStyles) {
      const background = /background: (#[0-9A-Fa-f]{6})/.exec(style)?.[1];
      expect(known, `shelf background ${background} has no token`).toContain(
        background,
      );
    }
  });

  it('never stands on the ordinary background', () => {
    expect(light.shelf).not.toBe(light.bg);
    expect(dark.shelf).not.toBe(dark.bg);
  });

  /** All three are distinct. Collapsing them is the mistake this file caught. */
  it('has a distinct value per ground, in both themes', () => {
    expect(new Set([light.shelf, light.shelfWorry, light.shelfWrite]).size).toBe(3);
    expect(new Set([dark.shelf, dark.shelfWorry, dark.shelfWrite]).size).toBe(3);
  });

  it('has a border that is not the ordinary card border', () => {
    expect(light.shelfBorder).not.toBe(light.border);
    expect(dark.shelfBorder).not.toBe(dark.border);
  });
});

describe('the panic FAB', () => {
  const fabStyles = [
    ...markup.matchAll(/style="([^"]*width: 72px; height: 72px[^"]*)"/g),
  ].map((match) => match[1] ?? '');

  it('appears on the screens that have a tab bar', () => {
    expect(fabStyles.length).toBeGreaterThan(5);
  });

  /**
   * 72px, and it is a rule rather than a preference: `control.panicFab` says
   * "sized to be hittable by shaking hands". If a future design shrinks it,
   * that is a decision someone has to make on purpose.
   */
  it('is 72px and circular on every screen that draws it', () => {
    for (const style of fabStyles) {
      expect(style).toContain('border-radius: 50%');
    }
  });

  it('is a gradient with a coloured glow, never a flat fill', () => {
    for (const style of fabStyles) {
      expect(style).toContain('linear-gradient(158deg');
      expect(style).toContain('box-shadow');
    }
  });

  /** It clears the shelf rather than sitting on it. */
  it('sits above the shelf, not inside it', () => {
    for (const style of fabStyles) {
      expect(style).toMatch(/bottom: 1\d\dpx/);
    }
  });
});
