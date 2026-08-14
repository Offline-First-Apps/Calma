import Link from "next/link";

import { Orb } from "./orb";

/**
 * The site header, from the W1/W2 design.
 *
 * ONE DIVERGENCE, AND IT IS THE OWNER'S RULE APPLIED TO THE WEB: the design
 * draws Calma · Terms · Privacy · Get Calma, and there is no Terms page here.
 * The design's terms copy is Lorem ipsum, and terms of service are a legal
 * document rather than a design decision — writing them is the owner's call,
 * not a session's. A header link to a page that does not exist is the same
 * mistake j1 spent a session undoing, so the link waits for the page.
 *
 * "Get Calma" is a plain link rather than a button, because there is nowhere
 * for it to go until the apps are listed (plan 16). It scrolls to the badges,
 * which say honestly that the stores are not open yet.
 */
export function Header() {
  return (
    <header className="border-b border-rule">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[900px] items-center justify-between gap-6 px-6 py-5"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 text-ink no-underline"
        >
          <Orb size={26} />
          <span className="font-serif text-[21px] leading-none">Calma</span>
        </Link>

        <ul className="flex list-none items-center gap-6 p-0 text-[15px]">
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
        </ul>
      </nav>
    </header>
  );
}

export default Header;
