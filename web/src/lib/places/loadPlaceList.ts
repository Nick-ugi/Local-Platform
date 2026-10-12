import type { Category, Page, PlaceSummary } from "@queenstown/shared";
import { getPlaces } from "@/lib/api/places";
import { type ListQuery, parsePage } from "./listUrl";

/**
 * Reads the page of a list that a URL names, for the server to draw. The list runs from the
 * centre of Queenstown: the server does not know where the visitor is.
 *
 * Null means the URL names no page of this list — the value is not a page number, or it is past
 * the end — and the screen answers 404. An empty first page is a real page: the list is empty.
 */
export async function loadPlaceList(
  query: { category: Category | null; q: string | null },
  pageParam: string | string[] | undefined,
): Promise<{ query: ListQuery; result: Page<PlaceSummary> } | null> {
  const page = parsePage(pageParam);
  if (page === null) {
    return null;
  }
  const listQuery: ListQuery = { category: query.category, q: query.q, page };
  const result = await getPlaces(listQuery);
  if (page > 1 && result.items.length === 0) {
    return null;
  }
  return { query: listQuery, result };
}
