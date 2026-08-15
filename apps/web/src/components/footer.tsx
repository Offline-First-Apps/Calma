import Link from "next/link";

/**
 * The footer, and the sentence both app stores require to be somewhere
 * findable.
 *
 * The disclaimer is in the footer of every page rather than only on the
 * landing page, because it is true on every page and because somebody who
 * arrives directly at the privacy policy from a store listing should read it
 * too. `systems/07-copy-and-tone.md` gives the wording.
 *
 * There is no newsletter box, no social row, no cookie banner, and nothing to
 * accept. A site for an app with no servers has nothing to collect and so
 * nothing to ask about.
 */
export function Footer() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto max-w-[900px] px-6 py-10">
        <p className="max-w-[560px] text-[15px] leading-[1.7] text-ink-muted">
          Calma is a self-help tool. It isn&rsquo;t therapy and isn&rsquo;t a
          substitute for professional care. If things feel like too much, the
          lines on our{" "}
          <Link href="/support" className="text-accent-ink underline">
            support page
          </Link>{" "}
          are staffed by people who can help.
        </p>

        <ul className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-[15px]">
          <li>
            <Link href="/terms" className="text-ink-muted hover:text-ink">
              Terms
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-ink-muted hover:text-ink">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/support" className="text-ink-muted hover:text-ink">
              Support
            </Link>
          </li>
          <li>
            <a
              href="mailto:hello@calma.app"
              className="text-ink-muted hover:text-ink"
            >
              hello@calma.app
            </a>
          </li>
        </ul>

        <p className="mt-6 text-[14px] text-ink-faint">
          No analytics on this site. No cookies, no trackers, nothing to accept.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
