import { CATEGORIES, type SitemapResponse } from "@queenstown/shared";
import type { MetadataRoute } from "next";
import { explorePath } from "@/lib/places/listUrl";

/**
 * The pages marked "노출" in docs/02-information-architecture.md section 3 that need no data:
 * Map, Explore and its categories, the Local lists, About, Privacy Policy and Terms. Search, More
 * and filtered lists are left out.
 */
export const FIXED_PATHS: readonly string[] = [
  "/",
  explorePath(null),
  ...CATEGORIES.map((category) => explorePath(category)),
  "/notices",
  "/events",
  "/about",
  "/privacy",
  "/terms",
];

/**
 * sitemap.xml (SEO-02): the fixed pages, then every detail page the API lists, with the time its
 * content last changed. Without an answer from the API the fixed pages still go out.
 */
export function sitemapEntries(details: SitemapResponse | null, site: URL): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, site).toString();
  const fixed = FIXED_PATHS.map((path) => ({ url: url(path) }));
  if (!details) {
    return fixed;
  }
  const detail = (collection: string, entries: SitemapResponse["places"]) =>
    entries.map((entry) => ({
      url: url(`/${collection}/${encodeURIComponent(entry.slug)}`),
      lastModified: entry.updatedAt,
    }));
  return [
    ...fixed,
    ...detail("places", details.places),
    ...detail("events", details.events),
    ...detail("notices", details.notices),
  ];
}
