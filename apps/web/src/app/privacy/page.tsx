import type { Metadata } from "next";
import Link from "next/link";

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
 *   - "encrypted on the device" — three MMKV instances, two of them encrypted,
 *     key in SecureStore under `WHEN_UNLOCKED_THIS_DEVICE_ONLY`
 *     (`packages/db/src/adapters/mmkv/key.ts` and `storage.ts`);
 *   - "RevenueCat is used anonymously" — `features/entitlement/purchases.ts`
 *     calls `Purchases.configure({ apiKey })` with no `appUserID` and never
 *     calls `logIn()`;
 *   - "erase removes everything" — `features/settings/erase.ts` cancels
 *     notifications, clears all three stores, destroys the encryption key and
 *     re-seeds defaults, in that order and for stated reasons.
 *
 * A policy that claims more than the code does is the one document nobody can
 * afford to be wrong about, so nothing is claimed here that a reader could
 * not verify by reading the app.
 *
 * ---------------------------------------------------------------------------
 * SECTION 4 IS THE UNCOMFORTABLE ONE, AND IT IS HERE ON PURPOSE.
 *
 * `apps/native/package.json` depends on `expo-insights`, and `app.json` sets
 * `updates.url` to `https://u.expo.dev/...` with a runtime version policy.
 * Neither is imported anywhere in `apps/native/src` — but neither needs to be.
 * `expo-insights` is autolinked by being installed and reports installs and
 * sessions to Expo's servers; `expo-updates` with a URL configured makes a
 * release build check that URL at launch. Both are real network calls that
 * `systems/01-architecture.md`'s "the only network traffic in the whole app is
 * RevenueCat" does not account for.
 *
 * The owner's decision (session 17) was to disclose them rather than quietly
 * drop them, so section 4 says what they are and what Expo can see. If either
 * is later removed from the build, this section shrinks or goes — and the
 * removal is a one-line change in each file, because nothing reads them.
 *
 * The honest framing matters more than the size of the disclosure: an app
 * that promises nothing leaves your device and then contacts a vendor at
 * launch has a policy problem only if the policy pretends otherwise.
 * ---------------------------------------------------------------------------
 *
 * PLAIN ENGLISH, NOT BOILERPLATE. T03 asks for it and the tone rules require
 * it. No "we may share your information with our partners and affiliates" —
 * there are none, so the sentence is "we cannot read it", which is shorter
 * and true.
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
      updated="15 August 2026"
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
          No advertising identifiers, no third-party trackers, no analytics on
          what you write, and no data sold or shared with anybody. That is true
          of this website as well as the app.
        </Promise>
      </Promises>

      <Section index={1} title="What we collect">
        <p>
          Nothing. Calma has no accounts, no sign-up, no login and no servers of
          its own. There is no analytics SDK reading your content and no crash
          reporter sending it anywhere.
        </p>
        <p>
          Everything the app knows about you was typed into it by you and stays
          on the device it was typed on. In full, that is:
        </p>
        <p>
          <strong className="font-medium text-ink">Your worries.</strong> The
          text of each one, when you captured it, whether it is still pending,
          worked through or let go, and any small action you decided on.
        </p>
        <p>
          <strong className="font-medium text-ink">Your journal entries.</strong>{" "}
          The situation, the thought, the feeling and how strong it was, the
          evidence for and against, the balanced thought you landed on, and how
          strong the feeling was afterwards. Drafts are saved continuously as
          you type, so an entry exists on disk before its first full sentence
          does.
        </p>
        <p>
          <strong className="font-medium text-ink">
            Your breathing sessions.
          </strong>{" "}
          Which rhythm, how long, how many cycles, where in the app you started
          from, how you rated things beforehand if you chose to, and whether
          you felt better, the same or worse afterwards. Skipping the rating is
          recorded as having skipped it rather than as a zero.
        </p>
        <p>
          <strong className="font-medium text-ink">Your settings.</strong> The
          name you gave, the three answers you gave when you set it up, your
          language, your worry window time and length, your usual breathing
          rhythm and any custom one, your theme, whether sound and haptics are
          on, whether you have been asked about notifications, and whether the
          lock is on.
        </p>
        <p>
          None of it is sent anywhere, and there is no version of Calma in
          which any of it could be — the app contains no code that uploads
          content, and a test scans the whole source tree on every run and
          fails if one appears.
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
          The key is generated on your phone the first time you open the app,
          from the operating system&rsquo;s own randomness, and is marked as
          belonging to that device alone. It is deliberately not synced to
          iCloud and not restored onto a new phone. That is why a new device
          starts empty, and it is the trade for nobody else ever holding it.
        </p>
        <p>
          Two small things are stored unencrypted, and neither is anything you
          wrote: whether you have finished setting the app up, which version
          you last opened, and whether this installation has an active
          subscription. Nothing sensitive touches that file, by rule.
        </p>
        <p>
          If your phone has no secure storage available — a phone with no
          passcode set can legitimately have none — Calma opens anyway, works
          normally, and tells you plainly that nothing will be saved this
          session. It keeps everything in memory for that session and writes
          none of it to disk. We would rather say so than quietly pretend to
          save someone&rsquo;s writing.
        </p>
        <p>
          You can put Face ID, Touch ID or your device passcode in front of
          your journal from Settings. It is off unless you turn it on, it
          covers the writing rather than the whole app so breathing is never
          behind it, and the fact that you have unlocked is held in memory for
          that launch only — never written down.
        </p>
      </Section>

      <Section index={3} title="Notifications">
        <p>
          Calma can send four notifications and no others: a note before your
          worry window opens, a note when it does, an occasional gentle nudge
          about a journalling streak, and a weekly check-in. The last two are
          Plus. There are no re-engagement messages, no &ldquo;we miss
          you&rdquo;, no streak-loss alerts and no promotional notifications,
          and there is no badge count on the app icon.
        </p>
        <p>
          They are scheduled locally by your own phone. Calma has no push
          service and requests no push token, and it never will — a push token
          is a device identifier, and a test asserts across the whole source
          tree that none is ever requested.
        </p>
        <p>
          No notification can contain anything you wrote. A body can
          interpolate a number — worries waiting, days in a streak — and
          nothing else. There is no template anywhere that accepts a piece of
          text, which is the mechanism by which a worry cannot reach a lock
          screen where anyone holding your phone would see it.
        </p>
        <p>
          Nothing is sent between 22:00 and 07:00, without exception and
          regardless of your settings. Permission is asked for once, only after
          you have said yes on a screen inside the app, and declining that
          screen never reaches the operating system at all.
        </p>
      </Section>

      <Section index={4} title="Who the app talks to">
        <p>
          Three parties, all of them at arm&rsquo;s length, and none of them
          ever receiving a word you have written.
        </p>
        <p>
          <strong className="font-medium text-ink">
            RevenueCat, if you buy Calma Plus.
          </strong>{" "}
          The purchase is handled by RevenueCat, which talks to Apple&rsquo;s or
          Google&rsquo;s billing service. It is used anonymously: we never
          identify you to it and never create an identifier for you, so what it
          holds is a random installation identifier and whether that
          installation has an active subscription. It never receives your name,
          your email address, or anything you have written. Because there are
          no accounts, a purchase belongs to your App Store or Google Play
          account rather than to Calma, and restoring the purchase is how it
          comes back on a new phone.
        </p>
        <p>
          <strong className="font-medium text-ink">
            Expo, for app updates.
          </strong>{" "}
          Calma is built with Expo, and a released build checks Expo&rsquo;s
          update service when it launches to see whether a newer version of the
          app&rsquo;s code has been published. Expo sees what any server sees
          when a device contacts it: an IP address, and a description of the
          build asking — platform, app version and runtime version. It receives
          nothing from inside the app, and the check is for our code rather
          than your data. If it fails, or you are offline, the app opens
          normally with the version already on your phone.
        </p>
        <p>
          <strong className="font-medium text-ink">
            Expo, for install and session counts.
          </strong>{" "}
          The same build includes Expo&rsquo;s insights component, which reports
          that an install exists and that the app was opened, along with the
          platform and app version. It counts launches. It does not know what
          you did in the app, cannot see a worry, an entry, a breathing session
          or a setting, and carries no advertising identifier. It is the one
          piece of telemetry in the product, it is disclosed here rather than
          folded into a sentence about &ldquo;service providers&rdquo;, and if
          it is removed from a later build this paragraph goes with it.
        </p>
        <p>
          That is the complete list. There is no analytics on your content, no
          attribution SDK, no advertising network, no crash reporter that
          uploads your writing, and no social login.
        </p>
      </Section>

      <Section index={5} title="This website">
        <p>
          No analytics, no cookies, no trackers, and nothing to accept. There is
          no consent banner on this site because there is nothing to consent
          to.
        </p>
        <p>
          The two typefaces are downloaded when the site is built and served
          from this domain, so no request ever reaches Google from your
          browser. That is a privacy decision rather than a performance one: a
          page that promises nothing leaves your device should not phone a
          third party to render its own heading.
        </p>
        <p>
          Our host keeps ordinary server logs, as every web server does, and we
          do not use them to build a picture of anybody. If you email us, we
          have your email — that is unavoidable and it is the only way we could
          ever come to hold anything about you.
        </p>
      </Section>

      <Section index={6} title="Deleting everything">
        <p>
          Settings &rsaquo; Your writing &rsaquo; Delete everything removes every
          worry, entry and session from the device, cancels anything scheduled,
          and destroys the encryption key with them. It is immediate and it is
          final: we keep no copy anywhere to restore from, which is the other
          side of never having had one.
        </p>
        <p>
          Deleting the app does the same thing. There is no account left behind
          to close and nothing of yours on any server to request.
        </p>
        <p>
          Because nothing about you leaves your phone, the usual data rights —
          access, correction, portability, erasure, objection — resolve on the
          device itself: everything we could possibly hand you is already in
          your hands, and deleting it is a button rather than a request. If you
          would rather ask us anyway, please do; the answer will be this
          paragraph, and we will say so honestly.
        </p>
      </Section>

      <Section index={7} title="Children">
        <p>
          Calma is not directed at children and collects no information from
          anybody, including them.
        </p>
      </Section>

      <Section index={8} title="Changes, and how to reach us">
        <p>
          If this policy changes, the date at the top changes with it. A change
          that affected what leaves your device would be announced in the app
          before it took effect — though the plan is that there is never
          anything to announce.
        </p>
        <p>
          Calma is published by Wyven Incorporated, Zimbabwe, which is the data
          controller for the very little described above. The{" "}
          <Link href="/terms" className="text-accent-ink underline">
            terms of service
          </Link>{" "}
          sit alongside this policy.
        </p>
        <p>
          Questions go to{" "}
          <a
            href="mailto:hello@calma.app"
            className="text-accent-ink underline"
          >
            hello@calma.app
          </a>
          . A reply may take a few days. Please do not send us anything you
          have written in the app — an email is the one place it would stop
          being private.
        </p>
      </Section>
    </DocumentPage>
  );
}
