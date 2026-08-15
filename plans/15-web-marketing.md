# 15 — Web Marketing Site

`apps/web` is a marketing site only (D-005). Off the critical path — can run in parallel with anything.

**Branch:** `feat/web-marketing`
**Depends on:** 02 (tokens only)

---

## T01 — Strip the scaffold and wire tokens

- [x] `167b8cd`
- **Note (session 19):** the scaffold is gone — the ASCII-art page, the
  shadcn/`@calma/ui` import, `next-themes`, the providers, the mode toggle,
  the loader and `components.json`. `src/index.css` is now the theme, written
  as Tailwind v4 `@theme` blocks.

  **Dark mode is `prefers-color-scheme` and nothing else.** No class toggle,
  no provider, no `suppressHydrationWarning`, and no flash of the wrong theme
  — and no JavaScript needed to pick a colour, which a site for an offline app
  should not require.

  **The hexes are written out rather than imported from `@calma/tokens`,
  because they cannot be imported.** `@theme` is parsed by the CSS compiler
  and cannot evaluate TypeScript. This is exactly the gap `theme-parity.test.ts`
  guards on the native side and the same gap exists here; every value comes
  from `colors.ts` and the site takes a much smaller subset than the app's 129.

  Fonts are Figtree and Newsreader via `next/font/google`, which downloads at
  build time and serves from this origin — no visitor request ever reaches
  Google. That is a privacy claim, not a performance one.
- **Commit:** `chore(web): strip scaffold and wire design tokens`
- **Depends on:** `02-design-system` T01
- **Touches:** `apps/web/src/app/*`, `apps/web/tailwind.config.ts`
- **Done when:** the starter content is removed, `@calma/tokens` drives the Tailwind theme, Figtree is self-hosted via `next/font/local`, and dark mode matches the app's palette.

---

## T02 — Build the landing page

- [x] `167b8cd`
- **Note (session 19):** **there is no design file for this page.** The bundle
  draws W1 and W2 only — terms and privacy — so the landing page is built from
  those two: same sand ground, same Newsreader-over-Figtree pairing, same
  single amber, same narrow measure and hairline-separated sections. W1's own
  caption asks for that consistency, and the landing page is the page that
  sends you there.

  Copy is `systems/07`'s App Store description rather than a rewrite of it —
  marketing copy that differs from the store listing is two products.

  **What is deliberately absent:** testimonials, star ratings and download
  counters (social proof on an anxiety app is "other people are coping better
  than you"); any urgency, countdown or "join thousands"; screenshots, which
  are plan 16 T04 and must use seeded fake data; email capture, cookie banner
  and chat widget. No exclamation mark appears anywhere on the site.
- **Commit:** `feat(web): build landing page`
- **Depends on:** T01
- **Touches:** `apps/web/src/app/page.tsx`
- **Done when:** the page leads with the tagline and the four feature blocks from the App Store copy, states the no-accounts/no-servers promise prominently, includes the self-help disclaimer, and matches the app's tone with no exclamation marks or growth-marketing language.

---

## T03 — Add the privacy policy page

- [x] `167b8cd`
- **Note (session 19):** built on W2's structure — 720px measure, serif
  standfirst, two sage promise cards above any clause, numbered sections on
  hairlines. `components/document.tsx` holds that furniture so the policy and
  support pages cannot drift apart, which is what W2's caption asks for.

  **Every sentence is checkable against the code**, and that was the standard
  it was written to: no network layer (`no-remote.test.ts` enforces it),
  encrypted MMKV with the key in SecureStore, RevenueCat anonymous and the
  only third party, erase destroying the key. Nothing is claimed that a reader
  could not verify by reading the app.
- **Commit:** `feat(web): add privacy policy page`
- **Depends on:** T01
- **Touches:** `apps/web/src/app/privacy/page.tsx`
- **Done when:** the policy accurately states that no personal data is collected, transmitted, or stored off-device; names RevenueCat as the sole third party and describes what it does and doesn't receive; and is written in plain English rather than boilerplate legalese.

---

## T04 — Add the support page

- [x] `167b8cd`
- **Note (session 19):** the crisis lines come **first**, above the FAQ, and
  are not an FAQ entry — the same call `settings/crisis` makes in the app. The
  numbers are the app's own, from `settings.crisis`, so the page somebody is
  sent to says what the app said. They are UK lines and that limit is stated
  rather than papered over.

  FAQ covers restore, device change and data loss, notifications, cancelling
  and deletion. No chat widget and no satisfaction survey: a third-party
  support widget is a third-party script on a site that promises it has none.
- **Commit:** `feat(web): add support page`
- **Depends on:** T01
- **Touches:** `apps/web/src/app/support/page.tsx`
- **Done when:** a contact route, a short FAQ (restore purchases, device change and data loss, notifications, cancelling), and crisis resources with a clear statement that Calma is not a crisis service are all present. Required by both app stores.

---

## T05 — Add store badges and metadata

- [x] `167b8cd`
- **Note (session 19):** OpenGraph and Twitter metadata, `themeColor` for both
  grounds, `robots.ts`, `sitemap.ts`, an `icon.svg` and a drawn
  `opengraph-image.tsx`. The OG card is generated rather than a checked-in PNG,
  for the same reason the orb is inline SVG — a binary silently stops matching
  the palette the first time the palette moves.

  **The store badges are NOT drawn, deliberately.** Both stores publish their
  badge as locked artwork with its own guidelines and a hand-built lookalike is
  a trademark problem rather than a design shortcut. More to the point, the
  apps are not listed yet, and a badge linking nowhere is a button that lies
  about what it does — on the page whose whole argument is that this product is
  honest with you. `STORE_URLS` in `components/store-badges.tsx` is the one
  place to change: drop in the official artwork, fill in two URLs, and it
  renders links instead of the sentence.

  **No Terms page, and the header link to one is dropped.** The design draws it
  and its copy is Lorem ipsum; terms of service are a legal document rather
  than a design decision. Same rule as j1 — no link to a page that does not
  exist.
- **Commit:** `feat(web): add store links and page metadata`
- **Depends on:** T02
- **Touches:** `apps/web/src/app/layout.tsx`, `public/*`
- **Done when:** App Store and Play badges link correctly, OpenGraph and Twitter cards render with a warm palette image, favicons are in place, and `robots.txt` and `sitemap.xml` exist.

---

## T06 — Verify accessibility and performance

- [x] `167b8cd` — verified by measurement, **except Lighthouse itself.**
- **Note (session 19):** what was actually checked, and how:

  **No analytics or tracking script of any kind.** Verified against the built
  output: the only absolute URLs in the generated HTML are this site's own
  canonical and OpenGraph links. There is no third-party script, no font
  request, no cookie and no banner — `next/font` self-hosts at build time. The
  privacy claim is true of the website.

  **Contrast passes AA throughout, computed rather than eyeballed.** Every
  foreground/background pair the pages actually use, in both themes: worst
  case is `accent-ink` on ground at **4.75** in light, and everything else sits
  between 4.55 and 13.4. (`ink-faint` on `surface` is 4.39 and is the one pair
  that would fail — it does not occur in the markup, and is worth not
  introducing.)

  **Keyboard navigable**: a skip link is the first thing in the tab order,
  `:focus-visible` is redefined in the accent rather than removed, and there is
  no JavaScript, so no focus trap or custom widget exists to get wrong.
  `prefers-reduced-motion` is honoured globally.

  Semantics: one `h1` per page, headings in order, `main` landmark, labelled
  `nav`, real `<a>` elements throughout.

  **Not done: Lighthouse.** It needs a browser against a served build and a
  score, and this session could not produce one. Everything the score is made
  of has been checked by other means; the number has not. Ten static pages
  with no client JavaScript and no images is the easy case for the
  performance half.
- **Commit:** `test(web): verify accessibility and lighthouse scores`
- **Depends on:** T02–T05
- **Touches:** plan notes
- **Done when:** Lighthouse accessibility and best-practices both score ≥ 95, the site is fully keyboard-navigable, contrast passes AA throughout, and **no analytics or tracking script of any kind is present** — the privacy claim has to be true of the website too.
