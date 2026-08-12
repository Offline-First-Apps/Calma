import { describe, expect, it } from 'vitest';

import {
  answer,
  begin,
  currentWorryId,
  isResumable,
  openWindow,
  reconcile,
  reconsider,
  resolve,
  summaryShape,
  tally,
  type TriageState,
} from './triage';

/** Walks a window to the summary, answering with the given verdicts. */
function walk(ids: string[], verdicts: boolean[]): TriageState {
  let state = begin(openWindow(ids));

  for (const actionable of verdicts) {
    state = answer(state, actionable);
    state = resolve(state, actionable ? 'actioned' : 'released');
  }

  return state;
}

describe('openWindow', () => {
  it('starts on the intro with the cursor at the first worry', () => {
    const state = openWindow(['a', 'b', 'c']);

    expect(state.stage).toBe('intro');
    expect(state.cursor).toBe(0);
    expect(currentWorryId(state)).toBe('a');
  });

  it('lands straight on the summary when nothing is pending', () => {
    // Opening an empty window is legal. Someone who taps "Open it now" with
    // nothing waiting should be shown a room with nothing in it, not refused.
    const state = openWindow([]);

    expect(state.stage).toBe('summary');
    expect(currentWorryId(state)).toBeNull();
  });

  it('copies the queue rather than aliasing the array it was given', () => {
    const ids = ['a', 'b'];
    const state = openWindow(ids);
    ids.push('c');

    expect(state.queue).toEqual(['a', 'b']);
  });
});

describe('the fork', () => {
  it('sends "Yes" to the action step and "Not really" to release', () => {
    const start = begin(openWindow(['a']));

    expect(answer(start, true).stage).toBe('action');
    expect(answer(start, false).stage).toBe('release');
  });

  it('goes back to the question from either leaf', () => {
    const start = begin(openWindow(['a']));

    expect(reconsider(answer(start, true)).stage).toBe('question');
    expect(reconsider(answer(start, false)).stage).toBe('question');
  });

  it('has no move that resolves a worry without an outcome', () => {
    // The absence of a `skip` is the point (f5's caption). The only way past
    // a worry is through one of the two branches, both of which record what
    // happened. If a third path is ever added this assertion is where the
    // conversation about it should start.
    const start = begin(openWindow(['a', 'b']));

    expect(resolve(start, 'actioned')).toBe(start);
    expect(currentWorryId(resolve(start, 'released'))).toBe('a');
  });
});

describe('advancing', () => {
  it('moves to the next worry and returns to the question', () => {
    let state = begin(openWindow(['a', 'b']));
    state = resolve(answer(state, true), 'actioned');

    expect(state.cursor).toBe(1);
    expect(state.stage).toBe('question');
    expect(currentWorryId(state)).toBe('b');
  });

  it('reaches the summary after the last worry', () => {
    const state = walk(['a', 'b'], [true, false]);

    expect(state.stage).toBe('summary');
    expect(currentWorryId(state)).toBeNull();
  });

  it('records an outcome per worry', () => {
    const state = walk(['a', 'b', 'c'], [true, false, false]);

    expect(state.outcomes).toEqual({
      a: 'actioned',
      b: 'released',
      c: 'released',
    });
  });
});

describe('tally and summary shape', () => {
  it('counts both directions', () => {
    expect(tally(walk(['a', 'b', 'c'], [true, false, false]))).toEqual({
      actioned: 1,
      released: 2,
      resolved: 3,
    });
  });

  it('picks the three copy variants apart', () => {
    expect(summaryShape(walk(['a', 'b'], [true, false]))).toBe('mixed');
    expect(summaryShape(walk(['a', 'b'], [true, true]))).toBe('allActioned');
    expect(summaryShape(walk(['a', 'b'], [false, false]))).toBe('allReleased');
    expect(summaryShape(openWindow([]))).toBe('none');
  });
});

describe('resumption', () => {
  it('is resumable partway through', () => {
    let state = begin(openWindow(['a', 'b', 'c']));
    state = resolve(answer(state, true), 'actioned');

    expect(isResumable(state)).toBe(true);
  });

  it('is not resumable once the summary is reached', () => {
    expect(isResumable(walk(['a'], [true]))).toBe(false);
  });

  it('survives a round trip through JSON', () => {
    // This is the whole reason the machine is data rather than a closure:
    // `state:worryWindow` holds exactly this, and a cold boot rebuilds from
    // it. If the state ever gains a function or a Set, this test fails here
    // rather than on someone's phone at 8pm.
    let state = begin(openWindow(['a', 'b', 'c']));
    state = resolve(answer(state, false), 'released');

    const restored = JSON.parse(JSON.stringify(state)) as TriageState;

    expect(restored).toEqual(state);
    expect(currentWorryId(restored)).toBe('b');
  });
});

describe('reconcile', () => {
  it('keeps the position when nothing has changed', () => {
    let state = begin(openWindow(['a', 'b', 'c']));
    state = resolve(answer(state, true), 'actioned');

    const fixed = reconcile(state, ['b', 'c']);

    expect(fixed.queue).toEqual(['a', 'b', 'c']);
    expect(currentWorryId(fixed)).toBe('b');
  });

  it('drops a worry that vanished before the cursor without skipping one', () => {
    // The bug this exists to prevent: keep the cursor as a number, drop 'b'
    // from the queue, and the cursor now points at 'c' having never shown
    // 'b' — one worry silently skipped. Re-anchoring on outcomes cannot do
    // that, because position is derived from what was actually dealt with.
    let state = begin(openWindow(['a', 'b', 'c']));
    state = resolve(answer(state, true), 'actioned');

    const fixed = reconcile(state, ['c']);

    expect(fixed.queue).toEqual(['a', 'c']);
    expect(currentWorryId(fixed)).toBe('c');
  });

  it('finishes when everything left has been dealt with', () => {
    let state = begin(openWindow(['a', 'b']));
    state = resolve(answer(state, false), 'released');

    const fixed = reconcile(state, []);

    expect(fixed.stage).toBe('summary');
    expect(isResumable(fixed)).toBe(false);
  });

  it('holds the intro when the window was never begun', () => {
    const fixed = reconcile(openWindow(['a', 'b']), ['a', 'b']);

    expect(fixed.stage).toBe('intro');
  });
});
