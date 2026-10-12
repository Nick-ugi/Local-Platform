import type { Page, PlaceSummary } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { NearbyPlaces } from "@/components/place/NearbyPlaces";
import { Pagination } from "@/components/place/Pagination";
import { type ListQuery, pageCount, searchPath } from "@/lib/places/listUrl";

type Props = {
  /** The search the URL names. Its `q` is the keyword. */
  query: ListQuery;
  result: Page<PlaceSummary>;
};

/**
 * The results of a search (wireframe m-search): how many places match, the places, and the way
 * to the other pages. When nothing matches it says so and points to Explore.
 */
export function SearchResults({ query, result }: Props) {
  const t = useTranslations("Search");
  const tState = useTranslations("State");
  const q = query.q ?? "";

  if (result.total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center md:px-8">
        <p className="text-neutral-600 [overflow-wrap:anywhere]">{t("empty", { q })}</p>
        <Link href="/explore" className="rounded-lg border border-neutral-950 px-4 py-2 font-semibold">
          {tState("goToExplore")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="px-4 pt-2 text-sm text-neutral-600 md:px-8">{t("count", { count: result.total })}</p>
      <NearbyPlaces query={query} initial={result} emptyText={t("empty", { q })} />
      <Pagination path={searchPath(q)} page={query.page} pages={pageCount(result.total, result.size)} />
    </>
  );
}
