import type { JournalEntry } from '@calma/domain';

/**
 * The thought record, as a table.
 *
 * Six prompts, in the order a CBT thought record walks them, plus the
 * re-rating that closes it. They are data rather than six near-identical
 * components because the only thing that varies between five of them is the
 * prompt, the hint and which field they write to — and a table makes it
 * impossible for one of them to quietly grow a "required" flag.
 *
 * EVERY FIELD MAY BE LEFT BLANK (T03).
 *
 * There is no `required` here and nowhere to put one. Half a thought record
 * is still worth keeping, and a person who can only answer two of six prompts
 * at 3am has not filled the form in wrong. "Skip this one" is on every step
 * and is the same size as "Next".
 */

export type TextField =
  | 'situation'
  | 'automaticThought'
  | 'emotion'
  | 'evidenceFor'
  | 'evidenceAgainst'
  | 'balancedThought';

export interface TextStep {
  kind: 'text';
  field: TextField;
  /** `journal:` key for the prompt. */
  prompt: string;
  /** `journal:` key for the hint under it, if the design gives one. */
  hint?: string;
  /** Taller field for prompts that invite more than a sentence. */
  tall?: boolean;
}

export interface EmotionStep {
  kind: 'emotion';
  prompt: string;
}

export interface ReRateStep {
  kind: 'reRate';
  prompt: string;
}

export type Step = TextStep | EmotionStep | ReRateStep;

export const STEPS: readonly Step[] = [
  {
    kind: 'text',
    field: 'situation',
    prompt: 'situation',
    hint: 'situationHint',
  },
  { kind: 'text', field: 'automaticThought', prompt: 'thought' },
  /**
   * Emotion and intensity are ONE step, not two.
   *
   * "Anxious" and "how strong" are a single act of noticing; splitting them
   * makes the second a quiz about the first. The control captures a free-text
   * name alongside the 0-10 — there is no list to pick from, because a fixed
   * emotion vocabulary tells someone their feeling is not on the menu (T04).
   */
  { kind: 'emotion', prompt: 'emotion' },
  { kind: 'text', field: 'evidenceFor', prompt: 'evidenceFor', tall: true },
  {
    kind: 'text',
    field: 'evidenceAgainst',
    prompt: 'evidenceAgainst',
    tall: true,
  },
  { kind: 'text', field: 'balancedThought', prompt: 'balanced', tall: true },
  { kind: 'reRate', prompt: 'reRate' },
];

/** The value a text step currently holds. */
export function valueFor(entry: JournalEntry, step: TextStep): string {
  return entry[step.field];
}
