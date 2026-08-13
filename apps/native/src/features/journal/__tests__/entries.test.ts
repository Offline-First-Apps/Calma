import type { JournalEntry } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import { groupByDay, previewOf, splitOnMatch } from '../entries';

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
