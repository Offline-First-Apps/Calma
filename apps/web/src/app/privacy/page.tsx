import type { Metadata } from "next";

import {
  DocumentPage,
  Promise,
  Promises,
  Section,
} from "@/components/document";

/**
 * The privacy policy (plan 15 T03), built on W2.
 *
 * ---------------------------------------------------------------------------
 * EVERY SENTENCE HERE IS CHECKABLE AGAINST THE CODE, AND THAT IS THE STANDARD
 * IT WAS WRITTEN TO.
 *
 * The design's W2 is Lorem ipsum with two real promises on top. This is the
 * same structure with the Lorem replaced by what the app actually does:
 *
 *   - "no network layer" — `src/lib/notifications/__tests__/no-remote.test.ts`
 *     scans the source tree and fails on a `fetch` or a push token;
 *   - "encrypted on the device" — MMKV with the key in SecureStore
 *     (`packages/db/src/adapters/mmkv/key.ts`);
 *   - "RevenueCat is the only third party" — it is the only network traffic
 *     in the product, and `logIn()` is never called, so purchases are
 *     anonymous;
 *   - "erase removes everything" — `features/settings/erase.ts` clears all
 *     three stores, re-seeds defaults and destroys the encryption key, with
 *     sixteen assertions on it.
 *
 * A policy that claims more than the code does is the one document nobody can
 * afford to be wrong about, so nothing is claimed here that a reader could
 * not verify by reading the app.
 *
 * PLAIN ENGLISH, NOT BOILERPLATE. T03 asks for it and the tone rules require
 * it. No "we may share your information with our partners and affiliates" —
 * there are none, so the sentence is "we cannot read it", which is shorter
 * and true.
 * ---------------------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Everything you write in Calma stays on your phone, encrypted. There are " +
    "no accounts and no servers, and no advertising, ever.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <DocumentPage
      title="Privacy policy"
      updated="14 August 2026"
      standfirst="Everything you write stays on your phone, encrypted, and we cannot read it. There is no advertising in Calma and there never will be."
    >
      <Promises>
        <Promise title="Stays on your phone">
          Worries, journal entries and breathing sessions are stored in an
          encrypted file on your device. The key lives in the phone&rsquo;s own
          secure storage. Nothing is uploaded, because there is nowhere to
          upload it to.
        </Promise>
        <Promise title="No advertising, ever">
          No analytics, no third-party trackers, no advertising identifiers,
          and no data sold or shared with anybody. That is true of this website
          as well as the app.
        </Promise>
      </Promises>

      <Section index={1} title="What we collect">
        <p>
          Nothing. Calma has no accounts, no sign-up, no login and no servers of
          its own. There is no analytics SDK in the app and no crash reporter
          that sends us your content.
        </p>
        <p>
          Everything the app knows about you was typed into it by you and never
          leaves the device it was typed on: your worries, your journal
          entries, your breathing sessions, the three answers you gave when you
          set it up, and your settings.
        </p>
      </Section>

      <Section index={2} title="What we never see">
        <p>
          Your writing. All of it is stored in an encrypted database on your
          phone, with the encryption key held in the operating system&rsquo;s
          own secure storage — Keychain on iOS, Keystore on Android. We do not
          have a copy of the key and cannot obtain one.
        </p>
        <p>
          Notifications are scheduled locally by your phone. Calma has no push
          service and requests no push token, and no notification it sends can
          contain anything you wrote — a reminder can carry a number, and
          nothing else. Lock-screen previews are visible to anyone holding your
          phone, so that limit is enforced in the code rather than by
          convention.
        </p>
      </Section>

      <Section index={3} title="The one third party">
        <p>
          If you buy Calma Plus, the purchase is handled by RevenueCat, which
          talks to Apple&rsquo;s or Google&rsquo;s billing service. It is the
          only network traffic the app ever makes.
        </p>
        <p>
          RevenueCat is used anonymously. We never identify you to it, so what
          it holds is a random installation identifier and whether that
          installation has an active subscription. It never receives your name,
          your email address, or a single word you have written.
        </p>
        <p>
          Because there are no accounts, a purchase belongs to your App Store or
          Google Play account rather than to Calma. On a new phone, restoring
          the purchase is how it comes back.
        </p>
      </Section>

      <Section index={4} title="Deleting everything">
        <p>
          Settings &rsaquo; Your writing &rsaquo; Delete everything removes every
          worry, entry and session from the device and destroys the encryption
          key with them. It is immediate and it is final: we keep no copy
          anywhere to restore from, which is the other side of never having had
          one.
        </p>
        <p>
          Deleting the app does the same thing. There is no account left behind
          to close and nothing of yours on any server to request.
        </p>
      </Section>

      <Section index={5} title="Children">
        <p>
          Calma is not directed at children and collects no information from
          anybody, including them.
        </p>
      </Section>

      <Section index={6} title="Changes, and how to reach us">
        <p>
          If this policy changes, the date at the top changes with it. A change
          that affected what leaves your device would be announced in the app
          before it took effect — though the plan is that there is never
          anything to announce.
        </p>
        <p>
          Questions go to{" "}
          <a href="mailto:hello@calma.app" className="text-accent-ink underline">
            hello@calma.app
          </a>
          . A reply may take a few days.
        </p>
      </Section>
    </DocumentPage>
  );
}
