# 15 — Web Marketing Site

`apps/web` is a marketing site only (D-005). Off the critical path — can run in parallel with anything.

**Branch:** `feat/web-marketing`
**Depends on:** 02 (tokens only)

---

## T01 — Strip the scaffold and wire tokens

- [ ]
- **Commit:** `chore(web): strip scaffold and wire design tokens`
- **Depends on:** `02-design-system` T01
- **Touches:** `apps/web/src/app/*`, `apps/web/tailwind.config.ts`
- **Done when:** the starter content is removed, `@calma/tokens` drives the Tailwind theme, Figtree is self-hosted via `next/font/local`, and dark mode matches the app's palette.

---

## T02 — Build the landing page

- [ ]
- **Commit:** `feat(web): build landing page`
- **Depends on:** T01
- **Touches:** `apps/web/src/app/page.tsx`
- **Done when:** the page leads with the tagline and the four feature blocks from the App Store copy, states the no-accounts/no-servers promise prominently, includes the self-help disclaimer, and matches the app's tone with no exclamation marks or growth-marketing language.

---

## T03 — Add the privacy policy page

- [ ]
- **Commit:** `feat(web): add privacy policy page`
- **Depends on:** T01
- **Touches:** `apps/web/src/app/privacy/page.tsx`
- **Done when:** the policy accurately states that no personal data is collected, transmitted, or stored off-device; names RevenueCat as the sole third party and describes what it does and doesn't receive; and is written in plain English rather than boilerplate legalese.

---

## T04 — Add the support page

- [ ]
- **Commit:** `feat(web): add support page`
- **Depends on:** T01
- **Touches:** `apps/web/src/app/support/page.tsx`
- **Done when:** a contact route, a short FAQ (restore purchases, device change and data loss, notifications, cancelling), and crisis resources with a clear statement that Calma is not a crisis service are all present. Required by both app stores.

---

## T05 — Add store badges and metadata

- [ ]
- **Commit:** `feat(web): add store links and page metadata`
- **Depends on:** T02
- **Touches:** `apps/web/src/app/layout.tsx`, `public/*`
- **Done when:** App Store and Play badges link correctly, OpenGraph and Twitter cards render with a warm palette image, favicons are in place, and `robots.txt` and `sitemap.xml` exist.

---

## T06 — Verify accessibility and performance

- [ ]
- **Commit:** `test(web): verify accessibility and lighthouse scores`
- **Depends on:** T02–T05
- **Touches:** plan notes
- **Done when:** Lighthouse accessibility and best-practices both score ≥ 95, the site is fully keyboard-navigable, contrast passes AA throughout, and **no analytics or tracking script of any kind is present** — the privacy claim has to be true of the website too.
