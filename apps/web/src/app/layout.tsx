import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "../index.css";
import Footer from "@/components/footer";
import Header from "@/components/header";

/**
 * VENDORED, NOT FETCHED — AT BUILD TIME AS WELL AS AT RUNTIME.
 *
 * This used to be `next/font/google`, which self-hosts for visitors but still
 * reaches out to `fonts.gstatic.com` during `next build` to fetch the actual
 * files. That is invisible on a machine with ordinary internet access, and a
 * hard build failure on one without it — exactly what happened on a
 * deployment host with restricted or slow outbound access: `next build`
 * failed with a font module-not-found rather than a network error, because
 * that is how Turbopack reports it.
 *
 * The two `.woff2` files in `../fonts/` are the same latin-subset files
 * `next/font/google` would have downloaded for this exact configuration —
 * fetched once from `fonts.gstatic.com` and checked into the repo — so the
 * build has no external dependency left to fail on. This is also a stricter
 * reading of the original privacy claim: no request ever reaches Google, not
 * even from the build.
 *
 * Both are variable fonts, hence the range syntax in `weight` rather than a
 * single number — one file each covers the whole span, matching what Google's
 * own CSS API serves for a range query.
 *
 * The two families are the app's (D-017). Newsreader for sentences meant to
 * be felt, Figtree for everything meant to be read.
 */
const figtree = localFont({
  src: "../fonts/Figtree-Variable.woff2",
  weight: "300 800",
  variable: "--font-figtree",
  display: "swap",
});

const newsreader = localFont({
  src: "../fonts/Newsreader-Variable.woff2",
  weight: "400 500",
  variable: "--font-newsreader",
  display: "swap",
});

const SITE = "https://calma.app";

const DESCRIPTION =
  "A warm place to land when things feel like too much. Paced breathing, " +
  "a panic button, somewhere to put a worry down. No accounts, no servers, " +
  "nothing leaves your phone.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Calma — a quieter place to put it down",
    template: "%s · Calma",
  },
  description: DESCRIPTION,
  applicationName: "Calma",
  openGraph: {
    title: "Calma",
    description: DESCRIPTION,
    url: SITE,
    siteName: "Calma",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calma",
    description: DESCRIPTION,
  },
  alternates: { canonical: "/" },
};

/**
 * `themeColor` follows the two grounds, so the browser chrome on a phone is
 * the same sand or navy the page is — a white notch above a warm page is the
 * first thing that makes a site feel like a document rather than a place.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F1" },
    { media: "(prefers-color-scheme: dark)", color: "#141C26" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${figtree.variable} ${newsreader.variable}`}>
        {/*
          The first thing in the tab order, visible only once focused. A
          header with two links is short, but a skip link costs nothing and
          its absence is one of the things an accessibility audit always
          finds.
        */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-full focus:bg-surface-raised focus:px-5 focus:py-3 focus:text-ink"
        >
          Skip to content
        </a>

        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
