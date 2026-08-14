import { type ChartBand, sudsRamp } from '@calma/tokens';

/**
 * h5's six months, and the rule that decides a bar's colour.
 *
 * Pure, so the banding can be argued with in a test rather than in a component.
 */

export interface MonthPoint {
  /** Local year and 0-indexed month, so a label can be formatted per locale. */
  year: number;
  month: number;
  /** Days that month on which anything at all was recorded. */
  activeDays: number;
  /** Days in that month that had already happened. Bounds the fraction. */
  possibleDays: number;
}

/**
 * THERE IS NO ABSOLUTE THRESHOLD, AND INVENTING ONE WOULD BE A TARGET.
 *
 * The design draws six bars in three colours with a legend reading
 * "Often / Rarely", and gives no numbers for either. A fixed rule — say, sage
 * below eight days — is a pass mark: the person would learn it, and then a
 * sage month would mean "failed". The H-group caption rules that out by name.
 *
 * So the band is relative to the person's own six months. The busiest band is
 * amber, the quietest is sage, and sage is NOT the dim end — h5's legend has
 * it as a full colour and the caption insists "a quiet week is a fine week".
 * Clay sits between, which is the same clay the worry feature uses, so the
 * middle of your own range is drawn in the colour of setting something down.
 *
 * When every month is the same, everything is amber: a flat history has no
 * quiet end, and shading it into three bands would manufacture a trend out of
 * noise.
 */
export const BAND_SPREAD_FLOOR = 0.15;

export function bandFor(
  fraction: number,
  lowest: number,
  highest: number,
): ChartBand {
  const spread = highest - lowest;
  if (spread < BAND_SPREAD_FLOOR) return 'often';

  const position = (fraction - lowest) / spread;
  if (position >= 2 / 3) return 'often';
  if (position >= 1 / 3) return 'middle';
  return 'rarely';
}

export interface MonthBar {
  fraction: number;
  band: ChartBand;
}

/** How much of each month was lived in, banded against the person's own range. */
export function bandMonths(months: readonly MonthPoint[]): MonthBar[] {
  const fractions = months.map((month) =>
    month.possibleDays > 0
      ? Math.min(month.activeDays / month.possibleDays, 1)
      : 0,
  );

  const present = fractions.filter((value) => value > 0);
  const lowest = present.length > 0 ? Math.min(...present) : 0;
  const highest = present.length > 0 ? Math.max(...present) : 0;

  return fractions.map((fraction) => ({
    fraction,
    band: fraction > 0 ? bandFor(fraction, lowest, highest) : 'often',
  }));
}

/**
 * h5's lower chart: pre-session distress over time, as dots.
 *
 * DOTS, NOT A LINE. A line implies the values between two sessions, and there
 * are none — the person was not being measured on the days they did not open
 * the app. It is also why there is no trend line, no gradient fill under it
 * and no arrow: plan 10 T09 exists to keep a flat or worsening run rendered
 * without commentary, and the surest way to comply is to draw a shape that
 * cannot editorialise.
 *
 * `null` ratings are dropped, never treated as zero. A skipped question is
 * "I'd rather not say", and scoring it as "completely calm" would quietly
 * flatter every history in the app (D-007).
 */
export interface SudsPoint {
  /** 0–10. */
  value: number;
  at: number;
}

export function sudsPoints(
  sessions: readonly { preSuds: number | null; startedAt: number }[],
  limit = 8,
): SudsPoint[] {
  return sessions
    .filter(
      (session): session is { preSuds: number; startedAt: number } =>
        session.preSuds !== null,
    )
    .sort((a, b) => a.startedAt - b.startedAt)
    .slice(-limit)
    .map((session) => ({ value: session.preSuds, at: session.startedAt }));
}

/**
 * A SUDS rating onto h5's eight-stop ramp, heaviest first.
 *
 * IT LIVES HERE, IN A `.ts`, AND NOT IN `SudsTrail.tsx`, because
 * `apps/native/vitest.config.ts` runs pure Node with no renderer: a function
 * inside a component file cannot be imported by a test without dragging JSX
 * and react-native through the transform. That is the repo's standing rule --
 * "a rule that can only be checked by mounting a component tree is a rule that
 * stops being checked" -- and this function is exactly the kind that needs
 * checking, since its first version silently flattened the design's ramp into
 * three buckets.
 *
 * Indexed by the RATING, never by the dot's position in the series. Position
 * would mean the colour improved because time passed, which is the app
 * narrating a trend at somebody (plan 10 T09).
 */
export function dotColour(value: number, dark: boolean): string {
  const ramp = dark ? sudsRamp.dark : sudsRamp.light;
  const clamped = Math.min(Math.max(value, 0), 10);
  const index = Math.round(((10 - clamped) / 10) * (ramp.length - 1));
  return ramp[index] ?? ramp[0];
}
