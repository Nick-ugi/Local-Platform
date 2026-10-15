import { isCategory } from "@queenstown/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExploreScreen } from "@/components/place/ExploreScreen";
import { explorePath, parsePage, withPage } from "@/lib/places/listUrl";
import { loadPlaceList } from "@/lib/places/loadPlaceList";

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

export default async function ExploreCategoryPage({ params, searchParams }: Props) {
  const [{ category }, { page }] = await Promise.all([params, searchParams]);
  if (!isCategory(category)) {
    notFound();
  }
  const list = await loadPlaceList({ category, q: null }, page);
  if (!list) {
    notFound();
  }
  return <ExploreScreen query={list.query} result={list.result} />;
}
