import type { Metadata } from "next";
import { DEFAULT_SHARE_IMAGE } from "./shareImage";

/**
 * What every page starts from: the site's name in the title, full addresses for canonical links
 * and og:url (written as paths), and the site's picture for links to pages without their own.
 */
export function siteMetadata(brand: string, base: URL): Metadata {
  return {
    metadataBase: base,
    title: { default: brand, template: `%s | ${brand}` },
    openGraph: { siteName: brand, type: "website", images: [DEFAULT_SHARE_IMAGE] },
    twitter: { card: "summary_large_image" },
  };
}
