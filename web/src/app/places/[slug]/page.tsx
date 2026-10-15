import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { PlaceDetailView } from "@/components/place/PlaceDetailView";
import { getPlace } from "@/lib/api/places";
import { placeMetadata } from "@/lib/seo/placeMetadata";

type Props = { params: Promise<{ slug: string }> };

// generateMetadata and the page both need the place; cache() makes that one API call per request.
const loadPlace = cache(getPlace);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await loadPlace(slug);
  if (!place) {
    return {};
  }
  const [tCategory, tNav] = await Promise.all([getTranslations("Category"), getTranslations("Nav")]);
  return placeMetadata(place, { category: tCategory(place.category), siteName: tNav("brand") });
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const place = await loadPlace(slug);
  if (!place) {
    notFound();
  }
  return <PlaceDetailView place={place} />;
}
