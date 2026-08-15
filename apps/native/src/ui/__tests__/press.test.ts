import { duration } from '@calma/tokens';
import { describe, expect, it } from 'vitest';

import {
  PRESS_IN_MS,
  PRESS_OPACITY,
  PRESS_OUT_MS,
  PRESS_SCALE,
  SELECT_MS,
  pressTargets,
} from '../press';

/**
 * The animation that fires on every interaction in the app, so it sets the
 * felt tempo more than any screen transition does.
 */
describe('pressTargets', () => {
  it('dims and shrinks under a finger', () => {
    expect(pressTargets(true, false)).toEqual({
      opacity: PRESS_OPACITY,
      scale: PRESS_SCALE,
      durationMs: PRESS_IN_MS,
    });
  });

  /**
   * `systems/03` forbids overshoot: an element that goes past its rest state
   * has to correct itself, and a correction is a small visual surprise. 1 is
   * the ceiling, and it is reached exactly.
   */
  it('returns to exactly rest, never past it', () => {
    const released = pressTargets(false, false);
    expect(released.opacity).toBe(1);
    expect(released.scale).toBe(1);
  });

  /** Acknowledge fast, let go unhurriedly. Reversed, it feels sticky. */
  it('presses in faster than it releases', () => {
    expect(PRESS_IN_MS).toBeLessThan(PRESS_OUT_MS);
    expect(pressTargets(true, false).durationMs).toBeLessThan(
      pressTargets(false, false).durationMs,
    );
  });

  it('uses the token rather than a number of its own', () => {
    expect(PRESS_IN_MS).toBe(duration.press);
  });

  /**
   * Reduce Motion asks for less movement, not less feedback. A control that
   * stops responding when somebody turns on an accessibility setting is a
   * regression dressed as compliance.
   */
  it('drops the scale under Reduce Motion and keeps the fade', () => {
    const pressed = pressTargets(true, true);
    expect(pressed.scale).toBe(1);
    expect(pressed.opacity).toBe(PRESS_OPACITY);
  });

  it('is still at rest when released under Reduce Motion', () => {
    expect(pressTargets(false, true)).toEqual({
      opacity: 1,
      scale: 1,
      durationMs: PRESS_OUT_MS,
    });
  });

  /** Felt rather than seen: about a pixel of travel on a 62px pill. */
  it('keeps the press shallow', () => {
    expect(PRESS_SCALE).toBeGreaterThan(0.95);
    expect(PRESS_SCALE).toBeLessThan(1);
    expect(PRESS_OPACITY).toBeGreaterThan(0.8);
    expect(PRESS_OPACITY).toBeLessThan(1);
  });
});

/**
 * A selection should read as one event. The wash, the edge and the mark share
 * this number so none of them arrives before the others.
 */
describe('SELECT_MS', () => {
  it('sits between a press and a screen transition', () => {
    expect(SELECT_MS).toBeGreaterThan(PRESS_IN_MS);
    expect(SELECT_MS).toBeLessThan(duration.transition);
  });
});
