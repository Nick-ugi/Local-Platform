import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExploreScreen } from "@/components/place/ExploreScreen";
import { explorePath, parsePage, withPage } from "@/lib/places/listUrl";
import { loadPlaceList } from "@/lib/places/loadPlaceList";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ page }, tPages, tExplore] = await Promise.all([
    searchParams,
    getTranslations("Pages"),
    getTranslations("Explore"),
  ]);
  return {
    title: tPages("explore"),
    description: tExplore("description"),
    alternates: { canonical: withPage(explorePath(null), parsePage(page) ?? 1) },
  };
}

export default async function ExplorePage({ searchParams }: Props) {
  const { page } = await searchParams;
  const list = await loadPlaceList({ category: null, q: null }, page);
  if (!list) {
    notFound();
  }
  return <ExploreScreen query={list.query} result={list.result} />;
}
