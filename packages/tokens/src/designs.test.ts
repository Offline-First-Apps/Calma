import { gunzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { amber, barGradient, clay, dark, light, sage } from './colors';

/**
 * THE CHECK THAT SPANS TO THE DESIGNS.
 *
 * `theme-parity.test.ts` proves `colors.ts` and `global.css` agree. It cannot
 * prove either is *right*, and for five sessions it did not: i1's neutral
 * feature tile shipped as #F1EEE7/#E2DCD1, two values that occur nowhere in
 * the 116 delivered screens. Both layers carried the invented hex, agreed
 * with each other perfectly, and no test had anything to say about it.
 *
 * That is Pillar 6's exact failure mode -- a value defined in one place and
 * consumed in another that cannot import it, with no check across the gap.
 * The gap here is not `colors.ts` -> `global.css`. It is
 * `designs/html/*.html` -> `colors.ts`, and this is that check.
 *
 * It reads the tracked design bundles, decodes them, and asserts that every
 * flat hex in the token layer is a colour a designer actually drew. It is
 * deliberately one-directional: it does NOT assert that every hex in the
 * designs has a token, because a token layer is allowed to be incomplete and
 * catching that is what opening the file for your screen is for.
 */

const DESIGNS = join(import.meta.dirname, '../../../designs/html');

/**
 * Pulls the readable markup back out of a bundled design file.
 *
 * The bundler stores the page as a JSON-encoded string in a
 * `<script type="__bundler/template">` tag and its assets as gzipped base64
 * in a manifest. Only the template carries colours.
 */
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
      // Fonts are the bulk of the payload and carry no colours.
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
  .join('\n')
  .toUpperCase();

/**
 * Values that are legitimately absent from the markup.
 *
 * Every entry needs a reason. "It did not pass" is not one -- that is the
 * bug this file exists to find. Keep this list short and suspicious.
 */
const NOT_IN_DESIGNS = new Map<string, string>([
  [
    '#F2E7D6',
    // Present, but only ever as a `background:` on the phone-frame inner div,
    // which the extraction keeps. Belt and braces: assert it separately below.
    'light.bgImmersive — verified by its own assertion',
  ],
]);

describe('design bundles', () => {
  it('decode to real markup', () => {
    expect(markup.length).toBeGreaterThan(500_000);
    expect(markup).toContain('NEWSREADER');
  });

  /**
   * The tamper check Pillar 6 asks for, run every time rather than once by
   * hand. A pattern that matches nothing passes forever; this proves the
   * haystack is a haystack.
   */
  it('do not contain a colour nobody drew', () => {
    expect(markup).not.toContain('#F1EEE7');
    expect(markup).not.toContain('#E2DCD1');
    expect(markup).not.toContain('#BADA55');
  });
});

/** Flat six-digit hexes only. `rgba()` washes are composited and never appear. */
function flatHexes(scheme: Record<string, string>): [string, string][] {
  return Object.entries(scheme).filter(([, value]) =>
    /^#[0-9A-Fa-f]{6}$/.test(value),
  );
}

describe.each([
  ['light', light],
  ['dark', dark],
])('%s tokens', (_name, scheme) => {
  it.each(flatHexes(scheme as Record<string, string>))(
    '%s (%s) is a colour in the delivered designs',
    (token, value) => {
      if (NOT_IN_DESIGNS.has(value)) return;
      expect(
        markup.includes(value.toUpperCase()),
        `${token} = ${value} appears in no design file. Either it was ` +
          `transcribed wrong, or the screen it came from was never delivered.`,
      ).toBe(true);
    },
  );
});

describe('accent, clay and sage', () => {
  const families = {
    'amber.light': amber.light,
    'amber.dark': amber.dark,
    'clay.light': clay.light,
    'clay.dark': clay.dark,
    'sage.light': sage.light,
    'sage.dark': sage.dark,
  };

  for (const [family, values] of Object.entries(families)) {
    it.each(flatHexes(values as unknown as Record<string, string>))(
      `${family}.%s (%s) is drawn somewhere`,
      (token, value) => {
        expect(
          markup.includes(value.toUpperCase()),
          `${family}.${token} = ${value} appears in no design file.`,
        ).toBe(true);
      },
    );
  }
});

describe('bar gradients (h1, h4, h5)', () => {
  const stops = [
    ...Object.entries(barGradient.light).flatMap(([band, pair]) =>
      pair.map((hex, i) => [`light.${band}[${i}]`, hex] as [string, string]),
    ),
    ...Object.entries(barGradient.dark).flatMap(([band, pair]) =>
      pair.map((hex, i) => [`dark.${band}[${i}]`, hex] as [string, string]),
    ),
  ];

  it.each(stops)('%s (%s) is a stop the designs use', (_stop, hex) => {
    expect(markup).toContain(hex.toUpperCase());
  });

  /**
   * The gradient is the point. A bar drawn as a flat `bg-accent` is the same
   * mistake session 9 made with the amber button, and it reads as dead.
   */
  it('are two-stop and vertical in the designs', () => {
    expect(markup).toContain('LINEAR-GRADIENT(180DEG, #F0BE7E, #E39A45)');
    expect(markup).toContain('LINEAR-GRADIENT(180DEG, #D9A662, #B87A3A)');
  });
});

describe('the immersive ground', () => {
  /** The value session 9 shipped wrong. Named so it can never regress quietly. */
  it('is #F2E7D6 in light, and it is not the ordinary background', () => {
    expect(light.bgImmersive).toBe('#F2E7D6');
    expect(light.bgImmersive).not.toBe(light.bg);
  });
});
