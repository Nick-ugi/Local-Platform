import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NoticesScreen } from "@/components/local/LocalLists";
import { loadNotices } from "@/lib/local/loadLists";
import { noticesPath } from "@/lib/local/listUrl";
import { parsePage, withPage } from "@/lib/places/listUrl";

type Props = { searchParams: Promise<{ type?: string | string[]; page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ page }, tPages, tLocal] = await Promise.all([
    searchParams,
    getTranslations("Pages"),
    getTranslations("Local"),
  ]);
  // A type narrows the same list, so every type points search engines at the whole list.
  return {
    title: tPages("notices"),
    description: tLocal("noticesDescription"),
    alternates: { canonical: withPage(noticesPath(null), parsePage(page) ?? 1) },
  };
}

export default async function NoticesPage({ searchParams }: Props) {
  const { type, page } = await searchParams;
  const list = await loadNotices(type, page);
  if (!list) {
    notFound();
  }
  return <NoticesScreen type={list.type} result={list.result} />;
}
