import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PlaceDetailView } from "@/components/place/PlaceDetailView";
import { getPlace } from "@/lib/api/places";

type Props = { params: Promise<{ slug: string }> };

// generateMetadata and the page both need the place; cache() makes that one API call per request.
const loadPlace = cache(getPlace);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const place = await loadPlace(slug);
  if (!place) {
    return {};
  }
  return { title: place.name, description: place.description ?? place.address };
}

export default async function PlacePage({ params }: Props) {
  const { slug } = await params;
  const place = await loadPlace(slug);
  if (!place) {
    notFound();
  }
  return <PlaceDetailView place={place} />;
}
