import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The absolutes, checked by reading the source (plan 13 T15).
 *
 * WHY THIS READS FILES INSTEAD OF RENDERING COMPONENTS.
 *
 * "No paywall, price, plan, account prompt or review request can render
 * during onboarding" is not a claim about one code path. It is a claim about
 * every possible one, including the ones a future commit adds. A render test
 * can only ever demonstrate that the paywall did not appear on the paths it
 * happened to try — which is the weaker statement, and the one that stops
 * being true the moment someone adds a branch.
 *
 * Reading the source proves the mechanism is not present at all. It is a
 * blunter tool and it is the correct one here, because these rules are
 * absolute rather than conditional. `packages/tokens/src/theme-parity.test.ts`
 * reaches across packages for the same reason.
 *
 * The complementary flow tests are in `@calma/domain`, where the machine is.
 * Neither covers what T15 also asks for and only a person can do: VoiceOver,
 * 200% font scale, Reduce Motion and the pseudo-locale, on both platforms.
 */

const onboarding = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Not this folder. A test naming the forbidden things must not be
      // scanned for them.
      return entry.name === '__tests__' ? [] : sourceFiles(path);
    }
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/**
 * Comments say what must never happen; code is what would make it happen.
 *
 * Without this, every rule below would be tripped by the comment explaining
 * it — and the fix people would reach for is deleting the explanation.
 */
function stripComments(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const files = sourceFiles(onboarding).map((path) => ({
  path: path.slice(onboarding.length + 1),
  body: stripComments(readFileSync(path, 'utf8')),
}));

describe('the onboarding source', () => {
  it('was actually found', () => {
    // A path that silently resolves to an empty list would make every rule
    // below pass forever.
    expect(files.length).toBeGreaterThan(8);
    expect(files.map((f) => f.path)).toContain('OnboardingFlow.tsx');
  });
});

describe('what onboarding must never do', () => {
  /** `systems/11-onboarding.md`, the section of that name. */
  const forbidden: Array<{ what: string; pattern: RegExp }> = [
    { what: 'route to the paywall', pattern: /['"`]\/paywall['"`]/ },
    { what: 'mention Plus, a price, or a plan', pattern: /\bPlus\b|\$\d|\bmonthly\b|\bsubscri/i },
    { what: 'check an entitlement or a purchase', pattern: /revenuecat|entitlement|\bpurchases?\b/i },
    { what: 'ask for an account, an email or a social login', pattern: /signIn|signUp|\bOAuth\b|appleAuth|\bemail\b/i },
    { what: 'request an app-store review', pattern: /StoreReview|requestReview/i },
    { what: 'run a countdown or a timer', pattern: /countdown|setInterval|expiresIn/i },
  ];

  it.each(forbidden)('does not $what', ({ pattern }: { pattern: RegExp }) => {
    expect(files.filter((file) => pattern.test(file.body)).map((f) => f.path)).toEqual([]);
  });

  it('does not request a notification permission without the custom screen', () => {
    // The OS dialog is fired from exactly one place, and that place is the
    // screen that has already shown the person the real notification.
    const callers = files
      .filter((file) => /requestNotificationPermission/.test(file.body))
      .map((file) => file.path);

    expect(callers).toEqual(['steps/Notifications.tsx']);
  });
});

describe('the crisis exit', () => {
  const frame = () => files.find((file) => file.path === 'StepFrame.tsx')!;
  const flow = () => files.find((file) => file.path === 'OnboardingFlow.tsx')!;

  it('is rendered by the frame every step goes through', () => {
    // Structural, not per-step: the exit is not a prop, so a step cannot
    // express the idea of not having one. That is D-014 made unforgettable.
    expect(frame().body).toContain('<CrisisExit');
    expect(flow().body).toContain('<StepFrame');
  });

  it('cannot be bypassed by a step rendering its own frame', () => {
    const rogue = files
      .filter((file) => file.path.startsWith('steps/') && file.body.includes('<StepFrame'))
      .map((file) => file.path);

    expect(rogue).toEqual([]);
  });

  it('goes to a panic session with no confirmation in between', () => {
    expect(flow().body).toContain("'/panic'");
    expect(flow().body).not.toMatch(/Alert\.alert|window\.confirm/);
  });
});

describe('the transitions', () => {
  const transitions = () => files.find((file) => file.path === 'transitions.ts')!;

  it('contain no horizontal directional motion', () => {
    // "Forward is rightward" is true in English and false in Arabic and
    // Hebrew. The day RTL is added this would be a bug in every screen at
    // once, and nobody would remember it was decided here.
    expect(transitions().body).not.toMatch(/SlideIn|SlideOut|translateX|slide_from/);
  });

  it('shorten rather than remove motion under Reduce Motion', () => {
    expect(transitions().body).toContain('reducedMotion');
  });

  it('use no spring, bounce or overshoot anywhere in the flow', () => {
    const springy = files
      .filter((file) => /withSpring|Easing\.bounce|Easing\.elastic|Easing\.back/.test(file.body))
      .map((file) => file.path);

    expect(springy).toEqual([]);
  });
});

describe('the progress hairline', () => {
  it('is used by onboarding and by nothing else in the app', () => {
    const appSrc = resolve(onboarding, '../..');
    const users = allFiles(appSrc).filter(
      (path) =>
        !path.endsWith(join('ui', 'ProgressHairline.tsx')) &&
        /<ProgressHairline/.test(readFileSync(path, 'utf8')),
    );

    expect(users.map((path) => path.slice(appSrc.length + 1))).toEqual([
      join('features', 'onboarding', 'Progress.tsx'),
    ]);
  });
});

function allFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Same exclusion as above, and for the same reason: a test that names
      // `<ProgressHairline` in order to forbid it elsewhere would otherwise
      // count itself as a second user of it.
      return entry.name === '__tests__' ? [] : allFiles(path);
    }
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}
