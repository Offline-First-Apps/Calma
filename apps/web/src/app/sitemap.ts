import type { MetadataRoute } from "next";

const SITE = "https://calma.app";

/**
 * Four pages, listed by hand.
 *
 * A generated sitemap would need a route manifest to walk, and with four
 * static pages that machinery costs more than it saves — and would fail
 * silently by omitting a page rather than loudly by not compiling.
 *
 * `lastModified` is the build time. These pages change when somebody edits
 * them and deploys, so the build is the honest answer.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE, lastModified, priority: 1 },
    { url: `${SITE}/terms`, lastModified, priority: 0.6 },
    { url: `${SITE}/privacy`, lastModified, priority: 0.6 },
    { url: `${SITE}/support`, lastModified, priority: 0.6 },
  ];
}
