import { fireEvent, renderRouter, screen, within } from "expo-router/testing-library";
import RootLayout from "@/app/_layout";
import TabsLayout from "@/app/(tabs)/_layout";
import ExploreTab from "@/app/(tabs)/explore";
import MapTab from "@/app/(tabs)/index";
import MoreTab from "@/app/(tabs)/more";
import AboutScreen from "@/app/about";

const routes = {
  _layout: RootLayout,
  "(tabs)/_layout": TabsLayout,
  "(tabs)/index": MapTab,
  "(tabs)/explore": ExploreTab,
  "(tabs)/more": MoreTab,
  about: AboutScreen,
};

/** The tab bar's buttons. React Navigation labels each one like "Map, tab, 1 of 3". */
function tabs() {
  return screen.getAllByRole("button", { name: /, tab, \d of \d$/ });
}

function tab(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name}, tab,`) });
}

test("opens on the Map tab with Map, Explore and More in order", () => {
  renderRouter(routes, { initialUrl: "/" });

  expect(screen).toHavePathname("/");
  expect(tabs().map((button) => button.props.accessibilityLabel)).toEqual([
    "Map, tab, 1 of 3",
    "Explore, tab, 2 of 3",
    "More, tab, 3 of 3",
  ]);
  expect(tab("Map")).toBeSelected();
});

test("the tabs lead to Explore and More", () => {
  renderRouter(routes, { initialUrl: "/" });

  fireEvent.press(tab("Explore"));
  expect(screen).toHavePathname("/explore");
  expect(screen.getByText(/coming soon/)).toBeOnTheScreen();

  fireEvent.press(tab("More"));
  expect(screen).toHavePathname("/more");
  expect(within(screen.getByRole("link", { name: /About/ })).getByText("About")).toBeOnTheScreen();
});

test("More leads to About", () => {
  renderRouter(routes, { initialUrl: "/more" });

  fireEvent.press(screen.getByRole("link", { name: /About/ }));

  expect(screen).toHavePathname("/about");
  expect(screen.getByText("About Queenstown Local")).toBeOnTheScreen();
  expect(screen.getByText("Where the information comes from")).toBeOnTheScreen();
});
