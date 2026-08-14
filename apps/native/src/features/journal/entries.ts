import type { JournalEntry } from '@calma/domain';
import { weekKey } from '@calma/domain';

/**
 * The list logic behind g6 and g7, kept out of the components.
 *
 * `apps/native/vitest.config.ts` runs pure Node with no renderer, so anything
 * with a decision in it has to live in a `.ts` module to be testable at all.
 * That constraint is doing real work here: grouping, preview selection and
 * match splitting are exactly the three places this feature could quietly
 * start misrepresenting someone's writing back to them.
 */

export interface EntryDay {
  /** Local calendar day, as a grouping key only. Never displayed. */
  key: string;
  entries: JournalEntry[];
}

/** Newest first, grouped into local calendar days. */
export function groupByDay(entries: readonly JournalEntry[]): EntryDay[] {
  const days: EntryDay[] = [];

  for (const entry of [...entries].sort((a, b) => b.createdAt - a.createdAt)) {
    const date = new Date(entry.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const last = days[days.length - 1];

    if (last?.key === key) last.entries.push(entry);
    else days.push({ key, entries: [entry] });
  }

  return days;
}

/**
 * The line shown for an entry in a list.
 *
 * The situation first, per T11. It falls through the other text fields rather
 * than showing a placeholder when the situation is blank, because someone who
 * skipped "what happened" and wrote a paragraph under "what went through your
 * mind" has not written an untitled entry -- they wrote that.
 *
 * Every candidate is the person's own words. Nothing here summarises,
 * truncates mid-word, or invents a title, and `emotion` is last because a
 * single word like "scared" standing alone as a list heading reads like a
 * diagnosis rather than like something someone said.
 */
export function previewOf(entry: JournalEntry): string {
  for (const value of [
    entry.situation,
    entry.automaticThought,
    entry.balancedThought,
    entry.evidenceAgainst,
    entry.evidenceFor,
    entry.emotion,
  ]) {
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }

  return '';
}

/**
 * Splits a line on the search term, case-insensitively.
 *
 * Even indices are unmatched text and odd indices are matches, so the caller
 * can render without a second pass. The subtlety worth pinning is that the
 * matched text is taken from the ORIGINAL string rather than from the query:
 * searching "priya" highlights "Priya" as the person wrote it. Handing
 * someone their own sentence back with the capitalisation changed is a small
 * thing that reads as the app having edited them.
 */
export function splitOnMatch(text: string, needle: string): string[] {
  const target = needle.toLowerCase();
  if (target.length === 0) return [text];

  const parts: string[] = [];
  const haystack = text.toLowerCase();

  let cursor = 0;
  for (;;) {
    const found = haystack.indexOf(target, cursor);
    if (found === -1) break;

    parts.push(text.slice(cursor, found), text.slice(found, found + target.length));
    cursor = found + target.length;
  }

  parts.push(text.slice(cursor));
  return parts;
}

/**
 * What the free tier may see, and how much it may not (plan 11 T10).
 *
 * `systems/05-entitlements.md`: "Journal history & search — Current week
 * only". So the split is by ISO week, Monday start, computed from the same
 * `weekKey` the journal allowance uses — one definition of "this week" across
 * the feature, because two would eventually disagree about a Sunday night.
 *
 * NOTHING IS TEASED. This returns the older entries' COUNT and not the
 * entries themselves, so a caller physically cannot render them blurred,
 * greyed, truncated or behind a lock. T10 forbids the fake-blur dark pattern,
 * and a function that hands back the content it says is unavailable is one
 * refactor away from putting it on screen.
 *
 * The count is what makes the prompt honest rather than vague: "42 older
 * entries are still here" says the writing was not lost, which is the single
 * thing someone needs to know before deciding whether to pay.
 */
export function currentWeekOnly(
  entries: readonly JournalEntry[],
  week: string,
): { visible: JournalEntry[]; older: number } {
  const visible: JournalEntry[] = [];
  let older = 0;

  for (const entry of entries) {
    if (weekKey(new Date(entry.createdAt)) === week) visible.push(entry);
    else older += 1;
  }

  return { visible, older };
}
