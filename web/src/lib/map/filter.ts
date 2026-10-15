import { CATEGORIES, type MapMarker } from "@queenstown/shared";

// The map's filter lives in the URL as ?filter=food,cafe,event (docs/02-information-architecture.md,
// "Map의 상태"). Its values are the place categories and the kinds event and notice, always kept
// in the order of the chips: the categories, then Events, then Notices.

export const FILTER_KEYS = [...CATEGORIES, "event", "notice"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

function inChipOrder(chosen: ReadonlySet<string>): FilterKey[] {
  return FILTER_KEYS.filter((key) => chosen.has(key));
}

/** Reads the URL value. Values it does not know and repeats are dropped. */
export function parseFilter(value: string | null): FilterKey[] {
  return inChipOrder(new Set((value ?? "").split(",")));
}

/** The URL value, or null when nothing is chosen and the parameter should be left out. */
export function serializeFilter(filter: readonly FilterKey[]): string | null {
  return filter.length > 0 ? filter.join(",") : null;
}

/** The filter with one chip switched on or off. */
export function toggleFilter(filter: readonly FilterKey[], key: FilterKey): FilterKey[] {
  const chosen = new Set<string>(filter);
  if (!chosen.delete(key)) {
    chosen.add(key);
  }
  return inChipOrder(chosen);
}

/** The chip that shows a marker: a place's category, or the marker's kind. */
export function filterKeyOf(marker: MapMarker): FilterKey {
  return marker.kind === "place" ? marker.category : marker.kind;
}

/** True when the filter leaves the marker off the map. An empty filter shows everything. */
export function filterHides(filter: readonly FilterKey[], marker: MapMarker): boolean {
  return filter.length > 0 && !filter.includes(filterKeyOf(marker));
}
