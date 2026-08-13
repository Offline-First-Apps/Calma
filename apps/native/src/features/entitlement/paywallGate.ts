/**
 * When a paywall may appear -- and, far more often, when it may not.
 *
 * THE REVIEW THIS EXISTS BECAUSE OF.
 *
 * `plans/19-review-findings.md` R4. The one-star review that ended "I hope no
 * one ever downloads this game again" was not about monetisation existing.
 * The reviewer had accepted all of it. It was about something commercial
 * appearing in the middle of a task. In an anxiety app the equivalent moment
 * is worse than annoying: a price appearing while someone is mid-breath is
 * the app choosing that second to sell.
 *
 * So the gate is written as a deny-list of moments rather than an allow-list
 * of screens. A new screen is blocked by default the moment it registers a
 * hold, and nobody has to remember to add it to a list somewhere.
 *
 * TWO SEPARATE RULES, DELIBERATELY NOT MERGED.
 *
 *   - T07, frequency: a limit type shows the SHEET at most once per calendar
 *     day. Later hits get one inline line. Repeatedly selling to an anxious
 *     person is not acceptable even when the timing is fine.
 *   - T12, interruption: while anything is in flight, nothing commercial
 *     appears at all -- not even the inline line.
 *
 * They are not merged because they answer different questions and have
 * different answers: "not now" and "not again today" are different states,
 * and collapsing them would let a deferred sheet count as having been shown.
 *
 * `paywallDecision` is pure so that every condition T12 lists can be asserted
 * in Node with no device. That test is the point of the shape.
 */

export type LimitKind = 'worry' | 'journal' | 'history' | 'customRatio';

/**
 * Something in flight. Each is a reason to say nothing at all.
 *
 * `field` covers "any text field in the app has focus", which is the one that
 * catches the cases nobody enumerates: someone typing a worry, naming an
 * emotion, or searching their own writing.
 */
export type Blocker =
  | 'session'
  | 'panic'
  | 'worryWindow'
  | 'editor'
  | 'field'
  | 'animation';

/** How recently finished still counts as "just now". */
export const SETTLE_MS = 4000;

export interface PaywallContext {
  /** What is currently in flight. */
  blockers: ReadonlySet<Blocker>;
  /** When a session, window or entry last completed. */
  completedAt: number | null;
  now: number;
  /** Local day key, so markers reset at midnight rather than after 24h. */
  today: string;
  /** Limit kinds whose sheet has already been shown on `markerDay`. */
  shown: readonly LimitKind[];
  markerDay: string | null;
  /**
   * True when purchasing cannot work on this build at all -- no API key, or
   * the SDK failed to configure. Free tier with paywalls SUPPRESSED: selling
   * to someone whose purchase would fail anyway is the worst of both
   * (systems/05-entitlements.md).
   */
  suppressed: boolean;
}

export type PaywallDecision = 'sheet' | 'inline' | 'silent';

export function paywallDecision(
  kind: LimitKind,
  context: PaywallContext,
): PaywallDecision {
  if (context.suppressed) return 'silent';

  // T12. Anything in flight wins over everything below, including the inline
  // line -- "you've used 3 today" is still the app talking about money while
  // someone is in the middle of something.
  if (context.blockers.size > 0) return 'silent';

  if (
    context.completedAt !== null &&
    context.now - context.completedAt < SETTLE_MS
  ) {
    return 'silent';
  }

  const seenToday = context.markerDay === context.today && context.shown.includes(kind);
  return seenToday ? 'inline' : 'sheet';
}
