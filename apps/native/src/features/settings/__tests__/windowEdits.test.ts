import { defaultPrefs, limitsFor, prefsSchema } from '@calma/domain';
import { describe, expect, it } from 'vitest';

import {
  HOUR_STEP,
  MINUTE_STEP,
  WINDOW_DURATIONS,
  mayUseDuration,
  stepWindowTime,
} from '../windowEdits';

describe('stepWindowTime', () => {
  it('moves by an hour and by five minutes', () => {
    expect(stepWindowTime('19:00', HOUR_STEP)).toBe('20:00');
    expect(stepWindowTime('19:00', -HOUR_STEP)).toBe('18:00');
    expect(stepWindowTime('19:00', MINUTE_STEP)).toBe('19:05');
    expect(stepWindowTime('19:00', -MINUTE_STEP)).toBe('18:55');
  });

  /**
   * Somebody whose worst hour is 1am reaches it by pressing down from
   * midnight. A stepper that clamped would be telling them their window is
   * not a real option.
   */
  it('wraps at midnight in both directions', () => {
    expect(stepWindowTime('23:30', HOUR_STEP)).toBe('00:30');
    expect(stepWindowTime('00:00', -MINUTE_STEP)).toBe('23:55');
    expect(stepWindowTime('00:30', -HOUR_STEP)).toBe('23:30');
  });

  it('only ever produces a time prefs will accept', () => {
    let time = defaultPrefs.worryWindowTime;

    // A full day of hour steps, then a full hour of minute steps.
    for (let step = 0; step < 24; step++) {
      time = stepWindowTime(time, HOUR_STEP);
      expect(
        prefsSchema.safeParse({ ...defaultPrefs, worryWindowTime: time })
          .success,
      ).toBe(true);
    }
    for (const direction of [MINUTE_STEP, -MINUTE_STEP]) {
      for (let step = 0; step < 12; step++) {
        time = stepWindowTime(time, direction);
        expect(
          prefsSchema.safeParse({ ...defaultPrefs, worryWindowTime: time })
            .success,
        ).toBe(true);
      }
    }

    // A day of hours and an hour of minutes, each walked and unwalked, land
    // exactly where they started. Clock arithmetic that drifts here would
    // drift a notification.
    expect(time).toBe(defaultPrefs.worryWindowTime);
  });
});

describe('mayUseDuration', () => {
  it('gives free the fifteen it has', () => {
    expect(mayUseDuration('free', 15, false)).toBe(true);
  });

  it('offers Plus for the longer two rather than refusing silently', () => {
    expect(mayUseDuration('free', 20, false)).toBe(false);
    expect(mayUseDuration('free', 30, false)).toBe(false);
  });

  it('gives Plus all three', () => {
    for (const minutes of WINDOW_DURATIONS) {
      expect(mayUseDuration('plus', minutes, false)).toBe(true);
    }
  });

  /** Same clause as the custom rhythm: a block nobody can pay past is not one. */
  it('allows everything on a build where nothing can be bought', () => {
    for (const minutes of WINDOW_DURATIONS) {
      expect(mayUseDuration('free', minutes, true)).toBe(true);
    }
  });

  it('agrees with the domain rather than restating it', () => {
    for (const tier of ['free', 'plus'] as const) {
      for (const minutes of WINDOW_DURATIONS) {
        expect(mayUseDuration(tier, minutes, false)).toBe(
          limitsFor(tier).worryWindowMinutes.includes(minutes),
        );
      }
    }
  });

  it('offers every length prefs will accept, and no more', () => {
    expect(WINDOW_DURATIONS).toEqual([15, 20, 30]);
    for (const minutes of WINDOW_DURATIONS) {
      expect(
        prefsSchema.safeParse({
          ...defaultPrefs,
          worryWindowMinutes: minutes,
        }).success,
      ).toBe(true);
    }
  });

  it('leaves free with a default it is allowed to have', () => {
    expect(mayUseDuration('free', defaultPrefs.worryWindowMinutes, false)).toBe(
      true,
    );
  });
});
