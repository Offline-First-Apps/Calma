import Ionicons from '@expo/vector-icons/Ionicons';
import { radius } from '@calma/tokens';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStorage } from '@/src/lib/repositories';
import { Button } from '@/src/ui/Button';
import { Text } from '@/src/ui/Text';
import { Touchable } from '@/src/ui/Touchable';

import { fetchPackages, purchase, restore } from './purchases';
import { useEntitlementStore } from './store';

/**
 * The Plus offer (i1), and the Plans screen (plan 11 T13).
 *
 * IT OPENS BY REASSURING, NOT BY TEMPTING.
 *
 * i1's caption: "the first sentence is what stays free". Everything the app
 * does when someone is in trouble -- panic, paced breathing, the sigh -- is
 * unlimited forever, and this screen says so before it says anything about
 * money. No strike-through, no "was", no timer, no "most popular", no
 * savings maths, and no free trial: the free tier is the ongoing
 * demonstration (systems/05-entitlements.md).
 *
 * "Not now" IS A FULL-WIDTH TARGET, NOT FINE PRINT.
 *
 * PRICES COME FROM THE STORE OR THEY DO NOT APPEAR.
 *
 * `product.priceString` only. Never a hardcoded number and never a
 * client-side currency conversion -- a screen that says "£4" to someone who
 * will be charged in złoty is a screen that lied to them at the moment they
 * were deciding whether to trust the app with their worst thoughts. When
 * offerings cannot be loaded, the plans list is absent and one plain sentence
 * takes its place. Nothing invents a price to fill the space.
 *
 * -------------------------------------------------------------------------
 * A DESIGN / SYSTEMS CONFLICT, RESOLVED BY THE OWNER (session 13).
 *
 * i1 draws ONE price row ("Monthly £4"). `systems/05-entitlements.md` says
 * "Lifetime is offered and is not buried", and plan 11 T13 asks for monthly,
 * annual and lifetime at equal prominence. Design wins on appearance, systems
 * wins on behaviour that spans screens -- and "which products exist" is the
 * second kind. The owner confirmed: three rows, in exactly i1's row
 * treatment, all identical, with none of the comparison furniture the caption
 * forbids. Recorded in plans/11 T13.
 * -------------------------------------------------------------------------
 */

interface Feature {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  surface: string;
}

/**
 * Tinted by the feature each one names: amber for breathing, neutral for the
 * longer view, clay for worry. The same three hues those features carry
 * everywhere else -- a neutral tile three times would be the only place in
 * Calma where a meaningful colour suddenly means nothing.
 */
const FEATURES: readonly Feature[] = [
  {
    key: 'offer.featureRhythm',
    icon: 'ellipse-outline',
    surface: 'bg-surface-tile-accent border-border-tile-accent',
  },
  {
    key: 'offer.featureHistory',
    icon: 'stats-chart-outline',
    surface: 'bg-surface-tile-neutral border-border-tile-neutral',
  },
  {
    key: 'offer.featureWindows',
    icon: 'cloud-outline',
    surface: 'bg-surface-tile-clay border-border-tile-clay',
  },
];

/** The note under each product name. No comparison, no maths, no badge. */
const NOTE: Record<string, string> = {
  calma_plus_monthly: 'plans.monthlyNote',
  calma_plus_annual: 'plans.annualNote',
  calma_plus_lifetime: 'plans.lifetimeNote',
};

const TITLE: Record<string, string> = {
  calma_plus_monthly: 'plans.monthly',
  calma_plus_annual: 'plans.annual',
  calma_plus_lifetime: 'plans.lifetime',
};

export function PlansScreen() {
  const { t } = useTranslation('entitlement');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stores } = useStorage();

  const setTier = useEntitlementStore((state) => state.setTier);

  const [packages, setPackages] = useState<PurchasesPackage[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [restored, setRestored] = useState<'none' | 'done' | null>(null);

  useEffect(() => {
    void fetchPackages().then((found) => {
      setPackages(found);
      setSelected(found[0]?.product.identifier ?? null);
    });
  }, []);

  const chosen = packages?.find((p) => p.product.identifier === selected) ?? null;

  async function buy() {
    if (chosen === null) return;

    const result = await purchase(chosen);
    // Cancellation dismisses silently. No "are you sure", no retention offer,
    // no second-chance screen -- someone who changed their mind has already
    // told the app everything it needs to know.
    if (result.kind === 'cancelled') return;

    if (result.kind === 'failed') {
      setFailed(true);
      return;
    }

    setTier(stores.cache, result.tier);
    router.back();
  }

  async function restorePurchase() {
    const tier = await restore();
    if (tier === 'plus') {
      setTier(stores.cache, tier);
      setRestored('done');
    } else {
      setRestored('none');
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 20) + 56,
        paddingHorizontal: 30,
        paddingBottom: Math.max(insets.bottom, 16) + 20,
        flexGrow: 1,
      }}
    >
      <View
        className="h-[34px] flex-row items-center gap-2.5 self-start border border-border bg-surface px-3.5"
        style={{ borderRadius: 17 }}
      >
        <View className="h-2 w-2 rounded-full bg-accent" />
        <Text variant="caption" className="text-[11px] uppercase tracking-[1.54px] text-faint">
          {t('offer.badge')}
        </Text>
      </View>

      {/* The reassurance, first and largest. */}
      <Text variant="heading" className="mt-[18px] text-[34px] leading-[41px]">
        {t('offer.headline')}
      </Text>
      <Text variant="bodySm" className="mt-3 text-[18px] leading-[28px] text-secondary">
        {t('offer.sub')}
      </Text>

      <View className="mt-6 gap-2.5">
        {FEATURES.map((feature) => (
          <View
            key={feature.key}
            className="flex-row items-center gap-3.5 border border-border-strong bg-surface-tertiary px-5 py-[18px]"
            style={{ borderRadius: radius.option }}
          >
            <View
              className={`h-[38px] w-[38px] items-center justify-center border ${feature.surface}`}
              style={{ borderRadius: 13 }}
            >
              <Ionicons name={feature.icon} size={16} color="#C07E2E" />
            </View>
            <Text variant="bodySm" className="flex-1 text-[18px] leading-[25px]">
              {t(feature.key)}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-1" />

      <View className="mt-8 gap-2.5">
        {packages === null ? null : packages.length === 0 ? (
          // No offerings, so no prices. One sentence, no error tone, and no
          // placeholder number standing in for a real one.
          <Text variant="callout">{t('offer.unavailable')}</Text>
        ) : (
          packages.map((pkg) => {
            const id = pkg.product.identifier;
            const isSelected = id === selected;

            return (
              <Touchable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${t(TITLE[id] ?? 'plans.title')} ${pkg.product.priceString}`}
                onPress={() => setSelected(id)}
                className={`flex-row items-center justify-between gap-3 border bg-surface-price px-5 py-[18px] ${
                  isSelected ? 'border-accent-wash-border' : 'border-border-price'
                }`}
                style={{ borderRadius: radius.xl }}
              >
                <View className="gap-[3px]">
                  <Text variant="bodySm" className="text-[18px] leading-[25px]">
                    {t(TITLE[id] ?? 'plans.title')}
                  </Text>
                  <Text variant="footnote" className="text-[15px] leading-[21px]">
                    {t(NOTE[id] ?? 'plans.monthlyNote')}
                  </Text>
                </View>

                {/* Serif, because it is the one number on this screen a
                    person is meant to feel rather than compare. */}
                <Text variant="headingSm" className="text-[26px] leading-[32px]">
                  {pkg.product.priceString}
                </Text>
              </Touchable>
            );
          })
        )}

        {failed ? (
          // One plain sentence. No error code, no red, no retry loop.
          <Text variant="callout">{t('plans.purchaseFailed')}</Text>
        ) : null}
        {restored !== null ? (
          <Text variant="callout">
            {t(restored === 'done' ? 'plans.restoreDone' : 'plans.restoreNone')}
          </Text>
        ) : null}

        {chosen === null ? null : (
          <Button className="h-16" label={t('offer.cta')} onPress={() => void buy()} />
        )}

        {/* Equal in weight and timing to the primary action. */}
        <Button
          variant="quiet"
          className="h-12"
          label={t('paywall.secondary')}
          onPress={() => router.back()}
        />

        {/*
          Restore. Required by both stores, and genuinely the only recovery
          path here: with no accounts, there is nothing else to look someone
          up by after a device change.
        */}
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('paywall.restore')}
          onPress={() => void restorePurchase()}
          className="h-12 items-center justify-center"
        >
          <Text variant="footnote">{t('paywall.restore')}</Text>
        </Touchable>
      </View>
    </ScrollView>
  );
}
