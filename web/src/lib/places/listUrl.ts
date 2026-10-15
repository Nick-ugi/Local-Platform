import type { Category } from "@queenstown/shared";

// A list of places is described by its URL: the category in the path (/explore/cafe), the search
// words in ?q= and the page in ?page= (docs/02-information-architecture.md, section 3). The
// visitor's position is never part of it.

/** Which list a screen shows. */
export interface ListQuery {
  category: Category | null;
  /** Search words, or null on a screen that does not search. */
  q: string | null;
  /** Counts from 1. */
  page: number;
}

/** How many places a page holds. It is the API's default size. */
export const PAGE_SIZE = 20;

/** Up to six digits with no leading zero: the only spelling of a page number a URL may use. */
const PAGE_PATTERN = /^[1-9]\d{0,5}$/;

/**
 * The page a ?page= value names, 1 when the parameter is absent, and null when the value is not a
 * page. Each page keeps one spelling, so "01" or " 2" lead to a 404 and not to a second address.
 */
export function parsePage(value: string | string[] | undefined): number | null {
  if (value === undefined) {
    return 1;
  }
  return typeof value === "string" && PAGE_PATTERN.test(value) ? Number(value) : null;
}

/** How many pages a list of `total` items has. An empty list still has its first page. */
export function pageCount(total: number, size: number): number {
  return Math.max(1, Math.ceil(total / size));
}

/** The Explore screen of a category, or of every category. */
export function explorePath(category: Category | null): string {
  return category === null ? "/explore" : `/explore/${category}`;
}

/** The address of a page of a list. The first page is the path itself. */
export function withPage(path: string, page: number): string {
  if (page <= 1) {
    return path;
  }
  return `${path}${path.includes("?") ? "&" : "?"}page=${page}`;
}

/** The Search screen for some search words. */
export function searchPath(q: string): string {
  return `/search?${new URLSearchParams({ q })}`;
}
