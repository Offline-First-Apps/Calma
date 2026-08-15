import Link from "next/link";

import { Orb } from "./orb";

/**
 * The site header, from the W1/W2 design.
 *
 * The design draws Calma · Terms · Privacy · Get Calma. Terms now exists —
 * written in session 17 on the owner's instruction, with the company, the
 * jurisdiction and the Plus prices supplied by them — so the link is here
 * rather than waiting. Support is added to the row because both stores
 * require a reachable support page and it is the one link somebody might
 * arrive needing.
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
        </ul>
      </nav>
    </header>
  );
}

export default Header;
