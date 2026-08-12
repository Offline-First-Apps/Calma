import { describe, expect, it } from 'vitest';

import type { CustomRatio } from './entities/breathing';
import {
  BOX,
  FOUR_SEVEN_EIGHT,
  MAX_CYCLE_SECONDS,
  MAX_PHASE_SECONDS,
  PHYSIOLOGICAL_SIGH,
  PRESET_PATTERNS,
  customRatioProblem,
  cycleDuration,
  cyclesForDuration,
  getPattern,
  isValidCustomRatio,
  patternFromCustomRatio,
  sessionDuration,
} from './breathing';

describe('preset patterns', () => {
  it('defines 4-7-8 with no empty hold', () => {
    expect(FOUR_SEVEN_EIGHT.phases).toEqual([
      { kind: 'inhale', seconds: 4 },
      { kind: 'hold-full', seconds: 7 },
      { kind: 'exhale', seconds: 8 },
    ]);
    expect(cycleDuration(FOUR_SEVEN_EIGHT)).toBe(19);
  });

  it('defines 5-5-5-5 as an even box', () => {
    expect(BOX.phases.map((p) => p.seconds)).toEqual([5, 5, 5, 5]);
    expect(cycleDuration(BOX)).toBe(20);
  });

  it('defines the sigh as two inhales split by a micro-hold', () => {
    expect(PHYSIOLOGICAL_SIGH.phases.map((p) => p.kind)).toEqual([
      'inhale',
      'hold-full',
      'second-inhale',
      'exhale',
    ]);
    // The 180ms hold from the orb spec is what separates the two sips of air.
    expect(PHYSIOLOGICAL_SIGH.phases[1]?.seconds).toBe(0.18);
    expect(cycleDuration(PHYSIOLOGICAL_SIGH)).toBeCloseTo(9.18, 5);
  });

  it('exhales for at least as long as it inhales', () => {
    // The whole point of every one of these is a longer out-breath.
    for (const pattern of PRESET_PATTERNS) {
      const inhaled = pattern.phases
        .filter((p) => p.kind === 'inhale' || p.kind === 'second-inhale')
        .reduce((sum, p) => sum + p.seconds, 0);
      const exhaled = pattern.phases
        .filter((p) => p.kind === 'exhale')
        .reduce((sum, p) => sum + p.seconds, 0);
      expect(exhaled).toBeGreaterThanOrEqual(inhaled);
    }
  });

  it('never contains a zero-length phase', () => {
    for (const pattern of PRESET_PATTERNS) {
      for (const phase of pattern.phases) {
        expect(phase.seconds).toBeGreaterThan(0);
      }
    }
  });

  it('offers exactly the three presets the picker shows', () => {
    expect(PRESET_PATTERNS.map((p) => p.id)).toEqual([
      '4-7-8',
      '5-5-5-5',
      'physiological-sigh',
    ]);
  });
});

describe('getPattern', () => {
  it('returns each preset by id', () => {
    expect(getPattern('4-7-8')).toBe(FOUR_SEVEN_EIGHT);
    expect(getPattern('5-5-5-5')).toBe(BOX);
    expect(getPattern('physiological-sigh')).toBe(PHYSIOLOGICAL_SIGH);
  });

  it('builds a custom pattern from a ratio', () => {
    const pattern = getPattern('custom', [4, 4, 6, 2]);
    expect(pattern.id).toBe('custom');
    expect(cycleDuration(pattern)).toBe(16);
  });

  it('refuses a custom pattern with no ratio', () => {
    expect(() => getPattern('custom')).toThrow();
  });
});

describe('cycleDuration', () => {
  it('sums the phases', () => {
    expect(cycleDuration(BOX)).toBe(20);
    expect(cycleDuration(patternFromCustomRatio([1, 1, 1, 1]))).toBe(4);
  });
});

describe('cyclesForDuration', () => {
  it('fits whole cycles into a three-minute session', () => {
    expect(cyclesForDuration(BOX, 180)).toBe(9); // 180s exactly
    expect(cyclesForDuration(FOUR_SEVEN_EIGHT, 180)).toBe(9); // 171s, 9s short
  });

  it('rounds down rather than overrunning', () => {
    // 5 cycles is 95s, 6 is 114s. 110 must not become 114.
    expect(cyclesForDuration(FOUR_SEVEN_EIGHT, 110)).toBe(5);
    expect(sessionDuration(FOUR_SEVEN_EIGHT, 5)).toBe(95);
  });

  it('always gives at least one cycle', () => {
    // Someone who picks the shortest session still gets a whole breath.
    expect(cyclesForDuration(FOUR_SEVEN_EIGHT, 5)).toBe(1);
    expect(cyclesForDuration(BOX, 0)).toBe(1);
  });

  it('handles the sigh, whose cycle is not a whole number', () => {
    expect(cyclesForDuration(PHYSIOLOGICAL_SIGH, 60)).toBe(6); // 55.08s
    expect(sessionDuration(PHYSIOLOGICAL_SIGH, 6)).toBeCloseTo(55.08, 5);
  });
});

describe('custom ratio validation', () => {
  const ok: CustomRatio = [4, 4, 6, 2];

  it('accepts a sane ratio', () => {
    expect(customRatioProblem(ok)).toBeNull();
    expect(isValidCustomRatio(ok)).toBe(true);
  });

  it('accepts both bounds of a single phase', () => {
    expect(isValidCustomRatio([1, 1, 1, 1])).toBe(true);
    expect(isValidCustomRatio([MAX_PHASE_SECONDS, 1, 1, 1])).toBe(true);
  });

  it('rejects a phase shorter than a second', () => {
    expect(customRatioProblem([0, 4, 6, 2])).toBe('phase-too-short');
    expect(customRatioProblem([0.5, 4, 6, 2])).toBe('phase-too-short');
    expect(customRatioProblem([4, 4, 6, -1])).toBe('phase-too-short');
  });

  it('rejects a phase longer than twenty seconds', () => {
    expect(customRatioProblem([21, 4, 6, 2])).toBe('phase-too-long');
    expect(customRatioProblem([4, 4, MAX_PHASE_SECONDS + 0.1, 2])).toBe(
      'phase-too-long',
    );
  });

  it('rejects a cycle longer than a minute', () => {
    // Every phase is legal on its own; the total is not.
    expect(customRatioProblem([20, 20, 20, 20])).toBe('cycle-too-long');
    expect(isValidCustomRatio([15, 15, 15, 15])).toBe(true);
    expect(cycleDuration(patternFromCustomRatio([15, 15, 15, 15]))).toBe(
      MAX_CYCLE_SECONDS,
    );
  });

  it('rejects values that are not numbers at all', () => {
    expect(customRatioProblem([Number.NaN, 4, 6, 2])).toBe('not-finite');
    expect(customRatioProblem([Number.POSITIVE_INFINITY, 4, 6, 2])).toBe(
      'not-finite',
    );
  });

  it('throws when building a pattern from an invalid ratio', () => {
    expect(() => patternFromCustomRatio([0, 4, 6, 2])).toThrow();
    expect(() => patternFromCustomRatio([20, 20, 20, 20])).toThrow();
  });

  it('keeps the ratio order as in / hold / out / hold', () => {
    const pattern = patternFromCustomRatio([3, 4, 5, 6]);
    expect(pattern.phases).toEqual([
      { kind: 'inhale', seconds: 3 },
      { kind: 'hold-full', seconds: 4 },
      { kind: 'exhale', seconds: 5 },
      { kind: 'hold-empty', seconds: 6 },
    ]);
  });
});
