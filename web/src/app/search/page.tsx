import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackLink } from "@/components/nav/BackLink";
import { SearchBox } from "@/components/search/SearchBox";
import { SearchResults } from "@/components/search/SearchResults";
import { normalizeQuery } from "@/lib/places/listUrl";
import { loadPlaceList } from "@/lib/places/loadPlaceList";

type Props = { searchParams: Promise<{ q?: string | string[]; page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations("Search");
  const q = normalizeQuery((await searchParams).q);
  // Search results are not a page for search engines (docs/02-information-architecture.md, section 3).
  return { title: q ? t("titleFor", { q }) : t("title"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const t = await getTranslations("Search");
  const { q: keyword, page } = await searchParams;
  const q = normalizeQuery(keyword);

  // Without a keyword there is nothing to ask the API for.
  const list = q ? await loadPlaceList({ category: null, q }, page) : null;
  if (q && !list) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col md:py-6">
      {/* On a phone the keyword sits beside Back (m-search); wider screens have it in the top menu. */}
      <div className="flex items-center px-4 pt-2 md:hidden">
        <BackLink fallbackHref="/explore" />
        <div className="min-w-0 flex-1">
          <SearchBox />
        </div>
      </div>
      <h1 className="sr-only [overflow-wrap:anywhere] md:not-sr-only md:px-8 md:pb-2 md:text-2xl md:font-bold">
        {q ? t("titleFor", { q }) : t("title")}
      </h1>
      {list ? (
        <SearchResults query={list.query} result={list.result} />
      ) : (
        <p className="px-4 py-10 text-center text-neutral-600 md:px-8">{t("hint")}</p>
      )}
    </div>
  );
}
