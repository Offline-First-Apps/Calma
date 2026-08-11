import { describe, expect, it } from 'vitest';

import { createIdFactory, ID_LENGTH, newId } from './id';

const CROCKFORD = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/;

describe('newId', () => {
  it('is 26 characters of Crockford base32', () => {
    const id = newId();
    expect(id).toHaveLength(ID_LENGTH);
    expect(id).toHaveLength(26);
    expect(CROCKFORD.test(id)).toBe(true);
  });

  it('omits the letters that are easy to misread', () => {
    const ids = Array.from({ length: 500 }, () => newId()).join('');
    for (const letter of ['I', 'L', 'O', 'U']) {
      expect(ids.includes(letter)).toBe(false);
    }
  });

  it('produces unique ids in a tight loop', () => {
    const ids = Array.from({ length: 10_000 }, () => newId());
    expect(new Set(ids).size).toBe(10_000);
  });

  it('produces ids that sort into creation order in a tight loop', () => {
    const ids = Array.from({ length: 10_000 }, () => newId());
    expect([...ids].sort()).toEqual(ids);
  });
});

describe('createIdFactory', () => {
  const frozen = (at: number, random = () => 0.5) =>
    createIdFactory({ now: () => at, random });

  it('keeps 10,000 ids unique inside a single millisecond', () => {
    const next = frozen(1_754_000_000_000);
    const ids = Array.from({ length: 10_000 }, () => next());
    expect(new Set(ids).size).toBe(10_000);
  });

  it('keeps those ids sorted inside a single millisecond', () => {
    const next = frozen(1_754_000_000_000);
    const ids = Array.from({ length: 10_000 }, () => next());
    expect([...ids].sort()).toEqual(ids);
  });

  it('stays unique even when the random source is degenerate', () => {
    // Uniqueness within a tick comes from the monotonic increment, not from
    // luck. A random source stuck at zero must not produce a collision.
    const next = frozen(1_754_000_000_000, () => 0);
    const ids = Array.from({ length: 5_000 }, () => next());
    expect(new Set(ids).size).toBe(5_000);
    expect([...ids].sort()).toEqual(ids);
  });

  it('shares a timestamp prefix within a millisecond', () => {
    const next = frozen(1_754_000_000_000);
    const prefixes = new Set(
      Array.from({ length: 100 }, () => next().slice(0, 10)),
    );
    expect(prefixes.size).toBe(1);
  });

  it('sorts across milliseconds by time, not by randomness', () => {
    let clock = 1_754_000_000_000;
    // A late id drawing minimal randomness must still sort after an early id
    // drawing maximal randomness.
    const next = createIdFactory({
      now: () => clock,
      random: () => (clock === 1_754_000_000_000 ? 0.999_999 : 0),
    });
    const early = next();
    clock += 1;
    const late = next();
    expect(early < late).toBe(true);
  });

  it('sorts correctly across a base32 digit rollover', () => {
    let clock = 1_754_000_000_031;
    const next = createIdFactory({ now: () => clock, random: () => 0 });
    const before = next();
    clock += 1;
    const after = next();
    expect(before < after).toBe(true);
    expect(before.slice(0, 10)).not.toBe(after.slice(0, 10));
  });

  it('never reorders history when the clock jumps backwards', () => {
    let clock = 1_754_000_000_000;
    const next = createIdFactory({ now: () => clock, random: () => 0.5 });
    const first = next();
    clock -= 60_000; // an NTP correction, or someone changing the time
    const second = next();
    const third = next();
    expect(first < second).toBe(true);
    expect(second < third).toBe(true);
  });

  it('rejects a timestamp beyond 48 bits', () => {
    const next = createIdFactory({ now: () => 281_474_976_710_656 });
    expect(() => next()).toThrow();
  });

  it('gives each factory its own state', () => {
    const a = frozen(1_754_000_000_000, () => 0);
    const b = frozen(1_754_000_000_000, () => 0);
    expect(a()).toBe(b());
  });
});
