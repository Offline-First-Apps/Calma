import type {
  BreathingPatternId,
  CustomRatio,
} from './entities/breathing';

/**
 * Breathing patterns as sequences of timed phases.
 *
 * This file is deliberately only about *time*. How a phase looks — the orb's
 * scale ramp, the easing curve, the halo lag — belongs to the design system,
 * and how it feels belongs to the haptics map. Keeping the timing pure means
 * the phase machine can be tested without a frame loop.
 */

export type BreathPhaseKind =
  | 'inhale'
  /** The sigh's second, shorter sip of air on top of the first. */
  | 'second-inhale'
  | 'hold-full'
  | 'exhale'
  | 'hold-empty';

export interface BreathPhase {
  kind: BreathPhaseKind;
  /** Seconds. Always greater than zero — empty phases are simply omitted. */
  seconds: number;
}

export interface BreathingPattern {
  id: BreathingPatternId;
  phases: readonly BreathPhase[];
}

/**
 * 4-7-8. The classic relaxing breath: a long hold and a longer exhale.
 * There is no empty hold, so the phase is absent rather than zero-length.
 */
export const FOUR_SEVEN_EIGHT: BreathingPattern = {
  id: '4-7-8',
  phases: [
    { kind: 'inhale', seconds: 4 },
    { kind: 'hold-full', seconds: 7 },
    { kind: 'exhale', seconds: 8 },
  ],
};

/** Box breathing. Even on all four sides, easiest to follow when panicking. */
export const BOX: BreathingPattern = {
  id: '5-5-5-5',
  phases: [
    { kind: 'inhale', seconds: 5 },
    { kind: 'hold-full', seconds: 5 },
    { kind: 'exhale', seconds: 5 },
    { kind: 'hold-empty', seconds: 5 },
  ],
};

/**
 * The physiological sigh: a full inhale, a 180ms micro-hold, a second shorter
 * sip of air, then a long exhale. The micro-hold is what makes the two inhales
 * read as two distinct sips rather than one wobbly one
 * (systems/03-design-system.md § The orb).
 */
export const PHYSIOLOGICAL_SIGH: BreathingPattern = {
  id: 'physiological-sigh',
  phases: [
    { kind: 'inhale', seconds: 2 },
    { kind: 'hold-full', seconds: 0.18 },
    { kind: 'second-inhale', seconds: 1 },
    { kind: 'exhale', seconds: 6 },
  ],
};

/** The three presets, in the order the picker offers them. */
export const PRESET_PATTERNS: readonly BreathingPattern[] = [
  FOUR_SEVEN_EIGHT,
  BOX,
  PHYSIOLOGICAL_SIGH,
];

// --- custom ratios -------------------------------------------------------

/** Seconds. A phase shorter than this cannot be followed. */
export const MIN_PHASE_SECONDS = 1;
/** Seconds. Beyond this a hold stops being calming and becomes a breath-hold. */
export const MAX_PHASE_SECONDS = 20;
export const MIN_CYCLE_SECONDS = 4;
export const MAX_CYCLE_SECONDS = 60;

export type CustomRatioProblem =
  | 'not-finite'
  | 'phase-too-short'
  | 'phase-too-long'
  | 'cycle-too-short'
  | 'cycle-too-long';

/**
 * Why a custom ratio is unusable, or `null` if it is fine.
 *
 * Returns the reason rather than a bare boolean so the builder can say which
 * bound was crossed instead of just refusing.
 */
export function customRatioProblem(
  ratio: CustomRatio,
): CustomRatioProblem | null {
  let total = 0;

  for (const seconds of ratio) {
    if (!Number.isFinite(seconds)) return 'not-finite';
    if (seconds < MIN_PHASE_SECONDS) return 'phase-too-short';
    if (seconds > MAX_PHASE_SECONDS) return 'phase-too-long';
    total += seconds;
  }

  if (total < MIN_CYCLE_SECONDS) return 'cycle-too-short';
  if (total > MAX_CYCLE_SECONDS) return 'cycle-too-long';

  return null;
}

export function isValidCustomRatio(ratio: CustomRatio): boolean {
  return customRatioProblem(ratio) === null;
}

/**
 * Builds a pattern from an in / hold / out / hold ratio.
 *
 * @throws RangeError if the ratio is outside the bounds above. Callers that
 * cannot guarantee a validated ratio should check with `customRatioProblem`
 * first — this is a programmer error, not a user-facing one.
 */
export function patternFromCustomRatio(ratio: CustomRatio): BreathingPattern {
  const problem = customRatioProblem(ratio);
  if (problem !== null) {
    throw new RangeError(`invalid custom breathing ratio: ${problem}`);
  }

  const [inhale, holdFull, exhale, holdEmpty] = ratio;

  return {
    id: 'custom',
    phases: [
      { kind: 'inhale', seconds: inhale },
      { kind: 'hold-full', seconds: holdFull },
      { kind: 'exhale', seconds: exhale },
      { kind: 'hold-empty', seconds: holdEmpty },
    ],
  };
}

/**
 * The pattern for a session.
 *
 * @throws RangeError if `id` is `'custom'` without a valid ratio.
 */
export function getPattern(
  id: BreathingPatternId,
  customRatio?: CustomRatio,
): BreathingPattern {
  switch (id) {
    case '4-7-8':
      return FOUR_SEVEN_EIGHT;
    case '5-5-5-5':
      return BOX;
    case 'physiological-sigh':
      return PHYSIOLOGICAL_SIGH;
    case 'custom': {
      if (!customRatio) {
        throw new RangeError('the custom pattern needs a ratio');
      }
      return patternFromCustomRatio(customRatio);
    }
  }
}

// --- timing --------------------------------------------------------------

/** One full cycle, in seconds. */
export function cycleDuration(pattern: BreathingPattern): number {
  let total = 0;
  for (const phase of pattern.phases) total += phase.seconds;
  return total;
}

/**
 * How many whole cycles fit in a target duration.
 *
 * Rounds down, with a floor of one. A session that ends a few seconds early is
 * kinder than one that overruns what someone agreed to — and stopping
 * mid-exhale is worse than either.
 */
export function cyclesForDuration(
  pattern: BreathingPattern,
  targetSeconds: number,
): number {
  const cycle = cycleDuration(pattern);
  if (cycle <= 0) throw new RangeError('a pattern must have a positive cycle');
  return Math.max(1, Math.floor(targetSeconds / cycle));
}

/** Actual length of a session of `cycles` cycles, in seconds. */
export function sessionDuration(
  pattern: BreathingPattern,
  cycles: number,
): number {
  return cycleDuration(pattern) * cycles;
}
