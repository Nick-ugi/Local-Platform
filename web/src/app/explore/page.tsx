import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ExploreList } from "@/components/place/ExploreList";
import { LoadingState } from "@/components/state/LoadingState";
import { explorePath, parsePage, withPage } from "@/lib/places/listUrl";

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

/** Explore. As its categories: a real 404 where it can be one, a loading screen on the first page. */
export default async function ExplorePage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNumber = parsePage(page);
  if (pageNumber === null) {
    notFound();
  }
  const list = <ExploreList category={null} page={page} />;
  return pageNumber === 1 ? <Suspense fallback={<LoadingState />}>{list}</Suspense> : list;
}
