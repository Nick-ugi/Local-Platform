import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { PlaceDetailView } from "@/components/place/PlaceDetailView";
import { getPlace } from "@/lib/api/places";
import { contactEmail, mailtoHref } from "@/lib/contact";
import { placeMetadata } from "@/lib/seo/placeMetadata";
import { siteUrl } from "@/lib/site";

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
  const t = await getTranslations("Place");
  const url = new URL(`/places/${encodeURIComponent(place.slug)}`, siteUrl()).toString();
  const suggestEditHref = mailtoHref(
    contactEmail(),
    t("suggestEditSubject", { name: place.name }),
    t("suggestEditBody", { url }),
  );
  return <PlaceDetailView place={place} suggestEditHref={suggestEditHref} />;
}
