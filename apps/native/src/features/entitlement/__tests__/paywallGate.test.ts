import { describe, expect, it } from 'vitest';

import {
  SETTLE_MS,
  paywallDecision,
  type Blocker,
  type PaywallContext,
} from '../paywallGate';

/**
 * Every condition plan 11 T12 lists, asserted one at a time.
 *
 * The plan asks for exactly this -- "a test asserts each condition" -- and
 * the reason it asks is `plans/19-review-findings.md` R4: the review that
 * ended "I hope no one ever downloads this game again" was about something
 * commercial appearing mid-task, not about monetisation existing at all.
 */

const NOW = 1_800_000_000_000;

function context(patch: Partial<PaywallContext> = {}): PaywallContext {
  return {
    blockers: new Set(),
    completedAt: null,
    now: NOW,
    today: '2026-08-13',
    shown: [],
    markerDay: null,
    suppressed: false,
    ...patch,
  };
}

describe('nothing commercial appears while something is in flight (T12)', () => {
  const blockers: Blocker[] = [
    'session',
    'panic',
    'worryWindow',
    'editor',
    'field',
    'animation',
  ];

  it.each(blockers)('%s silences the paywall entirely', (blocker) => {
    // Silent, not inline. "That's 3 for today" is still the app talking about
    // money while someone is in the middle of something.
    expect(paywallDecision('worry', context({ blockers: new Set([blocker]) }))).toBe(
      'silent',
    );
  });

  it('stays silent for a few seconds after something completes', () => {
    expect(
      paywallDecision('worry', context({ completedAt: NOW - SETTLE_MS + 1 })),
    ).toBe('silent');
  });

  it('speaks again once the moment has passed', () => {
    expect(
      paywallDecision('worry', context({ completedAt: NOW - SETTLE_MS - 1 })),
    ).toBe('sheet');
  });

  it('is not fooled by a completion in the future', () => {
    // Clock changes move `Date.now()` backwards. A future timestamp must fail
    // toward silence rather than toward selling.
    expect(paywallDecision('worry', context({ completedAt: NOW + 60_000 }))).toBe(
      'silent',
    );
  });
});

describe('a limit sells at most once a day (T07)', () => {
  it('shows the sheet the first time', () => {
    expect(paywallDecision('journal', context())).toBe('sheet');
  });

  it('drops to one inline line the second time the same day', () => {
    expect(
      paywallDecision(
        'journal',
        context({ markerDay: '2026-08-13', shown: ['journal'] }),
      ),
    ).toBe('inline');
  });

  it('keeps each limit type on its own schedule', () => {
    // Hitting the worry limit does not spend the journal limit's one showing.
    expect(
      paywallDecision(
        'worry',
        context({ markerDay: '2026-08-13', shown: ['journal'] }),
      ),
    ).toBe('sheet');
  });

  it('resets at local midnight rather than after 24 hours', () => {
    expect(
      paywallDecision(
        'journal',
        context({ markerDay: '2026-08-12', shown: ['journal'] }),
      ),
    ).toBe('sheet');
  });
});

describe('a build that cannot sell says nothing at all', () => {
  it('is silent when purchasing is unavailable', () => {
    // systems/05-entitlements.md: SDK init failure yields free tier with
    // paywalls SUPPRESSED. Selling to someone whose purchase would fail
    // anyway is the worst of both.
    expect(paywallDecision('worry', context({ suppressed: true }))).toBe('silent');
  });

  it('stays silent even on a repeat hit', () => {
    expect(
      paywallDecision(
        'worry',
        context({ suppressed: true, markerDay: '2026-08-13', shown: ['worry'] }),
      ),
    ).toBe('silent');
  });
});
