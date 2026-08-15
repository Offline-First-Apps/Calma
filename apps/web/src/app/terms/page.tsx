import type { Metadata } from "next";
import Link from "next/link";

import { DocumentPage, PlainWords, Section } from "@/components/document";

/**
 * The terms of service (plan 15, W1).
 *
 * ---------------------------------------------------------------------------
 * THE DESIGN'S W1 IS LOREM IPSUM WITH THREE REAL SUMMARY LINES ON TOP.
 *
 * This is the same structure with the Lorem replaced. The standfirst, the "In
 * plain words" card and the three section titles — "What Calma is", "What
 * Calma isn't", "Paying for Plus" — are the design's, verbatim. The sections
 * after those three are additions, because a document that stops at three
 * clauses is a mockup rather than a contract: acceptable use, the licence,
 * ownership of what you write, liability, changes and law all have to exist
 * somewhere and there is nowhere else for them to be.
 *
 * WHY THE TONE RULES STILL APPLY HERE.
 *
 * `systems/07-copy-and-tone.md` is not suspended because a page is legal.
 * Someone reading terms of service at 2am is the same person the app is for.
 * So: no capitals-locked "AS IS" screaming, no defined-term apparatus, no
 * "the Company", no exclamation marks anywhere. Plain sentences that a person
 * can actually read, saying exactly what a denser version would say.
 *
 * The one place that bends is the liability and warranty section, and it is
 * marked where it bends. Those clauses have to survive a lawyer reading them
 * and the phrasing is load-bearing, so they are as plain as they can be
 * without becoming unenforceable, and no plainer.
 *
 * EVERY FACTUAL CLAIM IS CHECKABLE AGAINST THE CODE:
 *
 *   - unlimited free relief tools — `packages/domain/src/tier.ts`, where
 *     panic, paced breathing and the sigh do not appear in the limits table
 *     at all because there is nothing to count;
 *   - 3 worries a day, 2 journal entries a week on free — the same file;
 *   - no accounts, restore is the only recovery — `features/entitlement/
 *     purchases.ts`, where `logIn()` is never called;
 *   - cancelling never deletes anything — `features/settings/erase.ts` is the
 *     only code path that removes content, and only a person can call it;
 *   - a lapsed subscriber keeps what they wrote — `resolveWorryWindowMinutes`
 *     falls back rather than invalidating, and nothing anywhere deletes on
 *     downgrade.
 *
 * PRICES ARE NAMED HERE AND NOWHERE IN THE APP.
 *
 * `purchases.ts` renders `product.priceString` from the store, never a
 * hardcoded figure, so the app is always right about what it is charging in
 * the reader's own currency. This page names the US dollar list prices
 * because a terms page that will not say what something costs is doing the
 * thing this product exists not to do — and section 3 says plainly that the
 * store's figure is the one that governs.
 *
 * NOTE, AND IT NEEDS RESOLVING: `systems/05-entitlements.md` § Products lists
 * `calma_plus_monthly`, `calma_plus_annual` and `calma_plus_lifetime`. The
 * prices below are weekly, monthly and lifetime — there is no annual product
 * and there is a weekly one the systems doc has never heard of. The doc and
 * the RevenueCat offering have to be made to agree before this ships, and the
 * doc is the thing to change first (`docs(plan):`, per 00-START-HERE).
 * ---------------------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Calma is a self-help breathing app, not medical care. What you write " +
    "belongs to you, cancelling never deletes it, and every relief tool is " +
    "free and unlimited.",
  alternates: { canonical: "/terms" },
};

/** W1's summary card, and it is the design's own three lines made true. */
const PLAIN_WORDS = [
  "Calma is a tool, not a clinician, and it cannot respond to an emergency.",
  "What you write belongs to you. Cancelling never deletes it, and neither do we.",
  "Calma Plus is $4.99 a week, $9.99 a month or $199 once, and it stops the moment you ask it to.",
] as const;

export default function Terms() {
  return (
    <DocumentPage
      title="Terms of service"
      updated="15 August 2026"
      standfirst="The short version: Calma is a breathing app, it isn't medical care, and you can stop using it whenever you like. Everything below says that again, more carefully."
    >
      <PlainWords title="In plain words" items={PLAIN_WORDS} />

      <Section index={1} title="What Calma is">
        <p>
          Calma is a self-help app for iPhone and Android, published by Wyven
          Incorporated. It gives you paced breathing and the physiological
          sigh, a panic button that starts a breath from anywhere in the app, a
          place to put a worry down and come back to it, and structured
          journalling.
        </p>
        <p>
          Using it means you accept these terms. If you do not, the app is free
          to delete and nothing of yours is held anywhere for you to retrieve
          first.
        </p>
        <p>
          There is no account to create, so there is nothing to register for
          and nothing you can be locked out of. You need to be old enough to
          agree to a contract where you live, and to have a store account able
          to make a purchase if you want Calma Plus.
        </p>
        <p>
          Every relief tool is free and unlimited, permanently. The panic
          button, paced breathing and the physiological sigh have no counter,
          no cap and no paywall, and none of them can ever be moved behind one.
          That is a product rule rather than a promotion, and it is written
          into the code: they do not appear in the tier table at all, because
          there is nothing about them to count.
        </p>
      </Section>

      <Section index={2} title="What Calma isn't">
        <p>
          Calma is not therapy, not treatment, and not a substitute for
          professional care. It does not diagnose anything, it is not a medical
          device, and nothing in it has been reviewed or approved by a
          regulator. The techniques in it are ordinary ones — paced breathing,
          worry postponement, thought records — and they are offered as tools
          you might find useful rather than as care.
        </p>
        <p>
          <strong className="font-medium text-ink">
            Calma cannot respond to an emergency.
          </strong>{" "}
          Nobody reads what you write, because nobody can — there is no server
          and no person on the other end of it. If you are in crisis, please
          use a line staffed by people who can help. Our{" "}
          <Link href="/support" className="text-accent-ink underline">
            support page
          </Link>{" "}
          lists them, and so does the app, at any moment, from Settings.
        </p>
        <p>
          If you are in immediate danger, call your local emergency number or
          go to the nearest emergency department.
        </p>
        <p>
          Calma is not a backup service and does not keep a copy of anything.
          Everything you write lives encrypted on the phone you wrote it on. If
          you lose the phone, replace it, or delete the app, what you wrote is
          gone and we cannot get it back, because we never had it. This is the
          honest cost of the privacy promise and it is stated here rather than
          discovered later.
        </p>
        <p>
          Nothing here excludes anything that cannot lawfully be excluded,
          including liability for death or personal injury caused by
          negligence, or for fraud.
        </p>
      </Section>

      <Section index={3} title="Paying for Plus">
        <p>
          Every relief tool is free forever. Calma Plus adds depth and memory:
          unlimited worry captures instead of three a day, unlimited journal
          entries instead of two a week, your full writing history and search
          rather than the current week, worry windows of twenty or thirty
          minutes as well as fifteen, a custom breathing rhythm of your own,
          the longer view in Progress, and two optional gentle reminders.
        </p>
        <p>
          Plus is offered three ways: <strong className="font-medium text-ink">
            $4.99 a week</strong>, <strong className="font-medium text-ink">
            $9.99 a month</strong>, or <strong className="font-medium text-ink">
            $199 once</strong> for lifetime access. The weekly and monthly
          options renew automatically until you cancel. Lifetime is a single
          purchase, is offered plainly rather than buried, and is there because
          a subscription-only model sits badly with an app that has no servers
          to pay for.
        </p>
        <p>
          The figures above are the United States list prices. The price you
          actually pay is the one the App Store or Google Play shows you at the
          moment of purchase, in your own currency, including any tax — the app
          never converts a price itself and never displays one we typed in.
          Where the store and this page disagree, the store is right.
        </p>
        <p>
          There is no free trial. The free tier is the ongoing demonstration,
          and it does not expire.
        </p>
        <p>
          Payment is taken by Apple or Google, not by us. We never see your
          card, your billing address or your name. A subscription renews at the
          end of each period unless you turn renewal off at least twenty-four
          hours before it ends, and it is cancelled in the store that sold it:
          Settings &rsaquo; Apple ID &rsaquo; Subscriptions on iOS, or Play
          Store &rsaquo; Payments and subscriptions on Android. We cannot
          cancel it for you and there is no retention offer waiting when you
          do.
        </p>
        <p>
          Refunds are handled by the store under its own policy, because the
          store is who you paid. Apple and Google both have a request form. If
          something has clearly gone wrong, email us anyway and we will help you
          with it.
        </p>
        <p>
          Because Calma has no accounts, a purchase belongs to the App Store or
          Google Play account that made it rather than to a Calma identity.
          Restore is the only recovery path after a device change, and it is a
          visible row in Settings and on the Plans screen rather than something
          you have to ask for.
        </p>
        <p>
          If a subscription ends, nothing you have written is deleted, hidden
          or held to ransom. The free limits simply apply again from that point
          — an allowance already used is never clawed back, and a worry window
          you had set to thirty minutes quietly becomes fifteen rather than
          becoming an error.
        </p>
        <p>
          Prices can change. A change never applies to a period you have
          already paid for, and for a renewing subscription the store tells you
          before it takes effect and gives you the chance to cancel. Lifetime
          purchases are not affected by a later price change.
        </p>
      </Section>

      <Section index={4} title="What you write is yours">
        <p>
          Everything you type into Calma — worries, journal entries, the name
          you gave it, the three answers from setting it up — belongs to you.
          We claim no licence over it, no right to use it, and no right to read
          it. This is not generosity. It is a consequence of the architecture:
          it never leaves your device, so there is nothing for us to claim.
        </p>
        <p>
          Nothing you write is used to train anything. There is no model here,
          no analytics on your content, and no pipeline any of it could travel
          down.
        </p>
        <p>
          Calma itself — the app, its designs, its words and its name — belongs
          to Wyven Incorporated. You get a personal, non-transferable licence
          to use it on devices you control, for as long as these terms hold.
          Please do not copy it, resell it, take it apart, or ship something
          built out of its pieces.
        </p>
      </Section>

      <Section index={5} title="Using it reasonably">
        <p>
          There is very little to ask here, because there is very little you
          could do to anybody else — Calma has no accounts, no sharing, no
          comments and no other users to reach. Nothing you type can reach
          another person through this app.
        </p>
        <p>
          So the whole of it is: do not attempt to break, decompile or
          circumvent the app, do not try to obtain Plus without paying for it,
          and do not use it in a way that breaks the law where you are.
        </p>
      </Section>

      <Section index={6} title="Availability, and when things break">
        <p>
          Calma is offered as it is. We have built it carefully and it is
          tested, but no app is faultless and this one is not promised to be
          free of defects, uninterrupted, or suitable for any particular
          purpose. Where the law allows us to exclude implied warranties, they
          are excluded.
        </p>
        <p>
          Because everything is stored on your device, the failure modes are
          the device&rsquo;s. If the phone&rsquo;s secure storage is
          unavailable — a phone with no passcode can legitimately have no
          keystore at all — Calma still opens and still works, and says plainly
          that nothing will be saved this session rather than pretending to
          save it.
        </p>
        <p>
          We may change what is in the app, add to it, or stop publishing it.
          If we ever stop, the copy already on your phone keeps working
          offline, because it has never needed us for anything.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or
          consequential loss, for lost data, or for any decision taken on the
          basis of using the app. Where liability cannot be excluded, it is
          limited to what you have paid us in the twelve months before the
          claim — which for most people is nothing, because most of Calma is
          free.
        </p>
        <p>
          Nothing in this section takes away rights you have as a consumer
          under the law where you live.
        </p>
      </Section>

      <Section index={7} title="Privacy">
        <p>
          The{" "}
          <Link href="/privacy" className="text-accent-ink underline">
            privacy policy
          </Link>{" "}
          is part of these terms and describes what the app does and does not
          collect. The short version is that your writing stays on your phone,
          encrypted, and we cannot read it.
        </p>
      </Section>

      <Section index={8} title="Changes, ending, and the law">
        <p>
          If these terms change, the date at the top changes with it, and a
          change that materially affects you would be announced in the app
          before it took effect. Continuing to use Calma after a change means
          accepting it.
        </p>
        <p>
          You can end this at any time by deleting the app, and Settings
          &rsaquo; Your writing &rsaquo; Delete everything removes every worry,
          entry and session from the device first if you want it gone before
          the app is. Both are immediate and final. There is no account to
          close, no data of yours on a server to request, and nothing to
          unsubscribe from.
        </p>
        <p>
          We can end it too, by ceasing to publish the app — though not by
          reaching into your phone, which we have no means of doing.
        </p>
        <p>
          These terms are governed by the law of Zimbabwe, and the courts of
          Zimbabwe have jurisdiction. If you are a consumer somewhere else, this
          does not deprive you of the protection of the mandatory consumer law
          of the country you live in, and you may bring a claim there.
        </p>
        <p>
          If a clause turns out to be unenforceable, the rest still stands.
        </p>
        <p>
          Calma is published by Wyven Incorporated, Zimbabwe. Questions go to{" "}
          <a
            href="mailto:hello@calma.app"
            className="text-accent-ink underline"
          >
            hello@calma.app
          </a>
          . A reply may take a few days.
        </p>
      </Section>
    </DocumentPage>
  );
}
