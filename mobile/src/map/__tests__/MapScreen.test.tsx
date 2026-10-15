import type { MapMarker, Selection } from "@queenstown/shared";
import { act, fireEvent, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { type LocationResult, locate } from "@/geo/location";
import { renderScreen } from "@/test/render";
import { lookUp } from "../lookUp";
import { MapScreen } from "../MapScreen";
import type { MapView } from "../MapView";
import { type MarkersState, useMarkers } from "../useMarkers";

// The real map needs the native SDK. This stand-in keeps the props it was given so a test can read
// them and call the map's callbacks.
const kitchen: MapMarker = {
  kind: "place",
  slug: "lakeside-kitchen",
  latitude: -45.0322,
  longitude: 168.661,
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
};

const map: { props: ComponentProps<typeof MapView> | null } = { props: null };
jest.mock("../MapView", () => ({
  MapView: (props: ComponentProps<typeof MapView>) => {
    map.props = props;
    return null;
  },
}));

jest.mock("@/geo/location", () => ({ locate: jest.fn() }));
jest.mock("../lookUp", () => ({ lookUp: jest.fn() }));

const mockMarkers: { state: MarkersState } = {
  state: { status: "idle", markers: [], truncated: false, retry: () => {} },
};
jest.mock("../useMarkers", () => ({ useMarkers: jest.fn(() => mockMarkers.state) }));

const locateMock = jest.mocked(locate);
const lookUpMock = jest.mocked(lookUp);

const handlers = { onTargetDone: jest.fn(), onOpenDetail: jest.fn(), onSearch: jest.fn() };

function screenWith(target: Selection | null = null) {
  return <MapScreen target={target} {...handlers} />;
}

function mapProps() {
  if (!map.props) {
    throw new Error("the map was not rendered");
  }
  return map.props;
}

/** Opens the screen and lets the position asked for on arrival come back. */
async function openMap(result: LocationResult, target: Selection | null = null) {
  locateMock.mockResolvedValue(result);
  const view = renderScreen(screenWith(target));
  await act(async () => {});
  return view;
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN = "pk.test";
  map.props = null;
  locateMock.mockReset();
  lookUpMock.mockReset();
  Object.values(handlers).forEach((handler) => handler.mockReset());
  mockMarkers.state = { status: "idle", markers: [], truncated: false, retry: jest.fn() };
  jest.mocked(useMarkers).mockClear();
});

test("without a token there is a notice instead of a map", async () => {
  delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  await openMap({ status: "denied" });

  expect(screen.getByText("The map isn't available right now.")).toBeOnTheScreen();
  expect(map.props).toBeNull();
});

test("a map that cannot start gives way to the notice", async () => {
  await openMap({ status: "denied" });

  act(() => mapProps().onUnavailable());

  expect(screen.getByText("The map isn't available right now.")).toBeOnTheScreen();
});

test("asks for the position as soon as it opens, and starts on Queenstown", async () => {
  locateMock.mockReturnValue(new Promise(() => {}));
  renderScreen(screenWith());

  expect(locateMock).toHaveBeenCalledTimes(1);
  expect(mapProps().token).toBe("pk.test");
  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(screen.getByRole("button", { name: "Show my location" })).toBeDisabled();
});

test("a position in Queenstown moves the map there and shows it", async () => {
  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  expect(mapProps().camera).toEqual({ latitude: -45.0322, longitude: 168.661, zoom: 15 });
  expect(mapProps().showUserLocation).toBe(true);
  expect(screen.getByRole("button", { name: "Show my location" })).toBeEnabled();
});

test("outside the area the map stays on Queenstown and says why", async () => {
  await openMap({ status: "outside", position: { latitude: 37.5665, longitude: 126.978 } });

  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(mapProps().showUserLocation).toBe(true);
  expect(
    screen.getByText("You're outside the Queenstown area, so the map stays on Queenstown."),
  ).toBeOnTheScreen();
});

test("a refused permission explains how to turn it on", async () => {
  await openMap({ status: "denied" });

  expect(mapProps().showUserLocation).toBe(false);
  expect(screen.getByText(/Turn it on in your phone's settings/)).toBeOnTheScreen();
});

test("no fix says so", async () => {
  await openMap({ status: "unavailable" });

  expect(screen.getByText("We couldn't find your location.")).toBeOnTheScreen();
});

test("the button asks again and goes back to the position", async () => {
  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });
  const first = mapProps().camera;
  locateMock.mockResolvedValue({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  fireEvent.press(screen.getByRole("button", { name: "Show my location" }));
  await act(async () => {});

  expect(locateMock).toHaveBeenCalledTimes(2);
  // A new camera, even for the same place, so the map moves back after the visitor panned away.
  expect(mapProps().camera).toEqual(first);
  expect(mapProps().camera).not.toBe(first);
});

test("moving the map with a finger puts the message away", async () => {
  await openMap({ status: "outside", position: { latitude: 37.5665, longitude: 126.978 } });

  act(() => mapProps().onGesture());

  expect(screen.queryByText(/outside the Queenstown area/)).toBeNull();
});

test("asks for the places in the box the map reports", async () => {
  await openMap({ status: "denied" });
  expect(jest.mocked(useMarkers).mock.lastCall?.[0]).toBeNull();

  const box = { west: 168.65, south: -45.04, east: 168.67, north: -45.02 };
  act(() => mapProps().onIdle(box, { latitude: -45.03, longitude: 168.66, zoom: 14 }));

  const [bounds, filter] = jest.mocked(useMarkers).mock.lastCall ?? [];
  expect(bounds).toEqual(box);
  // No chip is on: every kind.
  expect(filter).toEqual([]);
});

test("gives the map the markers", async () => {
  mockMarkers.state = { status: "ready", markers: [kitchen], truncated: false, retry: jest.fn() };

  await openMap({ status: "denied" });

  expect(mapProps().markers).toEqual([kitchen]);
  expect(screen.queryByText("No places in this area.")).toBeNull();
});

test("a failed load says so and offers to try again", async () => {
  const retry = jest.fn();
  mockMarkers.state = { status: "error", markers: [kitchen], truncated: false, retry };

  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });
  fireEvent.press(screen.getByRole("button", { name: "Try again" }));

  expect(screen.getByText("We couldn't load the map data.")).toBeOnTheScreen();
  // The markers already on the map stay.
  expect(mapProps().markers).toEqual([kitchen]);
  expect(retry).toHaveBeenCalledTimes(1);
});

test("an empty area says so", async () => {
  mockMarkers.state = { status: "ready", markers: [], truncated: false, retry: jest.fn() };

  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  expect(screen.getByText("No places in this area.")).toBeOnTheScreen();
});

test("an area is not called empty while it is loading", async () => {
  mockMarkers.state = { status: "loading", markers: [], truncated: false, retry: jest.fn() };

  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  expect(screen.queryByText("No places in this area.")).toBeNull();
});

test("says when not every place is shown", async () => {
  mockMarkers.state = { status: "ready", markers: [kitchen], truncated: true, retry: jest.fn() };

  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  expect(screen.getByText("Zoom in to see every place.")).toBeOnTheScreen();
});

const harbourCoffee: MapMarker = {
  kind: "place",
  slug: "harbour-coffee",
  latitude: -45.0335,
  longitude: 168.659,
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
};

const nightMarket: MapMarker = {
  kind: "event",
  slug: "lakefront-night-market",
  latitude: -45.0318,
  longitude: 168.6602,
  title: "Lakefront Night Market",
  startsAt: "2026-10-09T04:00:00Z",
  endsAt: "2026-10-09T08:00:00Z",
  venueName: "Earnslaw Park",
};

const roadWorks: MapMarker = {
  kind: "notice",
  slug: "shotover-street-works",
  latitude: -45.0305,
  longitude: 168.6615,
  title: "Shotover Street resurfacing",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-05T18:00:00Z",
  endsAt: "2026-10-20T05:00:00Z",
};

function chip(name: string) {
  return screen.getByRole("button", { name });
}

test("the chips are the six categories, then Events and Notices, none on", async () => {
  await openMap({ status: "denied" });

  for (const name of ["Food", "Cafes", "Bars", "Activities", "Shopping", "Facilities", "Events", "Notices"]) {
    expect(chip(name)).not.toBeSelected();
  }
});

test("a chip narrows the markers, and pressing it again shows everything", async () => {
  await openMap({ status: "denied" });

  fireEvent.press(chip("Cafes"));
  fireEvent.press(chip("Events"));
  expect(jest.mocked(useMarkers).mock.lastCall?.[1]).toEqual(["cafe", "event"]);
  expect(chip("Cafes")).toBeSelected();

  fireEvent.press(chip("Cafes"));
  fireEvent.press(chip("Events"));
  expect(jest.mocked(useMarkers).mock.lastCall?.[1]).toEqual([]);
});

test("an empty area with chips on offers to clear them", async () => {
  mockMarkers.state = { status: "ready", markers: [], truncated: false, retry: jest.fn() };
  await openMap({ status: "denied" });
  expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();

  fireEvent.press(chip("Bars"));
  fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));

  expect(chip("Bars")).not.toBeSelected();
  expect(jest.mocked(useMarkers).mock.lastCall?.[1]).toEqual([]);
});

test("pressing a place shows its card with the distance, and the card leads to the detail", async () => {
  mockMarkers.state = { status: "ready", markers: [kitchen, harbourCoffee], truncated: false, retry: jest.fn() };
  await openMap({ status: "inside", position: { latitude: -45.0312, longitude: 168.6626 } });

  act(() => mapProps().onSelect("place:harbour-coffee"));

  expect(mapProps().selectedKey).toBe("place:harbour-coffee");
  expect(screen.getByRole("header", { name: "Harbour Coffee" })).toBeOnTheScreen();
  expect(screen.getByText("Cafes · 380 m")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("link", { name: "View details" }));
  expect(handlers.onOpenDetail).toHaveBeenCalledWith(harbourCoffee);
});

test("without a position the card has no distance", async () => {
  mockMarkers.state = { status: "ready", markers: [harbourCoffee], truncated: false, retry: jest.fn() };
  await openMap({ status: "denied" });

  act(() => mapProps().onSelect("place:harbour-coffee"));

  // The chip and the card's line.
  expect(screen.getAllByText("Cafes")).toHaveLength(2);
  expect(screen.queryByText(/^Cafes · /)).toBeNull();
});

test("an event's card shows when and where in New Zealand time", async () => {
  mockMarkers.state = { status: "ready", markers: [nightMarket], truncated: false, retry: jest.fn() };
  await openMap({ status: "denied" });

  act(() => mapProps().onSelect("event:lakefront-night-market"));

  expect(screen.getByRole("header", { name: "Lakefront Night Market" })).toBeOnTheScreen();
  expect(screen.getByText("Fri 9 Oct · 5:00 pm - 9:00 pm")).toBeOnTheScreen();
  expect(screen.getByText("Earnslaw Park")).toBeOnTheScreen();
});

test("a notice's card shows its type, Official and period", async () => {
  mockMarkers.state = { status: "ready", markers: [roadWorks], truncated: false, retry: jest.fn() };
  await openMap({ status: "denied" });

  act(() => mapProps().onSelect("notice:shotover-street-works"));

  expect(screen.getByText("Road Work")).toBeOnTheScreen();
  expect(screen.getByText("Official")).toBeOnTheScreen();
  expect(screen.getByText("6 Oct - 20 Oct 2026")).toBeOnTheScreen();
});

test("the close button and a press beside the markers close the card", async () => {
  mockMarkers.state = { status: "ready", markers: [kitchen], truncated: false, retry: jest.fn() };
  await openMap({ status: "denied" });

  act(() => mapProps().onSelect("place:lakeside-kitchen"));
  fireEvent.press(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("header", { name: "Lakeside Kitchen" })).toBeNull();
  expect(mapProps().selectedKey).toBeNull();

  act(() => mapProps().onSelect("place:lakeside-kitchen"));
  act(() => mapProps().onSelect(null));
  expect(screen.queryByRole("header", { name: "Lakeside Kitchen" })).toBeNull();
});

test("a chip that hides the selected marker closes its card; one that keeps it does not", async () => {
  mockMarkers.state = { status: "ready", markers: [kitchen, nightMarket], truncated: false, retry: jest.fn() };
  await openMap({ status: "denied" });

  act(() => mapProps().onSelect("place:lakeside-kitchen"));
  fireEvent.press(chip("Food"));
  expect(screen.getByRole("header", { name: "Lakeside Kitchen" })).toBeOnTheScreen();

  fireEvent.press(chip("Food"));
  fireEvent.press(chip("Events"));
  expect(screen.queryByRole("header", { name: "Lakeside Kitchen" })).toBeNull();
});

test("the search box opens Search", async () => {
  await openMap({ status: "denied" });

  fireEvent.press(screen.getByRole("search", { name: "Search places" }));

  expect(handlers.onSearch).toHaveBeenCalledTimes(1);
});

test("View on map selects a marker the map shows and goes to it", async () => {
  mockMarkers.state = { status: "ready", markers: [kitchen], truncated: false, retry: jest.fn() };

  await openMap({ status: "denied" }, { kind: "place", slug: "lakeside-kitchen" });

  expect(lookUpMock).not.toHaveBeenCalled();
  expect(mapProps().selectedKey).toBe("place:lakeside-kitchen");
  expect(mapProps().camera).toEqual({ latitude: -45.0322, longitude: 168.661, zoom: 16 });
  expect(handlers.onTargetDone).toHaveBeenCalledTimes(1);
});

test("View on map looks up a marker the map is not showing, and a chip that hides it gives way", async () => {
  lookUpMock.mockResolvedValue(nightMarket);
  const view = await openMap({ status: "denied" });
  fireEvent.press(chip("Food"));

  view.rerender(
    <MapScreen target={{ kind: "event", slug: "lakefront-night-market" }} {...handlers} />,
  );
  await act(async () => {});

  expect(lookUpMock).toHaveBeenCalledWith({ kind: "event", slug: "lakefront-night-market" });
  expect(screen.getByRole("header", { name: "Lakefront Night Market" })).toBeOnTheScreen();
  expect(chip("Food")).not.toBeSelected();
  expect(mapProps().camera).toEqual({ latitude: -45.0318, longitude: 168.6602, zoom: 16 });
  expect(handlers.onTargetDone).toHaveBeenCalledTimes(1);
});

test("View on map for something the map cannot show opens no card", async () => {
  lookUpMock.mockResolvedValue(null);

  await openMap({ status: "denied" }, { kind: "event", slug: "ended-festival" });

  expect(mapProps().selectedKey).toBeNull();
  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(handlers.onTargetDone).toHaveBeenCalledTimes(1);
});
