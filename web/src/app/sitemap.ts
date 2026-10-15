import type { MetadataRoute } from "next";
import { getSitemap } from "@/lib/api/sitemap";
import { sitemapEntries } from "@/lib/seo/sitemapEntries";
import { siteUrl } from "@/lib/site";

// Made on every request: the detail pages change with the data, and a build must not need the API.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let details = null;
  try {
    details = await getSitemap();
  } catch {
    // Search engines still get the fixed pages, and the details on their next visit.
  }
  return sitemapEntries(details, siteUrl());
}
