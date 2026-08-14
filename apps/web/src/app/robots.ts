import type { MetadataRoute } from "next";

/**
 * Everything is public and there is nothing to keep out of an index — no
 * accounts, no user pages, no search results, nothing generated. So this
 * allows all of it and points at the sitemap.
 *
 * No `Disallow` for AI crawlers either way: that is the owner's call to make
 * rather than a default to slip in, and this file is where it would go.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://calma.app/sitemap.xml",
  };
}
