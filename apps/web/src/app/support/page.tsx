import type { Metadata } from "next";

import { DocumentPage, Promise, Promises, Section } from "@/components/document";

/**
 * The support page (plan 15 T04). Required by both stores.
 *
 * ---------------------------------------------------------------------------
 * THE CRISIS RESOURCES COME FIRST, AND THEY ARE NOT AN FAQ ENTRY.
 *
 * T04 asks for crisis resources and a clear statement that Calma is not a
 * crisis service. Putting those under "how do I restore a purchase" would be
 * the wrong order for the one person on this page who cannot wait — and the
 * app makes the same call: `settings/crisis` is a screen, reachable at any
 * moment, and is never buried in a list.
 *
 * The numbers are the app's own, from `settings.crisis` in
 * `packages/i18n/src/locales/en/settings.json`, so the page somebody is sent
 * to says exactly what the app said. They are UK lines, which is what this
 * product currently ships; that limit is stated rather than papered over.
 *
 * NO CHAT WIDGET, NO TICKET FORM, NO "HOW DID WE DO?".
 *
 * A third-party support widget is a third-party script on a site that
 * promises it has none, and a satisfaction survey after a crisis line is an
 * obscene thing to render. There is an email address and it is a real one.
 * ---------------------------------------------------------------------------
 */

export const metadata: Metadata = {
  title: "Support",
  description:
    "How to reach us, answers to the questions people actually ask, and " +
    "crisis lines staffed by people who can help.",
  alternates: { canonical: "/support" },
};

export default function Support() {
  return (
    <DocumentPage
      title="Support"
      updated="14 August 2026"
      standfirst="Calma is a breathing app. It is not a crisis service and cannot respond to an emergency — if tonight is that night, the lines below are staffed by people who can."
    >
      <Promises>
        <Promise title="Samaritans · 116 123">
          Any hour, free to call from any phone in the UK and Ireland. You do
          not have to be suicidal to ring them.
        </Promise>
        <Promise title="Shout · text SHOUT to 85258">
          A free, 24/7 text line, if talking out loud is not something you can
          do right now.
        </Promise>
      </Promises>

      <p className="mt-4 text-[16px] leading-[1.7] text-ink-muted">
        Outside the UK, findahelpline.com lists equivalent services by country.
        Calma ships UK lines today; more will follow the app&rsquo;s other
        languages.
      </p>

      <p className="mt-3 text-[16px] leading-[1.7] text-ink-muted">
        If you are in immediate danger, call 999 or go to your nearest
        emergency department. Talking to your GP is worth doing too — it is
        the thing that can follow up, which an app cannot.
      </p>

      <Section index={1} title="Getting in touch">
        <p>
          Email{" "}
          <a href="mailto:hello@calma.app" className="text-accent-ink underline">
            hello@calma.app
          </a>
          . It is a real address and a person reads it, usually within a few
          days.
        </p>
        <p>
          Please do not send us anything you have written in the app. We have
          no way to read it on our side and no reason to want to — and an email
          is the one place it would stop being private.
        </p>
      </Section>

      <Section index={2} title="I paid for Plus and it is gone">
        <p>
          Open Settings &rsaquo; Calma Plus &rsaquo; Restore a purchase. Because
          Calma has no accounts, a purchase belongs to the App Store or Google
          Play account that made it, and restoring is how a new phone finds it
          again.
        </p>
        <p>
          Make sure the phone is signed in to the same store account that
          bought it. If it still does not appear, email us with the receipt
          from Apple or Google and we will sort it out.
        </p>
      </Section>

      <Section index={3} title="I changed phones and my writing is missing">
        <p>
          It will be, and we are sorry — this is the honest cost of the
          promise. Nothing you write is backed up anywhere, because there is
          nowhere for it to be backed up to. Everything lives encrypted on the
          device it was written on, and a new phone starts empty.
        </p>
        <p>
          Your Plus subscription does carry over. Your writing does not.
        </p>
      </Section>

      <Section index={4} title="Notifications">
        <p>
          Calma sends at most a handful of local reminders — a note before your
          worry window opens, and little else. They are scheduled by your own
          phone; there is no push server and no badge count.
        </p>
        <p>
          None of them can contain anything you wrote. A reminder can carry a
          number and nothing more, so a lock screen never shows a worry to
          somebody holding your phone.
        </p>
        <p>
          To turn them off, use Settings &rsaquo; Worries, or your phone&rsquo;s
          own notification settings for Calma. Turning them off changes nothing
          else about how the app works.
        </p>
      </Section>

      <Section index={5} title="Cancelling Plus">
        <p>
          Subscriptions are cancelled in the store that sold them — Settings
          &rsaquo; Apple ID &rsaquo; Subscriptions on iOS, or Play Store
          &rsaquo; Payments and subscriptions on Android. Calma cannot cancel it
          for you, and there is no retention offer waiting when you do.
        </p>
        <p>
          If you stop, everything you have written stays exactly where it is,
          and breathing keeps working. Every relief tool in Calma is free and
          always will be.
        </p>
      </Section>

      <Section index={6} title="Deleting everything">
        <p>
          Settings &rsaquo; Your writing &rsaquo; Delete everything, or simply
          delete the app. Both remove every worry, entry and session from the
          device for good. There is no account to close and nothing of yours on
          a server to request.
        </p>
      </Section>
    </DocumentPage>
  );
}
