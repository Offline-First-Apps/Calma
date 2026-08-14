import type { JournalEntry } from '@calma/domain';
import { weekKey } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import {
  currentWeekOnly,
  groupByDay,
  previewOf,
  splitOnMatch,
} from '../entries';

function entry(patch: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'e1',
    situation: '',
    automaticThought: '',
    emotion: '',
    emotionIntensity: 0,
    evidenceFor: '',
    evidenceAgainst: '',
    balancedThought: '',
    emotionIntensityAfter: null,
    isDraft: false,
    linkedSessionId: null,
    createdAt: new Date(2026, 1, 13, 21, 30).getTime(),
    updatedAt: new Date(2026, 1, 13, 21, 30).getTime(),
    ...patch,
  };
}

describe('groupByDay', () => {
  it('puts two entries from the same evening under one day', () => {
    const days = groupByDay([
      entry({ id: 'a', createdAt: new Date(2026, 1, 13, 21).getTime() }),
      entry({ id: 'b', createdAt: new Date(2026, 1, 13, 8).getTime() }),
    ]);

    expect(days).toHaveLength(1);
    expect(days[0]!.entries.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('separates entries either side of local midnight', () => {
    // 23:50 and 00:10 are twenty minutes and two days apart. Grouping by
    // elapsed hours would file them together and the labels would then
    // disagree with the grouping.
    const days = groupByDay([
      entry({ id: 'late', createdAt: new Date(2026, 1, 13, 23, 50).getTime() }),
      entry({ id: 'past-midnight', createdAt: new Date(2026, 1, 14, 0, 10).getTime() }),
    ]);

    expect(days.map((d) => d.entries[0]!.id)).toEqual(['past-midnight', 'late']);
  });

  it('orders days and entries newest first', () => {
    const days = groupByDay([
      entry({ id: 'old', createdAt: new Date(2026, 1, 1, 12).getTime() }),
      entry({ id: 'new', createdAt: new Date(2026, 1, 20, 12).getTime() }),
    ]);

    expect(days.map((d) => d.entries[0]!.id)).toEqual(['new', 'old']);
  });
});

describe('previewOf', () => {
  it('leads with the situation', () => {
    expect(
      previewOf(entry({ situation: '  Couldn’t sleep  ', automaticThought: 'x' })),
    ).toBe('Couldn’t sleep');
  });

  it('falls through to the next answered prompt', () => {
    // Someone who skipped "what happened" and wrote under "what went through
    // your mind" has not written an untitled entry. They wrote that.
    expect(previewOf(entry({ automaticThought: 'It will go badly' }))).toBe(
      'It will go badly',
    );
  });

  it('returns empty for an entry with nothing in it', () => {
    expect(previewOf(entry())).toBe('');
  });

  it('never falls through to the intensity number', () => {
    // A bare "7" as a list heading would be the app labelling someone's night
    // with a score. Only text fields are candidates.
    expect(previewOf(entry({ emotionIntensity: 7 }))).toBe('');
  });
});

describe('splitOnMatch', () => {
  it('alternates unmatched and matched text', () => {
    expect(splitOnMatch('the interview is on the 14th', 'interview')).toEqual([
      'the ',
      'interview',
      ' is on the 14th',
    ]);
  });

  it('matches case-insensitively but keeps the original casing', () => {
    // Handing someone their own sentence back with the capitalisation
    // changed reads as the app having edited them.
    expect(splitOnMatch('Told Priya', 'priya')).toEqual(['Told ', 'Priya', '']);
  });

  it('finds every occurrence', () => {
    expect(splitOnMatch('one two one', 'one')).toEqual(['', 'one', ' two ', 'one', '']);
  });

  it('returns the line unsplit when there is no query', () => {
    expect(splitOnMatch('anything', '')).toEqual(['anything']);
  });

  it('reassembles to exactly the original text', () => {
    const text = 'Applied. Probably nothing will come of it, but I sent it.';
    expect(splitOnMatch(text, 'it').join('')).toBe(text);
  });

  it('terminates on a query that is only whitespace difference', () => {
    // A needle that could match the empty string would loop forever. The
    // guard is the early return, and this is the negative control for it.
    expect(splitOnMatch('abc', ' ')).toEqual(['abc']);
  });
});

/**
 * Plan 11 T10 — "Journal history & search: Current week only" on free.
 *
 * The assertion that matters most is the last one: this must return a COUNT
 * of what is withheld and never the entries themselves, so that no caller is
 * in a position to render somebody's own writing blurred behind a lock. T10
 * rules out that pattern by name.
 */
describe('currentWeekOnly', () => {
  // Monday 9 Feb 2026 through Sunday 15 Feb 2026 is one ISO week.
  const thisWeek = weekKey(new Date(2026, 1, 11));

  it('keeps entries from the current ISO week', () => {
    const split = currentWeekOnly(
      [
        entry({ id: 'mon', createdAt: new Date(2026, 1, 9, 9).getTime() }),
        entry({ id: 'sun', createdAt: new Date(2026, 1, 15, 23).getTime() }),
      ],
      thisWeek,
    );

    expect(split.visible.map((e) => e.id)).toEqual(['mon', 'sun']);
    expect(split.older).toBe(0);
  });

  it('counts anything outside the week without returning it', () => {
    const split = currentWeekOnly(
      [
        entry({ id: 'in', createdAt: new Date(2026, 1, 11).getTime() }),
        entry({ id: 'lastWeek', createdAt: new Date(2026, 1, 8, 23).getTime() }),
        entry({ id: 'january', createdAt: new Date(2026, 0, 3).getTime() }),
      ],
      thisWeek,
    );

    expect(split.visible.map((e) => e.id)).toEqual(['in']);
    expect(split.older).toBe(2);
  });

  it('treats Sunday night and the following Monday as different weeks', () => {
    // ISO weeks start on Monday, and this is the boundary a Sunday-start
    // definition would get wrong -- someone writing at 23:00 on Sunday would
    // lose the entry from view an hour later.
    const split = currentWeekOnly(
      [
        entry({ id: 'sun', createdAt: new Date(2026, 1, 15, 23, 59).getTime() }),
        entry({ id: 'mon', createdAt: new Date(2026, 1, 16, 0, 1).getTime() }),
      ],
      thisWeek,
    );

    expect(split.visible.map((e) => e.id)).toEqual(['sun']);
    expect(split.older).toBe(1);
  });

  it('withholds the older entries entirely, not just their text', () => {
    const split = currentWeekOnly(
      [entry({ id: 'old', situation: 'private', createdAt: 0 })],
      thisWeek,
    );

    expect(split.visible).toEqual([]);
    expect(split.older).toBe(1);
    // Nothing in the return value can be rendered. There is no `hidden`
    // array, no truncated preview, and no placeholder holding the real text.
    expect(JSON.stringify(split)).not.toContain('private');
  });

  it('returns everything when nothing is older', () => {
    const entries = [entry({ createdAt: new Date(2026, 1, 12).getTime() })];
    expect(currentWeekOnly(entries, thisWeek).visible).toHaveLength(1);
  });
});
