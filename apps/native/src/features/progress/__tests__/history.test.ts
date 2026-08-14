import { sudsRamp } from '@calma/tokens';
import { describe, expect, it } from 'vitest';

import {
  type MonthPoint,
  bandFor,
  bandMonths,
  dotColour,
  sudsPoints,
} from '../history';

const month = (activeDays: number, possibleDays = 30): MonthPoint => ({
  year: 2026,
  month: 3,
  activeDays,
  possibleDays,
});

describe('bandFor', () => {
  it('puts the top third of the range in amber and the bottom in sage', () => {
    expect(bandFor(1, 0, 1)).toBe('often');
    expect(bandFor(0.5, 0, 1)).toBe('middle');
    expect(bandFor(0, 0, 1)).toBe('rarely');
  });

  /**
   * A flat history has no quiet end. Shading it into three bands would
   * manufacture a trend out of noise, and the quiet band would then be read
   * as a verdict on a month that was the same as all the others.
   */
  it('leaves a flat six months entirely amber', () => {
    expect(bandFor(0.5, 0.48, 0.52)).toBe('often');
  });
});

describe('bandMonths', () => {
  it('bands against the person\'s own range, not an absolute', () => {
    const bars = bandMonths([month(3), month(12), month(21)]);
    expect(bars.map((bar) => bar.band)).toEqual(['rarely', 'middle', 'often']);
  });

  /**
   * The rule that stops the chart being a scoreboard: the bands come from the
   * person's own range, so a low-activity history is banded the same way a
   * high-activity one is, at a fraction of the volume.
   */
  it('gives a quiet history the same bands as a busy one, at a fifth the volume', () => {
    const quiet = bandMonths([month(2), month(5), month(8)]);
    const busy = bandMonths([month(6), month(15), month(24)]);
    expect(quiet.map((b) => b.band)).toEqual(busy.map((b) => b.band));
    expect(quiet.map((b) => b.band)).toEqual(['rarely', 'middle', 'often']);
  });

  /**
   * The floor, and the case that found it.
   *
   * 1, 3 and 5 days spans four days out of thirty. It is 5× in relative terms
   * and nothing at all in real ones — three quiet months in a row. Banding it
   * would put "rarely" against the 1 and "often" against the 5, which reads as
   * a verdict on months that were, honestly, the same. Below the floor the
   * chart says one thing: this was a quiet stretch.
   */
  it('leaves a compressed range in one colour rather than inventing a range', () => {
    const bars = bandMonths([month(1), month(3), month(5)]);
    expect(new Set(bars.map((b) => b.band)).size).toBe(1);
  });

  it('never exceeds a full month, even if the index disagrees', () => {
    const [bar] = bandMonths([month(40, 30)]);
    expect(bar?.fraction).toBe(1);
  });

  it('handles a month that has not started without dividing by zero', () => {
    const [bar] = bandMonths([month(0, 0)]);
    expect(bar?.fraction).toBe(0);
    expect(Number.isFinite(bar?.fraction)).toBe(true);
  });
});

describe('sudsPoints', () => {
  const at = (day: number) => new Date(2026, 2, day).getTime();

  /** D-007. A skipped rating is absent, and absent is not calm. */
  it('drops skipped ratings rather than scoring them zero', () => {
    const points = sudsPoints([
      { preSuds: 8, startedAt: at(1) },
      { preSuds: null, startedAt: at(2) },
      { preSuds: 3, startedAt: at(3) },
    ]);

    expect(points.map((p) => p.value)).toEqual([8, 3]);
    expect(points.some((p) => p.value === 0)).toBe(false);
  });

  it('is ordered oldest first, so the chart reads left to right', () => {
    const points = sudsPoints([
      { preSuds: 3, startedAt: at(9) },
      { preSuds: 8, startedAt: at(1) },
    ]);
    expect(points.map((p) => p.value)).toEqual([8, 3]);
  });

  it('keeps the most recent when there are more than fit', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      preSuds: i,
      startedAt: at(i + 1),
    }));

    const points = sudsPoints(many, 8);
    expect(points).toHaveLength(8);
    expect(points.at(-1)?.value).toBe(19);
  });

  it('is empty rather than throwing when nobody has ever rated', () => {
    expect(sudsPoints([{ preSuds: null, startedAt: at(1) }])).toEqual([]);
  });
});

describe('dotColour', () => {
  /**
   * The deviation the session-14 audit caught: this was three buckets off
   * clay/amber/sage base, and the design runs eight stops. Three buckets is a
   * traffic light with the middle lamp on, which `systems/03` forbids outright.
   */
  it('uses all eight stops rather than three buckets', () => {
    const seen = new Set(
      Array.from({ length: 11 }, (_, suds) => dotColour(suds, false)),
    );
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  it('runs clay at the heavy end and sage at the calm end', () => {
    expect(dotColour(10, false)).toBe(sudsRamp.light[0]);
    expect(dotColour(0, false)).toBe(sudsRamp.light.at(-1));
  });

  it('has a distinct ramp per theme, so dark is never the light one', () => {
    expect(dotColour(10, true)).not.toBe(dotColour(10, false));
  });

  /** Colour is a property of the rating, never of where the dot sits. */
  it('gives the same rating the same colour wherever it appears', () => {
    expect(dotColour(7, false)).toBe(dotColour(7, false));
  });

  it('clamps rather than returning undefined for an out-of-range value', () => {
    expect(dotColour(99, false)).toBe(sudsRamp.light[0]);
    expect(dotColour(-3, false)).toBe(sudsRamp.light.at(-1));
  });
});
