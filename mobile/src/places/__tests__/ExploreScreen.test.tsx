import type { Page, PlaceSummary } from "@queenstown/shared";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { getPlaces } from "@/api/places";
import { type LocationResult, locate } from "@/geo/location";
import { renderScreen } from "@/test/render";
import { ExploreScreen } from "../ExploreScreen";

jest.mock("@/api/places", () => ({ getPlaces: jest.fn() }));
jest.mock("@/geo/location", () => ({ locate: jest.fn() }));

const getPlacesMock = jest.mocked(getPlaces);

const coffee: PlaceSummary = {
  slug: "harbour-coffee",
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
  address: "5 Marine Parade",
  imageUrl: "https://example.com/coffee.jpg",
  latitude: -45.0335,
  longitude: 168.659,
  distanceM: null,
  openingHours: null,
};

function onePage(items: PlaceSummary[]): Page<PlaceSummary> {
  return { items, page: 1, size: 20, total: items.length };
}

const handlers = { onOpen: jest.fn(), onSearch: jest.fn() };

async function openExplore(location: LocationResult) {
  jest.mocked(locate).mockResolvedValue(location);
  renderScreen(<ExploreScreen {...handlers} />);
  await act(async () => {});
}

beforeEach(() => {
  getPlacesMock.mockReset();
  getPlacesMock.mockImplementation(async (query) =>
    onePage([{ ...coffee, distanceM: query.position ? 350 : null }]),
  );
  Object.values(handlers).forEach((handler) => handler.mockReset());
});

test("without a position the places run from the centre of Queenstown, without distances", async () => {
  await openExplore({ status: "denied" });

  expect(getPlacesMock.mock.lastCall?.[0]).toEqual({ category: null, q: null, position: null });
  expect(screen.getByText("Nearest first")).toBeOnTheScreen();
  expect(screen.getByText("From the centre of Queenstown")).toBeOnTheScreen();
  expect(screen.getByText(/Turn it on in your phone's settings to see distances/)).toBeOnTheScreen();
  expect(screen.getByText("Harbour Coffee")).toBeOnTheScreen();
  // The chip and the row's line, which has no distance.
  expect(screen.getAllByText("Cafes")).toHaveLength(2);
  expect(screen.getByText("5 Marine Parade")).toBeOnTheScreen();
});

test("with a position in Queenstown the places run from there, with distances", async () => {
  await openExplore({ status: "inside", position: { latitude: -45.0312, longitude: 168.6626 } });

  expect(getPlacesMock.mock.lastCall?.[0]).toEqual({
    category: null,
    q: null,
    position: { latitude: -45.0312, longitude: 168.6626 },
  });
  expect(screen.getByText("From your location")).toBeOnTheScreen();
  expect(screen.getByText("Cafes · 350 m")).toBeOnTheScreen();
});

test("outside the area says the list runs from the centre", async () => {
  await openExplore({ status: "outside", position: { latitude: 37.5665, longitude: 126.978 } });

  expect(getPlacesMock.mock.lastCall?.[0].position).toBeNull();
  expect(screen.getByText(/outside the Queenstown area/)).toBeOnTheScreen();
});

test("a category chip narrows the list; All is on at first", async () => {
  await openExplore({ status: "denied" });
  expect(screen.getByRole("button", { name: "All" })).toBeSelected();

  // Each category has a dot of its colour; All has none.
  expect(screen.getAllByTestId("kind-dot", { includeHiddenElements: true })).toHaveLength(6);

  fireEvent.press(screen.getByRole("button", { name: "Cafes" }));
  await act(async () => {});

  expect(getPlacesMock.mock.lastCall?.[0]).toMatchObject({ category: "cafe" });
  expect(screen.getByRole("button", { name: "Cafes" })).toBeSelected();
  expect(screen.getByRole("button", { name: "All" })).not.toBeSelected();
});

test("a row opens the place", async () => {
  await openExplore({ status: "denied" });

  fireEvent.press(screen.getByRole("link", { name: /Harbour Coffee/ }));

  expect(handlers.onOpen).toHaveBeenCalledWith(coffee);
});

test("an empty category says so", async () => {
  getPlacesMock.mockImplementation(async (query) => onePage(query.category === "bar" ? [] : [coffee]));
  await openExplore({ status: "denied" });

  fireEvent.press(screen.getByRole("button", { name: "Bars" }));
  await act(async () => {});

  expect(screen.getByText("No places in this category yet.")).toBeOnTheScreen();
});

test("a failed list offers to try again", async () => {
  getPlacesMock.mockRejectedValueOnce(new Error("offline"));
  await openExplore({ status: "denied" });

  expect(screen.getByText("We couldn't load the places.")).toBeOnTheScreen();
  fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  await act(async () => {});

  expect(screen.getByText("Harbour Coffee")).toBeOnTheScreen();
});

test("the search box opens Search", async () => {
  await openExplore({ status: "denied" });

  fireEvent.press(screen.getByRole("search", { name: "Search places" }));

  expect(handlers.onSearch).toHaveBeenCalledTimes(1);
});
