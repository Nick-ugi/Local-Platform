import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExploreScreen } from "@/components/place/ExploreScreen";
import { loadPlaceList } from "@/lib/places/loadPlaceList";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages");
  return { title: t("explore") };
}

export default async function ExplorePage({ searchParams }: Props) {
  const { page } = await searchParams;
  const list = await loadPlaceList({ category: null, q: null }, page);
  if (!list) {
    notFound();
  }
  return <ExploreScreen query={list.query} result={list.result} />;
}
