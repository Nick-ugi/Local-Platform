import type { SitemapResponse } from "@queenstown/shared";
import { apiGet } from "./client";

/** The detail pages search engines should know about. */
export function getSitemap(): Promise<SitemapResponse> {
  return apiGet<SitemapResponse>("/sitemap");
}
