import { isCategory } from "@queenstown/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ExploreList } from "@/components/place/ExploreList";
import { LoadingState } from "@/components/state/LoadingState";
import { explorePath, parsePage, withPage } from "@/lib/places/listUrl";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ category }, { page }] = await Promise.all([params, searchParams]);
  if (!isCategory(category)) {
    return {};
  }
  const [tCategory, tExplore] = await Promise.all([getTranslations("Category"), getTranslations("Explore")]);
  return {
    title: tCategory(category),
    description: tExplore("categoryDescription", { category: tCategory(category) }),
    alternates: { canonical: withPage(explorePath(category), parsePage(page) ?? 1) },
  };
}

/**
 * A category of Explore. Everything that makes a 404 without the backend is checked first, while the
 * status can still be set. The first page then streams a loading screen, since a sleeping backend
 * takes up to a minute (it can never be past the end); a later page waits, so past the end is a 404.
 */
export default async function ExploreCategoryPage({ params, searchParams }: Props) {
  const [{ category }, { page }] = await Promise.all([params, searchParams]);
  const pageNumber = parsePage(page);
  if (!isCategory(category) || pageNumber === null) {
    notFound();
  }
  const list = <ExploreList category={category} page={page} />;
  return pageNumber === 1 ? <Suspense fallback={<LoadingState />}>{list}</Suspense> : list;
}
