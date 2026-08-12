/**
 * The worry window's triage machine.
 *
 * One worry at a time, in the order they were carried in: ask whether it is
 * actionable, take an action or let it go, move on, and finish with a summary
 * of what happened.
 *
 * WHY THIS IS PURE AND LIVES HERE RATHER THAN IN THE SCREEN.
 *
 * The window survives the app being killed. Someone opens it at 8pm, gets
 * three worries in, and closes the phone; a cold boot has to resume at the
 * fourth. A machine that lives in component state cannot do that — its
 * position dies with the tree. So position is data: a queue and a cursor,
 * serialisable, written to `state:worryWindow` after every step.
 *
 * The consequence worth stating: nothing here holds worry *text*. The queue
 * is ids. Text is read one at a time by the screen and never accumulated,
 * because a resumable structure containing everything someone was afraid of
 * is exactly the artefact this feature exists to avoid creating.
 *
 * WHAT THE MACHINE DELIBERATELY CANNOT EXPRESS.
 *
 * There is no `skip`. f5's caption is explicit: two identical buttons, "a
 * fork, not a recommendation, and there's no third 'skip' making avoidance
 * free". Leaving the window entirely is always available and costs nothing —
 * but it is a departure, not a move within the machine.
 *
 * There is no progress fraction and no `total` accessor. `queue.length`
 * exists because a queue has a length, and the screens must not render it:
 * f4's caption forbids a total, a progress indicator, and any framing of the
 * window as something to "clear" or "get through".
 */

/** Where the window currently is. */
export type TriageStage =
  /** Before the first worry. "You saved this earlier." (f4) */
  | 'intro'
  /** Showing one worry and the fork. (f5) */
  | 'question'
  /** They said yes: capture one small step. (f6) */
  | 'action'
  /** They said not really: the release gesture. (f7) */
  | 'release'
  /** Everything in the queue has been dealt with. (f8) */
  | 'summary';

/** What became of a worry during this window. */
export type TriageOutcome = 'actioned' | 'released';

export interface TriageState {
  /**
   * Worry ids, oldest first, fixed at the moment the window opened.
   *
   * Fixed on purpose: a worry captured after the window opened does not join
   * the queue mid-session. f4's caption forbids adding from inside the
   * window, and a queue that grew while someone worked through it would make
   * finishing feel like chasing.
   */
  readonly queue: readonly string[];
  /** Index of the worry being looked at. Equals `queue.length` when done. */
  readonly cursor: number;
  readonly stage: TriageStage;
  /** Outcome per worry id, for the summary. Only ids already passed. */
  readonly outcomes: Readonly<Record<string, TriageOutcome>>;
}

/**
 * A window over the given worries.
 *
 * An empty queue is legal and lands directly on the summary — someone can
 * open the window with nothing pending, and being shown "nothing to do here"
 * is better than being refused entry to a room they chose to walk into.
 */
export function openWindow(ids: readonly string[]): TriageState {
  return {
    queue: [...ids],
    cursor: 0,
    stage: ids.length === 0 ? 'summary' : 'intro',
    outcomes: {},
  };
}

/** The id under the cursor, or `null` past the end. */
export function currentWorryId(state: TriageState): string | null {
  return state.queue[state.cursor] ?? null;
}

/** "I'm ready" on the intro. */
export function begin(state: TriageState): TriageState {
  if (state.stage !== 'intro') return state;
  return state.queue.length === 0
    ? { ...state, stage: 'summary' }
    : { ...state, stage: 'question' };
}

/**
 * The fork. `true` is "Yes", `false` is "Not really".
 *
 * Note the asymmetry that is NOT here: both answers cost one tap and lead to
 * one screen. Releasing is not made harder than acting to discourage it, and
 * acting is not made harder than releasing to encourage acceptance. Which of
 * the two is right depends on the worry, and the app does not know.
 */
export function answer(state: TriageState, actionable: boolean): TriageState {
  if (state.stage !== 'question') return state;
  return { ...state, stage: actionable ? 'action' : 'release' };
}

/**
 * Back from the action or release step to the fork.
 *
 * Both leaf steps are reachable in one tap and leave the same way, so a
 * misread question is one back-press from corrected rather than a worry
 * resolved the wrong way with no undo.
 */
export function reconsider(state: TriageState): TriageState {
  if (state.stage !== 'action' && state.stage !== 'release') return state;
  return { ...state, stage: 'question' };
}

/**
 * Records the outcome and moves to the next worry, or to the summary.
 *
 * The write to storage is the caller's job and happens first: this returns
 * the state that should be persisted, and a caller that advances without
 * writing has lost the resumption point rather than corrupted it.
 */
export function resolve(
  state: TriageState,
  outcome: TriageOutcome,
): TriageState {
  const id = currentWorryId(state);
  if (id === null) return state;
  if (state.stage !== 'action' && state.stage !== 'release') return state;

  const cursor = state.cursor + 1;

  return {
    ...state,
    cursor,
    stage: cursor >= state.queue.length ? 'summary' : 'question',
    outcomes: { ...state.outcomes, [id]: outcome },
  };
}

/** How many went each way, for f8's three copy variants. */
export interface TriageTally {
  actioned: number;
  released: number;
  /** Worries dealt with in this window. Not the day's capture count. */
  resolved: number;
}

export function tally(state: TriageState): TriageTally {
  let actioned = 0;
  let released = 0;

  for (const outcome of Object.values(state.outcomes)) {
    if (outcome === 'actioned') actioned += 1;
    else released += 1;
  }

  return { actioned, released, resolved: actioned + released };
}

/**
 * Which of f8's three sentences to use.
 *
 * Three variants rather than one with conditional clauses, because "One was
 * within your control — you made a plan. Two weren't — you let them go."
 * degrades badly when either number is zero, and "0 were within your control"
 * is the kind of sentence that makes an app feel like a form.
 */
export type SummaryShape = 'mixed' | 'allActioned' | 'allReleased' | 'none';

export function summaryShape(state: TriageState): SummaryShape {
  const { actioned, released } = tally(state);

  if (actioned === 0 && released === 0) return 'none';
  if (released === 0) return 'allActioned';
  if (actioned === 0) return 'allReleased';
  return 'mixed';
}

/**
 * Whether a persisted window is still worth resuming.
 *
 * A cursor past the end means the last worry was resolved and only the
 * summary remained; there is nothing left to walk. Restoring someone into a
 * summary of a session they have no memory of starting is worse than opening
 * the tab normally.
 */
export function isResumable(state: TriageState): boolean {
  return state.stage !== 'summary' && state.cursor < state.queue.length;
}

/**
 * Re-anchors a persisted window against what is actually still pending.
 *
 * Worries can leave the queue behind the window's back — released from
 * another entry point, or dropped by `repairIndexes` after a corrupt record.
 * Resuming against a stale queue would show a worry that no longer exists,
 * and `currentWorryId` would hand the screen an id whose record reads `null`.
 *
 * So the queue is filtered to ids that are still pending, and the cursor is
 * moved to the first of those rather than kept as a number. Keeping the index
 * would silently skip a worry every time one vanished before it.
 */
export function reconcile(
  state: TriageState,
  stillPending: readonly string[],
): TriageState {
  const pending = new Set(stillPending);
  const queue = state.queue.filter(
    (id) => pending.has(id) || state.outcomes[id] !== undefined,
  );

  // The first entry with no outcome yet. Everything before it is done.
  let cursor = queue.findIndex((id) => state.outcomes[id] === undefined);
  if (cursor === -1) cursor = queue.length;

  return {
    ...state,
    queue,
    cursor,
    stage:
      cursor >= queue.length
        ? 'summary'
        : state.stage === 'intro'
          ? 'intro'
          : 'question',
  };
}
