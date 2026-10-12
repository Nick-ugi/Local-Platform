import { isCategory } from "@queenstown/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExploreScreen } from "@/components/place/ExploreScreen";
import { loadPlaceList } from "@/lib/places/loadPlaceList";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) {
    return {};
  }
  const t = await getTranslations("Category");
  return { title: t(category) };
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
