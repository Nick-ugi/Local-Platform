import type { Page, PlaceDetail, PlaceSummary } from "@queenstown/shared";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { getPlaces } from "@/api/places";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { NearbyPlaces } from "../NearbyPlaces";

jest.mock("@/api/places", () => ({ getPlaces: jest.fn() }));

const getPlacesMock = jest.mocked(getPlaces);

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

function summary(slug: string, name: string, category: PlaceSummary["category"], distanceM: number): PlaceSummary {
  return { ...kitchen, slug, name, category, distanceM };
}

function page(items: PlaceSummary[]): Page<PlaceSummary> {
  return { items, page: 1, size: 12, total: items.length };
}

async function show(onOpen = jest.fn()) {
  const view = render(<NearbyPlaces place={kitchen} onOpen={onOpen} />, {
    wrapper: AppIntlProvider,
  });
  await act(async () => {});
  return view;
}

beforeEach(() => {
  getPlacesMock.mockReset();
});

test("lists the places nearest this one with their kind and distance, and opens one", async () => {
  getPlacesMock.mockResolvedValue(
    page([
      summary("lakeside-kitchen", "Lakeside Kitchen", "food", 0),
      summary("harbour-coffee", "Harbour Coffee", "cafe", 120),
      summary("pub-on-wharf", "Pub on Wharf", "bar", 450),
    ]),
  );
  const onOpen = jest.fn();
  await show(onOpen);

  expect(getPlacesMock.mock.lastCall?.[0]).toEqual({
    position: { latitude: -45.0322, longitude: 168.661 },
    size: 12,
  });
  expect(screen.getByRole("header", { name: "Nearby" })).toBeOnTheScreen();
  expect(screen.getByText("Cafes · 120 m")).toBeOnTheScreen();
  expect(screen.getByText("Bars · 450 m")).toBeOnTheScreen();
  expect(screen.queryByText("Lakeside Kitchen")).toBeNull();

  fireEvent.press(screen.getByRole("link", { name: /Harbour Coffee/ }));
  expect(onOpen).toHaveBeenCalledWith("harbour-coffee");
});

test("shows nothing when there is nothing near, or the list fails", async () => {
  getPlacesMock.mockResolvedValue(page([summary("lakeside-kitchen", "Lakeside Kitchen", "food", 0)]));
  const empty = await show();
  expect(empty.toJSON()).toBeNull();
  empty.unmount();

  getPlacesMock.mockRejectedValue(new Error("offline"));
  const failed = await show();
  expect(failed.toJSON()).toBeNull();
});
