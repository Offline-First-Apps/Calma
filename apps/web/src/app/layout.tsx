import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";

import "../index.css";
import Footer from "@/components/footer";
import Header from "@/components/header";

/**
 * SELF-HOSTED, NOT FETCHED.
 *
 * `next/font/google` downloads the files at build time and serves them from
 * this origin — no request ever reaches Google from a visitor's browser. That
 * is a privacy claim rather than a performance one, and it has to be true of
 * the website as well as the app (plan 15 T06): a page that promises nothing
 * leaves your device should not phone a third party to render its own
 * heading.
 *
 * The two families are the app's (D-017). Newsreader for sentences meant to
 * be felt, Figtree for everything meant to be read.
 */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
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
