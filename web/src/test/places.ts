import type { Page, PlaceSummary } from "@queenstown/shared";

/** A place as a list shows it. Tests name only the fields they are about. */
export function placeSummary(overrides: Partial<PlaceSummary> = {}): PlaceSummary {
  return {
    slug: "lakeside-kitchen",
    name: "Lakeside Kitchen",
    category: "food",
    subtype: null,
    address: "12 Beach Street",
    imageUrl: null,
    latitude: -45.0322,
    longitude: 168.661,
    distanceM: null,
    ...overrides,
  };
}

/** A page holding the given places. The total is their number unless a test says otherwise. */
export function pageOf(items: PlaceSummary[], overrides: Partial<Page<PlaceSummary>> = {}): Page<PlaceSummary> {
  return { items, page: 1, size: 20, total: items.length, ...overrides };
}
