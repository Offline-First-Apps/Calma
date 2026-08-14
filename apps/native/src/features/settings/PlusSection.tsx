import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { restore } from '@/src/features/entitlement/purchases';
import { useEntitlementStore, useTier } from '@/src/features/entitlement/store';
import { useStorage } from '@/src/lib/repositories';
import { Text } from '@/src/ui/Text';

import { LinkRow, Section, ValueRow } from './Rows';
import { plusSectionState } from './plusSection';

/**
 * Calma Plus, in Settings — plan 14 T09, and the Settings half of plan 11 T04.
 *
 * FREE IS A STATE, NOT A DEFICIENCY.
 *
 * The row says "Free", not "Not active" and not "Upgrade". It is the honest
 * name of what somebody has, and in this app it is genuinely most of the
 * product: every relief tool is unlimited on it, forever. A settings screen
 * that phrases the free tier as an absence has started nagging, which is
 * exactly what `systems/05` says never to do.
 *
 * NO PRICES HERE, AND NOT BECAUSE THERE WAS NO ROOM.
 *
 * The prices live on i1, behind a deliberate tap. Putting a number in
 * Settings would mean somebody adjusting their haptics is shown a price they
 * did not ask to see, which is the "commercial thing appearing mid-task"
 * failure that `paywallGate.ts` exists because of.
 *
 * RESTORE IS PRESENT ON BOTH TIERS, AND HAPPENS IN PLACE.
 *
 * Both, because the person who needs it is by definition someone whose tier
 * currently reads free — a new phone, a reinstall. Hiding it behind the Plus
 * state would hide it from everyone who needs it.
 *
 * In place rather than by navigating, because it is a request with an answer,
 * not a destination. The answer is one line under the row, in the same ink as
 * everything else: there is no failure state here, since "nothing to restore
 * on this phone" is information rather than an error.
 *
 * WHEN THIS SECTION IS ABSENT. `plusSectionState` returns `'hidden'` on a
 * build where nothing can be purchased. Not a disabled row and not a greyed
 * price — absent, which is what a build with no keys is supposed to look
 * like.
 */
export function PlusSection() {
  const { t } = useTranslation(['settings', 'entitlement']);
  const router = useRouter();
  const { stores } = useStorage();

  const tier = useTier();
  const suppressed = useEntitlementStore((state) => state.suppressed);
  const setTier = useEntitlementStore((state) => state.setTier);

  const state = plusSectionState(tier, suppressed);

  const [restored, setRestored] = useState<'none' | 'done' | null>(null);

  async function restorePurchase() {
    const found = await restore();

    if (found === 'plus') {
      setTier(stores.cache, found);
      setRestored('done');
      return;
    }

    // `null` is "the SDK could not be reached" and `'free'` is "there is
    // nothing on this Apple ID or Google account". Both are the same sentence
    // to the person holding the phone, and neither is a problem they caused.
    setRestored('none');
  }

  if (state === 'hidden') return null;

  return (
    <>
      <Section title={t('settings:sections.plus')}>
        {state === 'active' ? (
          /* i2 — manage, and the deep link to the store that owns the
             subscription. The row is the whole destination, so it states the
             tier and opens it in one place. */
          <ValueRow
            label={t('settings:rows.plus')}
            value={t('settings:plusSection.active')}
            onPress={() => router.push('/paywall')}
          />
        ) : (
          <>
            <ValueRow
              label={t('settings:rows.plus')}
              value={t('settings:plusSection.free')}
            />
            <LinkRow
              label={t('settings:rows.seePlans')}
              onPress={() => router.push('/paywall')}
            />
          </>
        )}

        <LinkRow
          label={t('settings:rows.restore')}
          hint={t('settings:rows.restoreHint')}
          onPress={() => void restorePurchase()}
          last
        />
      </Section>

      {restored === null ? null : (
        <Text variant="footnote" className="mx-1 mt-3 text-label-quiet">
          {t(
            restored === 'done'
              ? 'entitlement:plans.restoreDone'
              : 'entitlement:plans.restoreNone',
          )}
        </Text>
      )}

      {/*
        The sentence plan 11 T04 asks for, and it is here rather than as a row
        hint because it is about the app rather than about the row above it.
        There are no accounts (rule 1), so a purchase is attached to an Apple
        ID or a Google account and to nothing Calma holds. Somebody arriving on
        a new phone needs to know that before they wonder where their Plus went.
      */}
      <Text variant="footnote" className="mx-1 mt-3 text-label-quiet">
        {t('settings:plusSection.deviceChange')}
      </Text>
    </>
  );
}
