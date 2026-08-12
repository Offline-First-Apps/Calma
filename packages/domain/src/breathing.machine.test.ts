import { describe, expect, it } from 'vitest';

import {
  BOX,
  FOUR_SEVEN_EIGHT,
  PHYSIOLOGICAL_SIGH,
  type BreathingPattern,
  patternFromCustomRatio,
} from './breathing';
import {
  LABEL_MIN_SECONDS,
  OPACITY_EXHALED,
  OPACITY_INHALED,
  SCALE_EXHALED,
  SCALE_INHALED,
  SCALE_SIGH_MID,
  buildTimeline,
  cyclesCompletedAt,
  expectedDuration,
  extendTimeline,
  nextStep,
  opacityForScale,
  phaseAt,
  progressWithin,
} from './breathing.machine';

describe('buildTimeline', () => {
  it('expands 4-7-8 into three phases per cycle', () => {
    const timeline = buildTimeline(FOUR_SEVEN_EIGHT, 2);

    expect(timeline.steps.map((s) => s.kind)).toEqual([
      'inhale', 'hold-full', 'exhale',
      'inhale', 'hold-full', 'exhale',
    ]);
    expect(timeline.cycles).toBe(2);
    expect(timeline.duration).toBe(38);
    expect(timeline.duration).toBe(expectedDuration(FOUR_SEVEN_EIGHT, 2));
  });

  it('gives 4-7-8 no empty hold at all', () => {
    // The phase is absent, not zero-length. If this ever becomes a
    // zero-second 'hold-empty', someone will sit staring at "Rest" for no
    // time at all and the cycle will feel like it stutters.
    const timeline = buildTimeline(FOUR_SEVEN_EIGHT, 1);
    expect(timeline.steps.some((s) => s.kind === 'hold-empty')).toBe(false);
  });

  it('expands box breathing into four even phases', () => {
    const timeline = buildTimeline(BOX, 1);

    expect(timeline.steps.map((s) => [s.kind, s.startsAt, s.endsAt])).toEqual([
      ['inhale', 0, 5],
      ['hold-full', 5, 10],
      ['exhale', 10, 15],
      ['hold-empty', 15, 20],
    ]);
  });

  it('runs start times continuously across cycles', () => {
    const timeline = buildTimeline(BOX, 3);

    for (let i = 1; i < timeline.steps.length; i += 1) {
      expect(timeline.steps[i]!.startsAt).toBe(timeline.steps[i - 1]!.endsAt);
    }
    expect(timeline.steps.at(-1)!.endsAt).toBe(60);
  });

  it('marks the last phase of every cycle', () => {
    const timeline = buildTimeline(BOX, 2);
    expect(timeline.steps.filter((s) => s.endsCycle).map((s) => s.kind)).toEqual([
      'hold-empty',
      'hold-empty',
    ]);
  });

  it('drops zero-length phases rather than rendering them', () => {
    const odd: BreathingPattern = {
      id: 'custom',
      phases: [
        { kind: 'inhale', seconds: 4 },
        { kind: 'hold-full', seconds: 0 },
        { kind: 'exhale', seconds: 6 },
      ],
    };

    expect(buildTimeline(odd, 1).steps.map((s) => s.kind)).toEqual([
      'inhale',
      'exhale',
    ]);
  });

  it('refuses a session shorter than one cycle', () => {
    expect(() => buildTimeline(BOX, 0)).toThrow(RangeError);
    expect(() => buildTimeline(BOX, 1.5)).toThrow(RangeError);
    expect(() => buildTimeline(BOX, -1)).toThrow(RangeError);
  });

  it('refuses a pattern with nothing in it', () => {
    expect(() => buildTimeline({ id: 'custom', phases: [] }, 1)).toThrow(RangeError);
  });
});

describe('the orb curve', () => {
  it('takes an ordinary inhale all the way up and an exhale all the way down', () => {
    const [inhale, hold, exhale] = buildTimeline(FOUR_SEVEN_EIGHT, 1).steps;

    expect(inhale).toMatchObject({ fromScale: SCALE_EXHALED, toScale: SCALE_INHALED });
    expect(hold).toMatchObject({ fromScale: SCALE_INHALED, toScale: SCALE_INHALED });
    expect(exhale).toMatchObject({ fromScale: SCALE_INHALED, toScale: SCALE_EXHALED });
  });

  it('renders the physiological sigh as two distinct sips', () => {
    // This is the shape the whole pattern exists for: up most of the way,
    // a beat, then the rest of the way. One smooth ramp to 1.0 would be a
    // normal inhale with a hiccup in it.
    const steps = buildTimeline(PHYSIOLOGICAL_SIGH, 1).steps;

    expect(steps.map((s) => [s.kind, s.fromScale, s.toScale])).toEqual([
      ['inhale', SCALE_EXHALED, SCALE_SIGH_MID],
      ['hold-full', SCALE_SIGH_MID, SCALE_SIGH_MID],
      ['second-inhale', SCALE_SIGH_MID, SCALE_INHALED],
      ['exhale', SCALE_INHALED, SCALE_EXHALED],
    ]);
  });

  it('gives the sigh a second sip visibly smaller than the first', () => {
    const [first, , second] = buildTimeline(PHYSIOLOGICAL_SIGH, 1).steps;

    const firstRise = first!.toScale - first!.fromScale;
    const secondRise = second!.toScale - second!.fromScale;

    expect(secondRise).toBeLessThan(firstRise);
    expect(secondRise).toBeGreaterThan(0);
  });

  it('holds the micro-hold at exactly where the first sip stopped', () => {
    const [, micro] = buildTimeline(PHYSIOLOGICAL_SIGH, 1).steps;
    expect(micro!.seconds).toBeCloseTo(0.18);
    expect(micro!.fromScale).toBe(micro!.toScale);
  });

  it('returns to the bottom at the end of every cycle', () => {
    for (const pattern of [FOUR_SEVEN_EIGHT, BOX, PHYSIOLOGICAL_SIGH]) {
      const steps = buildTimeline(pattern, 2).steps;
      expect(steps.at(-1)!.toScale).toBe(SCALE_EXHALED);
    }
  });

  it('never leaves a gap between one phase and the next', () => {
    // A discontinuity here is a visible jump in the orb.
    const steps = buildTimeline(PHYSIOLOGICAL_SIGH, 2).steps;
    for (let i = 1; i < steps.length; i += 1) {
      expect(steps[i]!.fromScale).toBe(steps[i - 1]!.toScale);
    }
  });
});

describe('opacityForScale', () => {
  it('maps the ends of the breath onto the ends of the fade', () => {
    expect(opacityForScale(SCALE_EXHALED)).toBeCloseTo(OPACITY_EXHALED);
    expect(opacityForScale(SCALE_INHALED)).toBeCloseTo(OPACITY_INHALED);
  });

  it('puts the sigh mid-point between the two', () => {
    const mid = opacityForScale(SCALE_SIGH_MID);
    expect(mid).toBeGreaterThan(OPACITY_EXHALED);
    expect(mid).toBeLessThan(OPACITY_INHALED);
  });

  it('clamps rather than overshooting', () => {
    // The ambient drift pushes scale slightly outside the breath range. It
    // must not push opacity past 1 and make the orb flare.
    expect(opacityForScale(1.2)).toBe(OPACITY_INHALED);
    expect(opacityForScale(0.1)).toBe(OPACITY_EXHALED);
  });
});

describe('labels', () => {
  it('names the four phases a person sees', () => {
    expect(buildTimeline(BOX, 1).steps.map((s) => s.label)).toEqual([
      'inhale',
      'holdFull',
      'exhale',
      'holdEmpty',
    ]);
  });

  it('does not flash "Hold" during the sigh micro-hold', () => {
    // 180ms of a different word is a glitch, and a glitch on the screen
    // someone opens while shaking is worse than no label at all.
    const steps = buildTimeline(PHYSIOLOGICAL_SIGH, 1).steps;

    expect(steps.map((s) => s.label)).toEqual([
      'inhale',
      'inhale',
      'secondInhale',
      'exhale',
    ]);
    expect(steps[1]!.labelChanges).toBe(false);
  });

  it('flags exactly the phases where the word on screen changes', () => {
    const steps = buildTimeline(PHYSIOLOGICAL_SIGH, 2).steps;

    expect(steps.map((s) => s.labelChanges)).toEqual([
      true, false, true, true,
      true, false, true, true,
    ]);
  });

  it('suppresses any phase below the readable threshold, not just the sigh', () => {
    const twitchy: BreathingPattern = {
      id: 'custom',
      phases: [
        { kind: 'inhale', seconds: 4 },
        { kind: 'hold-full', seconds: LABEL_MIN_SECONDS / 2 },
        { kind: 'exhale', seconds: 6 },
      ],
    };

    expect(buildTimeline(twitchy, 1).steps.map((s) => s.label)).toEqual([
      'inhale',
      'inhale',
      'exhale',
    ]);
  });

  it('borrows forward when the very first phase is too short', () => {
    const odd: BreathingPattern = {
      id: 'custom',
      phases: [
        { kind: 'hold-empty', seconds: 0.2 },
        { kind: 'inhale', seconds: 4 },
        { kind: 'exhale', seconds: 6 },
      ],
    };

    expect(buildTimeline(odd, 1).steps[0]!.label).toBe('inhale');
  });

  it('keeps real holds labelled -- a validated custom ratio is never suppressed', () => {
    const shortest = patternFromCustomRatio([1, 1, 1, 1]);
    expect(buildTimeline(shortest, 1).steps.map((s) => s.label)).toEqual([
      'inhale',
      'holdFull',
      'exhale',
      'holdEmpty',
    ]);
  });
});

describe('phaseAt', () => {
  const timeline = buildTimeline(FOUR_SEVEN_EIGHT, 2);

  it('finds the phase at a moment inside it', () => {
    expect(phaseAt(timeline, 0)?.kind).toBe('inhale');
    expect(phaseAt(timeline, 3.9)?.kind).toBe('inhale');
    expect(phaseAt(timeline, 5)?.kind).toBe('hold-full');
    expect(phaseAt(timeline, 12)?.kind).toBe('exhale');
  });

  it('gives a boundary to the phase that starts there', () => {
    // At exactly 4.0s of 4-7-8 you are holding, not still inhaling. Getting
    // this backwards fires the haptic for the phase you just left.
    expect(phaseAt(timeline, 4)?.kind).toBe('hold-full');
    expect(phaseAt(timeline, 11)?.kind).toBe('exhale');
  });

  it('carries on into the second cycle', () => {
    expect(phaseAt(timeline, 20)?.cycle).toBe(1);
    expect(phaseAt(timeline, 20)?.kind).toBe('inhale');
  });

  it('returns null once the session is over', () => {
    expect(phaseAt(timeline, 38)).toBeNull();
    expect(phaseAt(timeline, 100)).toBeNull();
  });

  it('clamps a negative time to the first phase rather than returning nothing', () => {
    // Guards against a frame arriving a hair before the recorded start.
    // Showing no orb for one frame at the top of a session is not acceptable.
    expect(phaseAt(timeline, -0.001)?.index).toBe(0);
  });

  it('covers every instant of the session with exactly one phase', () => {
    for (let t = 0; t < timeline.duration; t += 0.25) {
      const step = phaseAt(timeline, t);
      expect(step, `no phase at ${t}s`).not.toBeNull();
      expect(t).toBeGreaterThanOrEqual(step!.startsAt);
      expect(t).toBeLessThan(step!.endsAt);
    }
  });
});

describe('progressWithin', () => {
  const [inhale] = buildTimeline(FOUR_SEVEN_EIGHT, 1).steps;

  it('runs 0 to 1 across the phase', () => {
    expect(progressWithin(inhale!, 0)).toBe(0);
    expect(progressWithin(inhale!, 2)).toBeCloseTo(0.5);
    expect(progressWithin(inhale!, 4)).toBe(1);
  });

  it('clamps outside the phase', () => {
    expect(progressWithin(inhale!, -5)).toBe(0);
    expect(progressWithin(inhale!, 99)).toBe(1);
  });
});

describe('nextStep', () => {
  it('walks the whole session and then stops', () => {
    const timeline = buildTimeline(BOX, 2);

    let step = timeline.steps[0]!;
    let visited = 1;

    for (;;) {
      const next = nextStep(timeline, step);
      if (next === null) break;
      step = next;
      visited += 1;
    }

    expect(visited).toBe(8);
    expect(step.endsCycle).toBe(true);
  });
});

describe('cyclesCompletedAt', () => {
  const timeline = buildTimeline(BOX, 3);

  it('counts only whole cycles', () => {
    expect(cyclesCompletedAt(timeline, 0)).toBe(0);
    expect(cyclesCompletedAt(timeline, 19.9)).toBe(0);
    expect(cyclesCompletedAt(timeline, 20)).toBe(1);
    expect(cyclesCompletedAt(timeline, 39)).toBe(1);
    expect(cyclesCompletedAt(timeline, 40)).toBe(2);
    expect(cyclesCompletedAt(timeline, 60)).toBe(3);
  });

  it('does not credit a cycle someone stopped three quarters through', () => {
    // This number goes to the Progress tab. Rounding it up would be the app
    // quietly flattering someone about their own week.
    expect(cyclesCompletedAt(timeline, 35)).toBe(1);
  });

  it('never exceeds the cycles that exist', () => {
    expect(cyclesCompletedAt(timeline, 10_000)).toBe(3);
  });
});

describe('extendTimeline', () => {
  it('keeps every elapsed phase at exactly the same start time', () => {
    // If an extension shifted the phases already animated, the orb would
    // jump at the moment someone chose to keep going.
    const original = buildTimeline(BOX, 2);
    const extended = extendTimeline(BOX, original, 2);

    for (const step of original.steps) {
      expect(extended.steps[step.index]).toMatchObject({
        kind: step.kind,
        startsAt: step.startsAt,
        endsAt: step.endsAt,
        fromScale: step.fromScale,
        toScale: step.toScale,
      });
    }
  });

  it('adds the cycles asked for and nothing else', () => {
    const extended = extendTimeline(BOX, buildTimeline(BOX, 2), 3);
    expect(extended.cycles).toBe(5);
    expect(extended.duration).toBe(100);
    expect(extended.patternId).toBe('5-5-5-5');
  });

  it('refuses a meaningless extension', () => {
    const timeline = buildTimeline(BOX, 1);
    expect(() => extendTimeline(BOX, timeline, 0)).toThrow(RangeError);
    expect(() => extendTimeline(BOX, timeline, 0.5)).toThrow(RangeError);
  });
});

describe('the machine has no timers', () => {
  it('is deterministic -- the same inputs give the same timeline', () => {
    // The point of the whole design. If this ever stops holding, something
    // has started reading a clock, and the UI thread can no longer be
    // trusted to agree with the JS thread about what phase it is.
    expect(buildTimeline(PHYSIOLOGICAL_SIGH, 4)).toEqual(
      buildTimeline(PHYSIOLOGICAL_SIGH, 4),
    );
  });
});
