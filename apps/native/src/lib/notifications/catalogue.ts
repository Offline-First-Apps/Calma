import type { Tier } from '@calma/domain';

/**
 * The four notifications Calma can send. All of them. Ever.
 *
 * `systems/06-notifications.md`: *"a notification from Calma should feel like
 * a friend leaving a note, not an app demanding attention. If in doubt, don't
 * send it."*
 *
 * There are no re-engagement notifications, no "we miss you", no streak-loss
 * alerts, and no promotional notifications. Adding a fifth entry to this table
 * is a product decision, not an implementation detail — which is why the table
 * is a `const` with a closed union rather than a list something can push onto.
 *
 * **NO NOTIFICATION EVER CARRIES USER-WRITTEN CONTENT.** Lock-screen previews
 * are visible to anyone holding the phone, so bodies interpolate counts and
 * nothing else. `catalogue.test.ts` asserts that mechanically, because a
 * template is one careless edit away from leaking a worry onto a lock screen.
 */

export type NotificationId =
  | 'worry-window-soon'
  | 'worry-window-open'
  | 'journal-streak-nudge'
  | 'weekly-checkin';

/**
 * Android channels. `LOW` means no heads-up interruption — a note to find
 * later rather than something that takes over the screen.
 */
export type ChannelId = 'worry-window' | 'gentle';

export interface CatalogueEntry {
  /** The `notifications` i18n key. Titles are always `notifications:title`. */
  bodyKey: string;
  channel: ChannelId;
  tier: Tier;
  /**
   * The only interpolation any body is allowed. `count` is a NUMBER — worries
   * pending, or days in a streak. There is no variant that takes a string,
   * and that is the mechanism by which user text cannot reach a lock screen.
   */
  takesCount: boolean;
}

export const CATALOGUE: Readonly<Record<NotificationId, CatalogueEntry>> = {
  'worry-window-soon': {
    bodyKey: 'worryWindowSoon',
    channel: 'worry-window',
    tier: 'free',
    takesCount: true,
  },
  'worry-window-open': {
    bodyKey: 'worryWindowOpenSoft',
    channel: 'worry-window',
    tier: 'free',
    takesCount: false,
  },
  'journal-streak-nudge': {
    bodyKey: 'streakNudge',
    channel: 'gentle',
    tier: 'plus',
    takesCount: true,
  },
  'weekly-checkin': {
    bodyKey: 'weeklyCheckin',
    channel: 'gentle',
    tier: 'plus',
    takesCount: false,
  },
} as const;

export const NOTIFICATION_IDS = Object.keys(CATALOGUE) as NotificationId[];

/** Everything a free account can receive. */
export function idsForTier(tier: Tier): NotificationId[] {
  return NOTIFICATION_IDS.filter(
    (id) => CATALOGUE[id].tier === 'free' || tier === 'plus',
  );
}
