import { Orb } from "@/components/orb";
import { StoreBadges } from "@/components/store-badges";

/**
 * The landing page (plan 15 T02).
 *
 * ---------------------------------------------------------------------------
 * NO DESIGN FILE EXISTS FOR THIS PAGE.
 *
 * `designs/html/Calma Website.html` draws W1 and W2 only — terms and privacy.
 * So this is built from those two: the same sand ground, the same
 * Newsreader-over-Figtree pairing, the same single amber, the same narrow
 * measure and hairline-separated sections. The design's own caption asks for
 * that consistency in as many words — "a legal page read at 2am should sound
 * like the app that sent you here" — and the landing page is the page that
 * sends you there.
 *
 * THE COPY IS `systems/07-copy-and-tone.md`'s App Store description, not a
 * rewrite of it. Four features, the no-accounts promise, the disclaimer.
 * Marketing copy that differs from the store listing is two products.
 * ---------------------------------------------------------------------------
 *
 * WHAT IS NOT ON THIS PAGE, AND WHY.
 *
 *   - No testimonials, no star ratings, no download counter. Social proof on
 *     an anxiety app is "other people are coping better than you".
 *   - No urgency of any kind. No countdown, no limited offer, no "join
 *     thousands". The tone rules are not suspended because this is marketing;
 *     somebody reading this at 2am is the same person the app is for.
 *   - No exclamation marks. Not one, anywhere on this site.
 *   - No screenshots yet. They are plan 16 T04 and must be taken with seeded
 *     fake data — putting a real journal entry on a marketing page is the
 *     single worst thing this product could do.
 *   - No email capture, no cookie banner, no chat widget. There is nothing to
 *     collect and so nothing to ask about.
 */

const FEATURES = [
  {
    title: "Breathe",
    body:
      "Paced breathing and the physiological sigh, with haptic guidance so " +
      "you can close your eyes and just follow the pulse.",
  },
  {
    title: "Worry later",
    body:
      "Capture anxious thoughts as they come, then work through them in a " +
      "worry window you set. Learn what is yours to hold and what is safe " +
      "to let go.",
  },
  {
    title: "Write it out",
    body:
      "Structured journalling that helps untangle a thought rather than " +
      "just record it.",
  },
  {
    title: "One tap to calm",
    body:
      "A panic button that starts a breath straight away. No questions, no " +
      "setup, no paywall, from anywhere in the app.",
  },
] as const;

export default function Home() {
  return (
    <div className="mx-auto max-w-[900px] px-6">
      {/* The room, and the thing the room is for. Same shape as c1. */}
      <section className="flex flex-col items-start gap-9 pb-16 pt-20 sm:pt-28">
        <Orb size={132} />

        <div className="max-w-[620px]">
          <h1 className="font-serif text-[42px] leading-[1.15] tracking-[-0.01em] text-ink sm:text-[54px]">
            A quieter place to put it down.
          </h1>

          <p className="mt-6 text-[19px] leading-[1.65] text-ink-secondary">
            Not another meditation app. A warm, human place to land when things
            feel like too much — the panic that hits at 2am, the worry spiral
            you cannot shake, the feeling that will not loosen its grip.
          </p>
        </div>

        <StoreBadges />
      </section>

      {/* Hairlines rather than boxes, as W1 and W2 do. */}
      <section aria-labelledby="inside" className="border-t border-rule py-14">
        <h2
          id="inside"
          className="font-serif text-[30px] leading-[1.2] text-ink"
        >
          What is inside
        </h2>

        <div className="mt-9 grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title}>
              <h3 className="text-[19px] font-medium text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 max-w-[420px] text-[17px] leading-[1.7] text-ink-muted">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/*
        The promise gets its own section and the sage card, exactly as W2 gives
        its two promises sage cards before any clause. It is the only claim on
        this page that somebody might arrive specifically to check.
      */}
      <section aria-labelledby="private" className="border-t border-rule py-14">
        <h2
          id="private"
          className="font-serif text-[30px] leading-[1.2] text-ink"
        >
          It never leaves your phone
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[26px] border border-sage-border bg-sage-surface px-7 py-6">
            <h3 className="text-[18px] font-medium text-sage-ink">
              No accounts, no servers
            </h3>
            <p className="mt-2 text-[16px] leading-[1.7] text-ink-secondary">
              There is nothing to sign up for. Everything you write is stored
              encrypted on your own device, and we have no way to read it.
            </p>
          </div>

          <div className="rounded-[26px] border border-sage-border bg-sage-surface px-7 py-6">
            <h3 className="text-[18px] font-medium text-sage-ink">
              No advertising, ever
            </h3>
            <p className="mt-2 text-[16px] leading-[1.7] text-ink-secondary">
              No analytics on what you write, no trackers, and nothing sold to
              anybody. Calma Plus is the only way it makes money.
            </p>
          </div>
        </div>

        <p className="mt-6 max-w-[620px] text-[16px] leading-[1.7] text-ink-muted">
          The honest consequence, said once: nothing is backed up. If you lose
          your phone, what you wrote is gone too. That is the trade for nobody
          else ever having it.
        </p>
      </section>

      <section aria-labelledby="free" className="border-t border-rule py-14">
        <h2 id="free" className="font-serif text-[30px] leading-[1.2] text-ink">
          Free is most of it
        </h2>
        <p className="mt-4 max-w-[620px] text-[17px] leading-[1.7] text-ink-secondary">
          Every relief tool is free and unlimited, forever — the panic button,
          paced breathing, the physiological sigh. Calma Plus adds depth and
          memory: your own rhythms, longer worry windows, and the full history
          of what you have written. There is no paywall between anybody and
          calm.
        </p>
      </section>
    </div>
  );
}
