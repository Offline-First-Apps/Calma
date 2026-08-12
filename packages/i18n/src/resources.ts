import breathing from './locales/en/breathing.json';
import common from './locales/en/common.json';
import entitlement from './locales/en/entitlement.json';
import journal from './locales/en/journal.json';
import notifications from './locales/en/notifications.json';
import onboarding from './locales/en/onboarding.json';
import progress from './locales/en/progress.json';
import settings from './locales/en/settings.json';
import worry from './locales/en/worry.json';

/**
 * The bundles, statically imported so Metro can tree-shake and so a missing
 * namespace is a build error rather than a blank screen.
 *
 * Namespaces mirror the feature folders in `apps/native/src/features/`. A
 * screen loads its own namespace plus `common`.
 */
export const en = {
  common,
  onboarding,
  breathing,
  worry,
  journal,
  progress,
  entitlement,
  settings,
  notifications,
} as const;

export const NAMESPACES = [
  'common',
  'onboarding',
  'breathing',
  'worry',
  'journal',
  'progress',
  'entitlement',
  'settings',
  'notifications',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NAMESPACE: Namespace = 'common';

export const resources = { en } as const;

export type Resources = typeof en;
