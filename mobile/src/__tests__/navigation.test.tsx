import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { getPlace } from "@/api/places";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import ExploreTab from "@/app/(tabs)/explore";
import MapTab from "@/app/(tabs)/index";
import MoreTab from "@/app/(tabs)/more";
import AboutScreen from "@/app/about";
import EventRoute from "@/app/events/[slug]";
import FavoritesRoute from "@/app/favorites";
import LoginRoute from "@/app/login";
import SignupRoute from "@/app/signup";
import NoticeRoute from "@/app/notices/[slug]";
import PlaceRoute from "@/app/places/[slug]";
import SearchRoute from "@/app/search";

// The Map tab asks for the position when it opens. Here that question is never answered, so the
// map's state does not change under the navigation being tested.
jest.mock("@/geo/location", () => ({ locate: () => new Promise(() => {}) }));

// Explore and Search list one place, which is the only one there is.
jest.mock("@/api/places", () => ({
  getPlace: jest.fn(async (slug: string) =>
    slug === "harbour-coffee"
      ? {
          slug: "harbour-coffee",
          name: "Harbour Coffee",
          category: "cafe",
          subtype: null,
          address: "5 Marine Parade",
          imageUrl: null,
          latitude: -45.0335,
          longitude: 168.659,
          description: null,
          openingHours: null,
          phone: null,
          website: null,
          source: "Harbour Coffee website",
          sourceUrl: "https://harbourcoffee.example",
          updatedAt: "2026-10-01T12:30:00Z",
        }
      : null,
  ),
  getPlaces: jest.fn(async () => ({
    items: [
      {
        slug: "harbour-coffee",
        name: "Harbour Coffee",
        category: "cafe",
        subtype: null,
        address: "5 Marine Parade",
        imageUrl: null,
        latitude: -45.0335,
        longitude: 168.659,
        distanceM: null,
      },
    ],
    page: 1,
    size: 20,
    total: 1,
  })),
}));

const routes = {
  _layout: RootLayout,
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": MapTab,
  "(tabs)/explore": ExploreTab,
  "(tabs)/more": MoreTab,
  about: AboutScreen,
  search: SearchRoute,
  "places/[slug]": PlaceRoute,
  "events/[slug]": EventRoute,
  "notices/[slug]": NoticeRoute,
  login: LoginRoute,
  signup: SignupRoute,
  favorites: FavoritesRoute,
};

/** The tab bar's buttons. React Navigation labels each one like "Map, tab, 1 of 3". */
function tabs() {
  return screen.getAllByRole("button", { name: /, tab, \d of \d$/ });
}

function tab(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name}, tab,`) });
}

test("opens on the Map tab with Map, Explore and More in order", async () => {
  renderRouter(routes, { initialUrl: "/" });
  // The app looks for a stored session as it starts.
  await act(async () => {});

  expect(screen).toHavePathname("/");
  expect(tabs().map((button) => button.props.accessibilityLabel)).toEqual([
    "Map, tab, 1 of 3",
    "Explore, tab, 2 of 3",
    "More, tab, 3 of 3",
  ]);
  expect(tab("Map")).toBeSelected();
});

test("the tabs lead to Explore and More", async () => {
  renderRouter(routes, { initialUrl: "/" });

  fireEvent.press(tab("Explore"));
  expect(screen).toHavePathname("/explore");
  expect(await screen.findByText("Harbour Coffee")).toBeOnTheScreen();
  expect(screen.getByText("Nearest first")).toBeOnTheScreen();

  fireEvent.press(tab("More"));
  expect(screen).toHavePathname("/more");
  expect(within(screen.getByRole("link", { name: /About/ })).getByText("About")).toBeOnTheScreen();
});

test("More leads to About", async () => {
  renderRouter(routes, { initialUrl: "/more" });
  await act(async () => {});

  fireEvent.press(screen.getByRole("link", { name: /About/ }));

  expect(screen).toHavePathname("/about");
  expect(screen.getByText("About Queenstown Local")).toBeOnTheScreen();
  expect(screen.getByText("Where the information comes from")).toBeOnTheScreen();
});

test("the search box on the Map leads to Search, and a search names its words", async () => {
  renderRouter(routes, { initialUrl: "/" });

  fireEvent.press(screen.getByRole("search", { name: "Search places" }));
  expect(screen).toHavePathname("/search");

  fireEvent.changeText(screen.getByLabelText("Search places"), "  harbour   coffee ");
  fireEvent(screen.getByLabelText("Search places"), "submitEditing");

  expect(screen).toHavePathname("/search");
  expect(screen).toHaveSearchParams({ q: "harbour coffee" });
  expect(await screen.findByText("1 result")).toBeOnTheScreen();
});

test("Explore's search box leads to Search too", async () => {
  renderRouter(routes, { initialUrl: "/explore" });
  await screen.findByText("Harbour Coffee");

  fireEvent.press(screen.getByRole("search", { name: "Search places" }));

  expect(screen).toHavePathname("/search");
  expect(screen.getByText("Search for a place by name or keyword.")).toBeOnTheScreen();
});

test("a place in Explore opens its detail, and View on map goes back to the Map with it", async () => {
  renderRouter(routes, { initialUrl: "/explore" });

  fireEvent.press(await screen.findByRole("link", { name: /Harbour Coffee/ }));
  expect(screen).toHavePathname("/places/harbour-coffee");
  expect(await screen.findByRole("header", { name: "Harbour Coffee" })).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("link", { name: "View on map" }));
  expect(screen).toHavePathname("/");
  expect(tab("Map")).toBeSelected();
  // The Map looks the place up (its markers are not loaded here), then forgets the request.
  await waitFor(() => expect(getPlace).toHaveBeenLastCalledWith("harbour-coffee"));
  await waitFor(() => expect(screen).toHaveSearchParams({}));
});

test("a place that does not exist says so and leads to Explore", async () => {
  renderRouter(routes, { initialUrl: "/places/no-such-place" });

  expect(await screen.findByText("Page not found")).toBeOnTheScreen();
  fireEvent.press(screen.getByRole("button", { name: "Go to Explore" }));

  expect(screen).toHavePathname("/explore");
  expect(await screen.findByText("Harbour Coffee")).toBeOnTheScreen();
});
