import {
  type BreathPhase,
  type BreathPhaseKind,
  type BreathingPattern,
  cycleDuration,
} from './breathing';

/**
 * The breathing phase machine.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A PRECOMPUTED TIMELINE AND NOT A TICKING STATE MACHINE.
 *
 * A session's whole schedule is knowable the moment it starts: the pattern
 * does not change mid-session (that is a rule, not an oversight -- see plan
 * 06 T11), so every phase boundary can be worked out up front.
 *
 * That matters because of D-004. The orb is animated by Reanimated on the UI
 * thread, and the UI thread cannot call back into arbitrary JavaScript. A
 * machine that had to be *stepped* would need either a JS timer -- which
 * drops frames under load, and a dropped frame during an inhale is one a
 * person can feel -- or a workletised call across the bridge on every tick.
 *
 * A flat array of phases with absolute start times needs neither. The UI
 * thread receives plain numbers and does a short search over them. There is
 * no timer anywhere in the breathing engine, and no animation state in
 * Zustand, because there is no state to hold: at any elapsed time, the phase
 * is a pure function of the timeline.
 *
 * It also means the entire engine is testable in Node with no frame loop,
 * which is the only reason any of this can be verified before it ever runs
 * on a device.
 * ---------------------------------------------------------------------------
 */

/** The four labels a person ever sees, plus the sigh's second sip. */
export type BreathLabel =
  | 'inhale'
  | 'secondInhale'
  | 'holdFull'
  | 'exhale'
  | 'holdEmpty';

/**
 * Orb scale at each end of the breath (systems/03-design-system.md).
 *
 * These live here rather than in the component because the physiological
 * sigh's curve is a property of the *pattern*, not of the rendering, and
 * because putting them here is what makes the curve testable.
 */
export const SCALE_EXHALED = 0.62;
export const SCALE_INHALED = 1;
/**
 * Where the sigh's first sip stops.
 *
 * The whole point of the physiological sigh is that it reads as two distinct
 * sips of air rather than one wobbly inhale. Stopping the first at 0.85 and
 * letting the second carry the last 0.15 is what sells that -- the second sip
 * is visibly smaller, which is also what it is.
 */
export const SCALE_SIGH_MID = 0.85;

export const OPACITY_EXHALED = 0.75;
export const OPACITY_INHALED = 1;

/**
 * A phase shorter than this never gets its own label.
 *
 * The sigh carries a 180ms micro-hold between its two inhales. Flashing the
 * word "Hold" for a sixth of a second would read as a glitch, and a glitch in
 * the one screen someone opens while shaking is worse than no label at all.
 * Short phases inherit their neighbour's label instead, so the word on screen
 * stays still while the orb does the fine detail.
 *
 * Presets are unaffected apart from that micro-hold; custom ratios are
 * validated to one second or more, so this only ever bites where it should.
 */
export const LABEL_MIN_SECONDS = 0.6;

/** One phase of one cycle, with everything the renderer needs, resolved. */
export interface BreathStep {
  /** Position in the timeline. */
  index: number;
  kind: BreathPhaseKind;
  /** Zero-based cycle this phase belongs to. */
  cycle: number;
  /** Seconds from session start. */
  startsAt: number;
  /** Seconds from session start. `startsAt + seconds`. */
  endsAt: number;
  seconds: number;
  /**
   * The word shown beneath the orb. Not always derived from `kind` -- a
   * micro-hold inherits its neighbour's label rather than flickering.
   */
  label: BreathLabel;
  /** True when this phase shows a label the previous phase did not. */
  labelChanges: boolean;
  /** Orb scale at the start and end of this phase. */
  fromScale: number;
  toScale: number;
  /** True on the last phase of a cycle. */
  endsCycle: boolean;
}

export interface BreathTimeline {
  patternId: BreathingPattern['id'];
  steps: readonly BreathStep[];
  cycles: number;
  /** Total session length in seconds. */
  duration: number;
}

/** Whether a cycle contains a second sip, which changes the first inhale. */
function isSigh(phases: readonly BreathPhase[]): boolean {
  for (const phase of phases) {
    if (phase.kind === 'second-inhale') return true;
  }
  return false;
}

function labelFor(kind: BreathPhaseKind): BreathLabel {
  switch (kind) {
    case 'inhale':
      return 'inhale';
    case 'second-inhale':
      return 'secondInhale';
    case 'hold-full':
      return 'holdFull';
    case 'exhale':
      return 'exhale';
    case 'hold-empty':
      return 'holdEmpty';
  }
}

/**
 * Where the orb should be at the end of a phase, given where it starts.
 *
 * `sigh` changes only one thing: a first inhale stops short at 0.85 because
 * something else is coming. Everything else is the same breath.
 */
function targetScale(
  kind: BreathPhaseKind,
  current: number,
  sigh: boolean,
): number {
  switch (kind) {
    case 'inhale':
      return sigh ? SCALE_SIGH_MID : SCALE_INHALED;
    case 'second-inhale':
      return SCALE_INHALED;
    case 'exhale':
      return SCALE_EXHALED;
    case 'hold-full':
    case 'hold-empty':
      // A hold holds. The ambient drift keeps it from being truly still,
      // but that runs independently of the breath and is not modelled here.
      return current;
  }
}

/**
 * Orb opacity for a given scale.
 *
 * Derived rather than stored so the two can never disagree. The design maps
 * scale 0.62..1.0 onto opacity 0.75..1.0 linearly, which means a held breath
 * at 0.85 sits at 0.90 without anyone having to write that number down.
 */
export function opacityForScale(scale: number): number {
  const t = (scale - SCALE_EXHALED) / (SCALE_INHALED - SCALE_EXHALED);
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return OPACITY_EXHALED + clamped * (OPACITY_INHALED - OPACITY_EXHALED);
}

/**
 * Expands a pattern into every phase of every cycle.
 *
 * @throws RangeError if `cycles` is not a positive integer, or if the pattern
 * has no usable phases. Both are programmer errors: `cyclesForDuration`
 * already floors at one, and the patterns are constants.
 */
export function buildTimeline(
  pattern: BreathingPattern,
  cycles: number,
): BreathTimeline {
  if (!Number.isInteger(cycles) || cycles < 1) {
    throw new RangeError(`a session needs at least one whole cycle, got ${cycles}`);
  }

  // Zero-length phases are dropped rather than rendered. Presets omit absent
  // holds entirely, so this only matters for a hand-built pattern -- but a
  // phase of zero seconds would divide by zero when computing progress, and
  // silently skipping it is kinder than crashing mid-breath.
  const phases = pattern.phases.filter((phase) => phase.seconds > 0);

  if (phases.length === 0) {
    throw new RangeError('a pattern needs at least one phase longer than zero');
  }

  const sigh = isSigh(phases);
  const steps: BreathStep[] = [];

  let elapsed = 0;
  let scale = SCALE_EXHALED;

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (let i = 0; i < phases.length; i += 1) {
      const phase = phases[i]!;
      const toScale = targetScale(phase.kind, scale, sigh);

      steps.push({
        index: steps.length,
        kind: phase.kind,
        cycle,
        startsAt: elapsed,
        endsAt: elapsed + phase.seconds,
        seconds: phase.seconds,
        label: labelFor(phase.kind),
        // Filled in below, once every neighbour is known.
        labelChanges: true,
        fromScale: scale,
        toScale,
        endsCycle: i === phases.length - 1,
      });

      elapsed += phase.seconds;
      scale = toScale;
    }
  }

  resolveLabels(steps);

  return {
    patternId: pattern.id,
    steps,
    cycles,
    duration: elapsed,
  };
}

/**
 * Second pass: suppress labels for phases too short to read.
 *
 * A short phase takes the label of the phase before it, so the word on screen
 * simply persists. The first phase has nothing before it, so it borrows from
 * ahead instead.
 */
function resolveLabels(steps: BreathStep[]): void {
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]!;

    if (step.seconds < LABEL_MIN_SECONDS) {
      const inherited = i > 0 ? steps[i - 1]!.label : steps[i + 1]?.label;
      if (inherited !== undefined) step.label = inherited;
    }
  }

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]!;
    step.labelChanges = i === 0 || steps[i - 1]!.label !== step.label;
  }
}

/**
 * The phase at a given elapsed time, or `null` once the session is over.
 *
 * Linear search. A session is a few dozen steps at most, this is called from
 * the JS thread only (the UI thread runs its own inlined copy of the same
 * search inside a worklet), and a binary search here would be a clever way to
 * make an already-free operation harder to read.
 */
export function phaseAt(
  timeline: BreathTimeline,
  elapsedSeconds: number,
): BreathStep | null {
  if (elapsedSeconds < 0) return timeline.steps[0] ?? null;

  for (const step of timeline.steps) {
    // `<` on the upper bound so a boundary belongs to the phase starting
    // there, not the one ending there. At exactly 4.0s of 4-7-8 you are
    // holding, not still inhaling.
    if (elapsedSeconds >= step.startsAt && elapsedSeconds < step.endsAt) {
      return step;
    }
  }

  return null;
}

/** How far through a phase a given elapsed time is, 0..1. */
export function progressWithin(step: BreathStep, elapsedSeconds: number): number {
  const t = (elapsedSeconds - step.startsAt) / step.seconds;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** The next phase, or `null` at the end of the session. */
export function nextStep(
  timeline: BreathTimeline,
  step: BreathStep,
): BreathStep | null {
  return timeline.steps[step.index + 1] ?? null;
}

/**
 * How many whole cycles were finished by the time someone stopped.
 *
 * Rounds down: a cycle interrupted three-quarters of the way through was not
 * completed. This feeds `BreathingSession.cyclesCompleted`, which feeds the
 * Progress tab, and inflating it would make the app quietly lie to someone
 * about their own week.
 */
export function cyclesCompletedAt(
  timeline: BreathTimeline,
  elapsedSeconds: number,
): number {
  let completed = 0;

  for (const step of timeline.steps) {
    if (step.endsCycle && elapsedSeconds >= step.endsAt) completed += 1;
  }

  return completed;
}

/**
 * Extends a running session by more cycles.
 *
 * Returns a fresh timeline rather than mutating: the orb may be mid-phase
 * when someone taps "A bit longer", and the phases already elapsed have to
 * keep the exact start times they were animated against, or the orb jumps.
 *
 * The pattern cannot change here, only the length. Changing ratios mid-session
 * would mean re-teaching someone a rhythm they had just settled into.
 */
export function extendTimeline(
  pattern: BreathingPattern,
  timeline: BreathTimeline,
  extraCycles: number,
): BreathTimeline {
  if (!Number.isInteger(extraCycles) || extraCycles < 1) {
    throw new RangeError(`an extension needs at least one cycle, got ${extraCycles}`);
  }

  return buildTimeline(pattern, timeline.cycles + extraCycles);
}

/** Sanity helper: the timeline's own length must match the pattern's maths. */
export function expectedDuration(
  pattern: BreathingPattern,
  cycles: number,
): number {
  return cycleDuration(pattern) * cycles;
}
