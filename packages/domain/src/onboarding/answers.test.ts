import { describe, expect, it } from 'vitest';

import { defaultPrefs } from '../entities/prefs';
import {
  DEFAULT_WORRY_WINDOW,
  EMPTY_ANSWERS,
  applyAnswers,
  leadToolFor,
  shouldNamePanicButton,
  windowWasGuessed,
  worryWindowFor,
} from './answers';

describe('the worry window each answer seeds', () => {
  it('follows systems/11 for a single answer', () => {
    expect(worryWindowFor(['night'])).toBe('20:00');
    expect(worryWindowFor(['morning'])).toBe('08:00');
    expect(worryWindowFor(['day'])).toBe('18:00');
    expect(worryWindowFor(['unpredictable'])).toBe('19:00');
  });

  it('resolves collisions by rule, not by array order', () => {
    // The same set in either order must give the same window, or the result
    // depends on which card the person happened to tap first.
    expect(worryWindowFor(['morning', 'night'])).toBe('20:00');
    expect(worryWindowFor(['night', 'morning'])).toBe('20:00');
    expect(worryWindowFor(['day', 'morning'])).toBe('18:00');
    expect(worryWindowFor(['morning', 'day'])).toBe('18:00');
  });

  it('lets a specific answer beat "it\'s hard to say"', () => {
    // Taking the vague one over the real one throws away the thing they
    // actually told us.
    expect(worryWindowFor(['unpredictable', 'morning'])).toBe('08:00');
  });

  it('falls back to the app default when nothing was chosen', () => {
    expect(worryWindowFor([])).toBe(DEFAULT_WORRY_WINDOW);
    expect(worryWindowFor([])).toBe(defaultPrefs.worryWindowTime);
  });

  it('ignores an option it does not recognise', () => {
    // Answers survive across app versions. An id retired in a later release
    // must degrade to the default rather than throw at 2am.
    expect(worryWindowFor(['whenever'])).toBe(DEFAULT_WORRY_WINDOW);
  });
});

describe('whether the reveal admits the window was a guess', () => {
  it('does when "it\'s hard to say" was the only answer', () => {
    expect(windowWasGuessed(['unpredictable'])).toBe(true);
  });

  it('does when the question was skipped entirely', () => {
    expect(windowWasGuessed([])).toBe(true);
  });

  it('does not when something specific was chosen too', () => {
    expect(windowWasGuessed(['unpredictable', 'night'])).toBe(false);
  });
});

describe('what Home leads with', () => {
  it('leads with the sigh when nothing has helped yet', () => {
    expect(leadToolFor({ ...EMPTY_ANSWERS, helped: ['nothing'] })).toBe('sigh');
  });

  it('leads with the sigh when the question was skipped', () => {
    expect(leadToolFor(EMPTY_ANSWERS)).toBe('sigh');
  });

  it('leads with the sigh when onboarding never happened at all', () => {
    expect(leadToolFor(null)).toBe('sigh');
  });

  it('follows what the person said helped', () => {
    expect(leadToolFor({ ...EMPTY_ANSWERS, helped: ['breathing'] })).toBe('breathing');
    expect(leadToolFor({ ...EMPTY_ANSWERS, helped: ['writing'] })).toBe('journal');
  });

  it('resolves breathing over writing, deterministically', () => {
    const both = { ...EMPTY_ANSWERS, helped: ['writing', 'breathing'] };
    expect(leadToolFor(both)).toBe('breathing');
    expect(leadToolFor({ ...EMPTY_ANSWERS, helped: ['breathing', 'writing'] })).toBe('breathing');
  });

  it('lets a real answer override a mis-tapped "nothing yet"', () => {
    expect(leadToolFor({ ...EMPTY_ANSWERS, helped: ['nothing', 'writing'] })).toBe('journal');
  });

  it('leads with the sigh for someone whose answer we cannot act on', () => {
    // "Talking to someone" is a true and useful answer that this app has no
    // feature for. It must not silently become a different tool.
    expect(leadToolFor({ ...EMPTY_ANSWERS, helped: ['talking'] })).toBe('sigh');
  });
});

describe('naming the panic button on the reveal', () => {
  it('names it when panic is why they came', () => {
    expect(shouldNamePanicButton({ ...EMPTY_ANSWERS, why: ['panic'] })).toBe(true);
  });

  it('does not otherwise', () => {
    expect(shouldNamePanicButton({ ...EMPTY_ANSWERS, why: ['worry'] })).toBe(false);
    expect(shouldNamePanicButton(null)).toBe(false);
  });
});

describe('applyAnswers', () => {
  it('produces a valid prefs patch from a full set of answers', () => {
    const patch = applyAnswers({
      why: ['panic', 'night'],
      when: ['night'],
      helped: ['writing'],
    });

    expect(patch.worryWindowTime).toBe('20:00');
    expect(patch.onboardingAnswers.helped).toEqual(['writing']);
  });

  it('produces sane defaults from a completely skipped flow', () => {
    // The whole D-014 promise in one assertion: someone who answered nothing
    // has a working app, not a half-configured one.
    const patch = applyAnswers(EMPTY_ANSWERS);

    expect(patch.worryWindowTime).toBe(defaultPrefs.worryWindowTime);
    expect(leadToolFor(patch.onboardingAnswers)).toBe('sigh');
  });

  it('stores the answers verbatim rather than the conclusions', () => {
    // The record is what the person said. What we inferred from it is
    // re-derived on read, so editing an answer in Settings is enough.
    const answers = { why: ['tense'], when: ['day', 'morning'], helped: ['talking'] };
    expect(applyAnswers(answers).onboardingAnswers).toEqual(answers);
  });
});
