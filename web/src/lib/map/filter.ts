import { CATEGORIES, type Category } from "@queenstown/shared";

// The map's filter lives in the URL as ?filter=food,cafe (docs/02-information-architecture.md,
// "Map의 상태"). In code it is a list of categories, always in the order of CATEGORIES.

function inCategoryOrder(chosen: ReadonlySet<string>): Category[] {
  return CATEGORIES.filter((category) => chosen.has(category));
}

/** Reads the URL value. Values it does not know and repeats are dropped. */
export function parseFilter(value: string | null): Category[] {
  return inCategoryOrder(new Set((value ?? "").split(",")));
}

/** The URL value, or null when nothing is chosen and the parameter should be left out. */
export function serializeFilter(filter: readonly Category[]): string | null {
  return filter.length > 0 ? filter.join(",") : null;
}

/** The filter with one category switched on or off. */
export function toggleFilter(filter: readonly Category[], key: Category): Category[] {
  const chosen = new Set<string>(filter);
  if (!chosen.delete(key)) {
    chosen.add(key);
  }
  return inCategoryOrder(chosen);
}
