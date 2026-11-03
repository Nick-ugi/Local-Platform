import { httpUrl, type PlaceDetail } from "@queenstown/shared";
import type { Metadata } from "next";
import { DEFAULT_SHARE_IMAGE } from "./shareImage";
import { shorten } from "./text";

/**
 * What a place's detail page tells search engines and the apps a link is shared to (SEO-01): its
 * name, a short description, the canonical address and its picture, or the site's when it has no
 * safe one.
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
      images: [image ? { url: image, alt: place.name } : DEFAULT_SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image" },
  };
}
