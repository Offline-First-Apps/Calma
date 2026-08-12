/**
 * ULID-style identifiers: 48 bits of millisecond timestamp followed by 80 bits
 * of randomness, Crockford base32, 26 characters.
 *
 * Ids sort lexicographically by creation time, which is the entire reason for
 * choosing this shape. `idx:worry:pending` and friends can sort strings and be
 * chronological for free — no secondary time index, no parsing on read
 * (systems/02-data-layer.md § IDs).
 *
 * Randomness is injectable rather than imported. `@calma/domain` may not depend
 * on anything platform-bound, and these ids never leave the device or protect
 * anything, so `Math.random` is an honest default; a caller with access to a
 * CSPRNG can pass one in.
 */

/** Crockford base32: no I, L, O or U, so an id cannot be misread aloud. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LENGTH = 32;

const TIME_CHARS = 10; // 48 bits
const RANDOM_CHARS = 16; // 80 bits

export const ID_LENGTH = TIME_CHARS + RANDOM_CHARS;

/** Largest timestamp representable in 48 bits: some time in AD 10889. */
const MAX_TIME = 281_474_976_710_655;

export interface IdFactoryOptions {
  /** Epoch milliseconds. Injectable so tests can freeze the clock. */
  now?: () => number;
  /** Returns a float in [0, 1). */
  random?: () => number;
}

function encodeTime(time: number): string {
  if (!Number.isFinite(time) || time < 0 || time > MAX_TIME) {
    throw new RangeError(`id timestamp out of range: ${time}`);
  }
  let remaining = Math.floor(time);
  let out = '';
  for (let i = 0; i < TIME_CHARS; i++) {
    const digit = remaining % ENCODING_LENGTH;
    out = ALPHABET[digit] + out;
    remaining = Math.floor(remaining / ENCODING_LENGTH);
  }
  return out;
}

/**
 * Builds an id generator with its own monotonic state.
 *
 * Within a single millisecond the random block is incremented rather than
 * redrawn. That is what makes ids generated in the same tick both unique and
 * correctly ordered — two worries captured in the same frame still read back
 * in the order they were typed.
 */
export function createIdFactory(options: IdFactoryOptions = {}): () => string {
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? (() => Math.random());

  let lastTime = -1;
  let lastRandom: number[] = [];

  const drawRandom = (): number[] => {
    const digits: number[] = new Array<number>(RANDOM_CHARS);
    for (let i = 0; i < RANDOM_CHARS; i++) {
      const draw = Math.floor(random() * ENCODING_LENGTH);
      digits[i] = Math.min(Math.max(draw, 0), ENCODING_LENGTH - 1);
    }
    return digits;
  };

  const incrementRandom = (digits: number[]): void => {
    for (let i = digits.length - 1; i >= 0; i--) {
      const digit = digits[i] ?? 0;
      if (digit < ENCODING_LENGTH - 1) {
        digits[i] = digit + 1;
        return;
      }
      digits[i] = 0;
    }
    // 2^80 ids inside one millisecond. Unreachable, but not silently wrong.
    throw new Error('id randomness exhausted within a single millisecond');
  };

  return function nextId(): string {
    // A clock that jumps backwards — a manual change, an NTP correction — must
    // not reorder someone's history. We hold the last timestamp and keep
    // incrementing. The record's own `createdAt` remains the source of truth
    // for when something happened; the id's job is only to preserve order.
    const time = Math.max(now(), lastTime);

    if (time === lastTime) {
      incrementRandom(lastRandom);
    } else {
      lastTime = time;
      lastRandom = drawRandom();
    }

    let suffix = '';
    for (const digit of lastRandom) suffix += ALPHABET[digit];

    return encodeTime(time) + suffix;
  };
}

/** The app-wide generator. */
export const newId = createIdFactory();
