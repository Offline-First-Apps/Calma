import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

/**
 * The native app's environment.
 *
 * Calma has no network layer. The only keys here are RevenueCat's PUBLIC SDK
 * keys, which are designed to ship inside a binary and grant nothing on their
 * own -- there is no secret in this file and there must never be one, because
 * `EXPO_PUBLIC_` values are inlined into the JavaScript bundle at build time
 * and are readable by anyone who downloads the app.
 *
 * BOTH KEYS ARE OPTIONAL, DELIBERATELY.
 *
 * A missing key is a legitimate state, not a misconfiguration: it is what a
 * clone of this repo looks like before anyone has set up a RevenueCat
 * project, and it is what CI looks like. `configurePurchases` treats an
 * absent key exactly as it treats an SDK failure -- free tier, with every
 * paywall suppressed (systems/05-entitlements.md). Making these required
 * would mean the app could not boot at all without a billing account, which
 * for an app whose whole relief path is free would be the wrong dependency.
 */
export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_REVENUECAT_IOS_KEY: z.string().min(1).optional(),
    EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
