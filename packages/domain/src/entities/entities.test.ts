import { describe, expect, it } from 'vitest';

import {
  breathingSessionSchema,
  type BreathingSession,
} from './breathing';
import { journalEntrySchema, type JournalEntry } from './journal';
import { defaultPrefs, prefsSchema, type Prefs } from './prefs';
import { worrySchema, type Worry } from './worry';

const session: BreathingSession = {
  id: '01J0000000ABCDEFGHJKMNPQRS',
  pattern: '4-7-8',
  entryPoint: 'panic',
  startedAt: 1_754_000_000_000,
  durationSec: 184.5,
  cyclesCompleted: 9,
  preSuds: 8,
  postFeeling: 'better',
  completed: true,
};

const worry: Worry = {
  id: '01J0000000ABCDEFGHJKMNPQRT',
  text: 'The thing I said in the meeting.',
  capturedAt: 1_754_000_000_000,
  status: 'pending',
  resolvedAt: null,
  actionText: null,
};

const entry: JournalEntry = {
  id: '01J0000000ABCDEFGHJKMNPQRU',
  situation: 'Waiting for a reply.',
  automaticThought: 'They are angry with me.',
  emotion: 'Anxious',
  emotionIntensity: 7,
  evidenceFor: 'They usually reply within the hour.',
  evidenceAgainst: 'They said they were travelling today.',
  balancedThought: 'They are probably just busy.',
  emotionIntensityAfter: 4,
  isDraft: false,
  linkedSessionId: null,
  createdAt: 1_754_000_000_000,
  updatedAt: 1_754_000_000_500,
};

const prefs: Prefs = {
  ...defaultPrefs,
  name: 'Sam',
  customRatio: [4, 7, 8, 0],
  worryWindowMinutes: 30,
  onboardingCompletedAt: 1_754_000_000_000,
  onboardingAnswers: { why: ['sleep'], when: ['night'], helped: ['walking'] },
};

describe('entity schemas', () => {
  it('round-trips a breathing session', () => {
    expect(breathingSessionSchema.parse(session)).toEqual(session);
  });

  it('round-trips a worry', () => {
    expect(worrySchema.parse(worry)).toEqual(worry);
  });

  it('round-trips a journal entry', () => {
    expect(journalEntrySchema.parse(entry)).toEqual(entry);
  });

  it('round-trips prefs', () => {
    expect(prefsSchema.parse(prefs)).toEqual(prefs);
  });

  it('round-trips the default prefs', () => {
    expect(prefsSchema.parse(defaultPrefs)).toEqual(defaultPrefs);
  });

  it('survives a JSON round-trip, which is how records are stored', () => {
    const revived = worrySchema.parse(JSON.parse(JSON.stringify(worry)));
    expect(revived).toEqual(worry);
  });
});

describe('entity schema rejections', () => {
  it('rejects a SUDS score outside 0–10', () => {
    expect(breathingSessionSchema.safeParse({ ...session, preSuds: 11 }).success)
      .toBe(false);
  });

  it('accepts a null SUDS score, because skipping is allowed', () => {
    expect(breathingSessionSchema.parse({ ...session, preSuds: null }).preSuds)
      .toBeNull();
  });

  it('rejects an unknown worry status', () => {
    expect(worrySchema.safeParse({ ...worry, status: 'archived' }).success)
      .toBe(false);
  });

  it('accepts an empty journal field, because drafts are half-written', () => {
    expect(journalEntrySchema.safeParse({ ...entry, situation: '' }).success)
      .toBe(true);
  });

  it('rejects a malformed worry window time', () => {
    expect(prefsSchema.safeParse({ ...prefs, worryWindowTime: '7pm' }).success)
      .toBe(false);
    expect(prefsSchema.safeParse({ ...prefs, worryWindowTime: '24:00' }).success)
      .toBe(false);
    expect(prefsSchema.safeParse({ ...prefs, worryWindowTime: '00:00' }).success)
      .toBe(true);
  });

  it('rejects a worry window length that is not offered', () => {
    expect(prefsSchema.safeParse({ ...prefs, worryWindowMinutes: 25 }).success)
      .toBe(false);
  });
});
