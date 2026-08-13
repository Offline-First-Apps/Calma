import { env } from '@calma/env/native';
import type { Tier } from '@calma/domain';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * RevenueCat, in anonymous mode (plan 11 T01, T03, T04; D-002).
 *
 * `logIn()` IS NEVER CALLED, ANYWHERE.
 *
 * Calma has no accounts and must not create a pseudo-identity. RevenueCat
 * will happily accept an app-generated user id and that id would then travel
 * with every receipt -- a stable identifier for a person's use of an anxiety
 * app, held by a third party, in an app whose second promise is that no data
 * leaves the device. Anonymous mode means the only thing sent is a store
 * receipt, which the store already has.
 *
 * The cost is real and is accepted: with no identity, RESTORE IS THE ONLY
 * RECOVERY PATH after a device change. Settings says so in one sentence.
 *
 * INITIALISATION NEVER BLOCKS BOOT.
 *
 * `01-architecture.md`. Someone opening this app at 3am is not waiting on a
 * billing SDK, so this is fired and forgotten from the boot gate and every
 * failure mode resolves to the same place: free tier with paywalls
 * suppressed. Not free tier with paywalls -- selling to someone whose
 * purchase would fail anyway is the worst of both.
 */

/** Every product grants this one entitlement. */
export const ENTITLEMENT_ID = 'plus';

export type PurchaseResult =
  | { kind: 'purchased'; tier: Tier }
  | { kind: 'cancelled' }
  | { kind: 'failed' };

function apiKey(): string | undefined {
  return Platform.OS === 'ios'
    ? env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

/**
 * Whether purchasing can work at all on this build.
 *
 * Read by the store to decide whether paywalls are suppressed. It is a
 * question about the build, not about the network: a configured app with no
 * signal still shows its paywall, because the purchase will go through when
 * the train leaves the tunnel.
 */
export function purchasesConfigurable(): boolean {
  return apiKey() !== undefined;
}

let configured = false;

export function configurePurchases(): boolean {
  if (configured) return true;

  const key = apiKey();
  if (key === undefined) return false;

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
    // No `appUserID`. Passing one -- even a random one -- is how an app
    // without accounts acquires an identity by accident.
    Purchases.configure({ apiKey: key });
    configured = true;
  } catch {
    // Swallowed on purpose. There is nothing a person could do about this and
    // nothing they need to know: every relief tool in Calma is free.
    configured = false;
  }

  return configured;
}

export function tierFrom(info: CustomerInfo): Tier {
  return info.entitlements.active[ENTITLEMENT_ID] === undefined ? 'free' : 'plus';
}

/** The current tier from the SDK, or `null` if it could not be reached. */
export async function fetchTier(): Promise<Tier | null> {
  if (!configured) return null;

  try {
    return tierFrom(await Purchases.getCustomerInfo());
  } catch {
    return null;
  }
}

/**
 * The available packages, newest offering first.
 *
 * Returns an empty list rather than throwing when offerings cannot be
 * reached, because the caller's correct response is identical either way:
 * show no prices. PRICES ARE NEVER HARDCODED and never converted client-side
 * -- `product.priceString` is already localised and already correct for the
 * store the person is actually buying from.
 */
export async function fetchPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

/**
 * Buys a package.
 *
 * Cancellation is not a failure and must not be reported as one: it dismisses
 * silently, with no "are you sure", no retention offer and no second chance
 * screen. A real failure gets one plain sentence with no error code and no
 * red (systems/05-entitlements.md).
 */
export async function purchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { kind: 'purchased', tier: tierFrom(customerInfo) };
  } catch (error) {
    const cancelled =
      typeof error === 'object' &&
      error !== null &&
      (error as { userCancelled?: boolean }).userCancelled === true;

    return cancelled ? { kind: 'cancelled' } : { kind: 'failed' };
  }
}

/** Restore. Succeeds without an account, because there is no account. */
export async function restore(): Promise<Tier | null> {
  if (!configured) return null;

  try {
    return tierFrom(await Purchases.restorePurchases());
  } catch {
    return null;
  }
}
