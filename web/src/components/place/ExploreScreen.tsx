import type { Page, PlaceSummary } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { explorePath, type ListQuery, pageCount } from "@/lib/places/listUrl";
import { CategoryNav } from "./CategoryNav";
import { NearbyPlaces } from "./NearbyPlaces";
import { Pagination } from "./Pagination";

type Props = {
  query: ListQuery;
  /** The page of the list the URL names. */
  result: Page<PlaceSummary>;
};

/**
 * The Explore screen (wireframes m-explore and d-explore): the categories, the places of the
 * chosen one and the way to the other pages.
 */
export function ExploreScreen({ query, result }: Props) {
  const t = useTranslations("Explore");
  const tPages = useTranslations("Pages");
  const tCategory = useTranslations("Category");
  const { category } = query;

  return (
    <div className="flex flex-1 flex-col md:py-6">
      {/* A phone shows the list straight away (m-explore); the title is still there to be read out. */}
      <h1 className="sr-only md:not-sr-only md:px-8 md:pb-2 md:text-2xl md:font-bold">
        {category === null ? tPages("explore") : tCategory(category)}
      </h1>
      <CategoryNav active={category} />
      <NearbyPlaces query={query} initial={result} emptyText={t(category === null ? "emptyAll" : "emptyCategory")} />
      <Pagination path={explorePath(category)} page={query.page} pages={pageCount(result.total, result.size)} />
    </div>
  );
}
