import type { Page, PlaceDetail, PlaceSummary } from "@queenstown/shared";
import type { ReactElement } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { getPlace, getPlaces } from "@/lib/api/places";
import PlacePage from "./page";

vi.mock("@/lib/api/places", () => ({ getPlace: vi.fn(), getPlaces: vi.fn() }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));

const kitchen: PlaceDetail = {
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  address: "12 Beach Street, Queenstown",
  imageUrl: null,
  latitude: -45.0322,
  longitude: 168.661,
  description: null,
  openingHours: null,
  phone: null,
  website: null,
  source: "OpenStreetMap",
  sourceUrl: "https://www.openstreetmap.org/node/1",
  updatedAt: "2026-10-02T01:30:00Z",
};

function summary(slug: string, distanceM: number): PlaceSummary {
  return { ...kitchen, slug, name: slug, category: "cafe", distanceM };
}

function page(items: PlaceSummary[]): Page<PlaceSummary> {
  return { items, page: 1, size: 12, total: items.length };
}

const props = { params: Promise.resolve({ slug: "lakeside-kitchen" }) };

beforeEach(() => {
  vi.mocked(getPlace).mockReset().mockResolvedValue(kitchen);
  vi.mocked(getPlaces).mockReset();
});

test("asks for the places nearest this one and passes on the ones to show", async () => {
  vi.mocked(getPlaces).mockResolvedValue(page([summary("lakeside-kitchen", 0), summary("harbour-coffee", 120)]));

  const element = (await PlacePage(props)) as ReactElement<{ nearby: PlaceSummary[] }>;

  expect(getPlaces).toHaveBeenCalledWith({ position: kitchen, size: 12 });
  expect(element.props.nearby.map((place) => place.slug)).toEqual(["harbour-coffee"]);
});

test("a list that fails leaves Nearby empty and the page stands", async () => {
  vi.mocked(getPlaces).mockRejectedValue(new Error("offline"));

  const element = (await PlacePage(props)) as ReactElement<{ nearby: PlaceSummary[]; place: PlaceDetail }>;

  expect(element.props.place).toBe(kitchen);
  expect(element.props.nearby).toEqual([]);
});
