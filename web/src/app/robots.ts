import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// SITE_URL is read when the file is requested, not baked in at build time.
export const dynamic = "force-dynamic";

/**
 * robots.txt (SEO-02). Search results and the API are not pages for search engines
 * (docs/02-information-architecture.md, section 3); everything else is open.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/search", "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
