import type { PlaceDetail } from "@queenstown/shared";
import type { Metadata } from "next";
import { httpUrl } from "@/lib/format";

// Search engines show about this much of a description.
const MAX_DESCRIPTION = 160;

/**
 * What a place's detail page tells search engines and the apps a link is shared to (SEO-01): its
 * name, a short description, the canonical address and, when it has a safe one, its picture.
 * Without a description it is described by its category and address.
 */
export function placeMetadata(place: PlaceDetail, labels: { category: string; siteName: string }): Metadata {
  const description = place.description
    ? shorten(place.description)
    : `${labels.category} · ${place.address}`;
  const path = `/places/${encodeURIComponent(place.slug)}`;
  const image = place.imageUrl ? httpUrl(place.imageUrl) : null;

  return {
    title: place.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: place.name,
      description,
      url: path,
      siteName: labels.siteName,
      type: "website",
      ...(image ? { images: [{ url: image, alt: place.name }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

/** The text on one line with single spaces, cut at a word with "…" when it is too long. */
function shorten(text: string): string {
  const line = text.replace(/\s+/g, " ").trim();
  if (line.length <= MAX_DESCRIPTION) {
    return line;
  }
  // Cut at the last space that leaves room for the ellipsis, so the last word is whole. A word
  // that ends right at the limit is followed by a space at the limit and is kept.
  const lastSpace = line.lastIndexOf(" ", MAX_DESCRIPTION - 1);
  const kept = lastSpace > 0 ? line.slice(0, lastSpace) : line.slice(0, MAX_DESCRIPTION - 1);
  return `${kept.trimEnd()}…`;
}
