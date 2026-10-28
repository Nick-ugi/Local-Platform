import { boundsOf, type EventDetail, type MapMarker, type NoticeDetail, type PlaceDetail, type PlaceMarker } from "@queenstown/shared";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getEvent } from "@/lib/api/events";
import { getNotice } from "@/lib/api/notices";
import { getPlace } from "@/lib/api/places";
import { type LocationResult, locate, wasLocationGranted } from "@/lib/geo/location";
import type { MarkersState } from "@/lib/map/useMarkers";
import { useMarkers } from "@/lib/map/useMarkers";
import { type SearchMarkersState, useSearchMarkers } from "@/lib/map/useSearchMarkers";
import { renderWithMessages } from "@/test/render";
import { MapScreen } from "./MapScreen";
import type { MapView } from "./MapView";

// The real map needs WebGL. This stand-in keeps the props it was given so a test can read them
// and call the map's callbacks.
const map = vi.hoisted(() => ({ props: null as ComponentProps<typeof MapView> | null }));
vi.mock("./MapView", () => ({
  MapView: (props: ComponentProps<typeof MapView>) => {
    map.props = props;
    return <div data-testid="map-view" />;
  },
}));

const markersState = vi.hoisted(() => ({ current: null as MarkersState | null }));
vi.mock("@/lib/map/useMarkers", () => ({ useMarkers: vi.fn(() => markersState.current) }));

const searchState = vi.hoisted(() => ({ current: null as SearchMarkersState | null }));
vi.mock("@/lib/map/useSearchMarkers", () => ({
  SEARCH_MARKERS: 50,
  useSearchMarkers: vi.fn(() => searchState.current),
}));

vi.mock("@/lib/geo/location", () => ({ locate: vi.fn(), wasLocationGranted: vi.fn() }));

vi.mock("@/lib/api/places", () => ({ getPlace: vi.fn() }));
vi.mock("@/lib/api/events", () => ({ getEvent: vi.fn() }));
vi.mock("@/lib/api/notices", () => ({ getNotice: vi.fn() }));

// Next.js keeps useSearchParams in step with history.replaceState. This does the same on top of
// jsdom's real address bar, so the tests can read the URL a visitor would see.
vi.mock("next/navigation", async () => {
  const { useSyncExternalStore } = await import("react");
  const listeners = new Set<() => void>();
  const replaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = (...args) => {
    replaceState(...args);
    listeners.forEach((listener) => listener());
  };
  return {
    useSearchParams: () => {
      const search = useSyncExternalStore(
        (listener) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
        () => window.location.search,
      );
      return new URLSearchParams(search);
    },
  };
});

const kitchen: MapMarker = {
  kind: "place",
  slug: "lakeside-kitchen",
  latitude: -45.0322,
  longitude: 168.661,
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  openingHours: null,
};

const queenstownBox = { west: 168.65, south: -45.04, east: 168.67, north: -45.02 };

function searchIs(state: Partial<SearchMarkersState>) {
  searchState.current = { status: "ready", markers: [], total: 0, retry: vi.fn(), ...state };
  return searchState.current;
}

function markersAre(state: Partial<MarkersState>) {
  markersState.current = { status: "ready", markers: [kitchen], truncated: false, retry: vi.fn(), ...state };
  return markersState.current;
}

function openMap(url = "/") {
  window.history.replaceState(null, "", url);
  return renderWithMessages(<MapScreen />);
}

function mapProps() {
  if (!map.props) {
    throw new Error("the map was not rendered");
  }
  return map.props;
}

function pressedChips() {
  return screen
    .getAllByRole("button", { pressed: true })
    .map((chip) => chip.textContent);
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "pk.test");
  window.sessionStorage.clear();
  map.props = null;
  markersAre({});
  vi.mocked(useMarkers).mockClear();
  searchIs({ status: "idle" });
  vi.mocked(useSearchMarkers).mockClear();
  // A first visit: the browser has not been asked for the position yet.
  vi.mocked(wasLocationGranted).mockReset().mockResolvedValue(false);
  vi.mocked(locate).mockReset().mockResolvedValue({ status: "unavailable" });
  // A lookup that no test answers stays open, so it cannot change a screen behind a test's back.
  vi.mocked(getPlace)
    .mockReset()
    .mockReturnValue(new Promise(() => {}));
  vi.mocked(getEvent)
    .mockReset()
    .mockReturnValue(new Promise(() => {}));
  vi.mocked(getNotice)
    .mockReset()
    .mockReturnValue(new Promise(() => {}));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("shows a notice instead of the map without a token", () => {
  vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");

  openMap();

  expect(screen.getByText("The map isn't available right now.")).toBeInTheDocument();
  expect(screen.queryByTestId("map-view")).not.toBeInTheDocument();
});

test("shows the notice when the map reports that it cannot start", () => {
  openMap();
  expect(screen.getByTestId("map-view")).toBeInTheDocument();

  act(() => mapProps().onUnavailable());

  expect(screen.getByText("The map isn't available right now.")).toBeInTheDocument();
  expect(screen.queryByTestId("map-view")).not.toBeInTheDocument();
});

test("gives the map the token and starts on Queenstown", () => {
  openMap();

  expect(mapProps().token).toBe("pk.test");
  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(mapProps().markers).toEqual([kitchen]);
});

test("asks for the markers of the box the map reports and remembers the position", () => {
  openMap();
  expect(vi.mocked(useMarkers).mock.lastCall?.[0]).toBeNull();

  const frankton = { latitude: -45.0195, longitude: 168.732, zoom: 12.5 };
  act(() => mapProps().onMove(queenstownBox, frankton));

  expect(vi.mocked(useMarkers).mock.lastCall?.[0]).toEqual(queenstownBox);
  expect(JSON.parse(window.sessionStorage.getItem("map.camera") ?? "null")).toEqual(frankton);
});

test("starts the map where it was left", () => {
  const frankton = { latitude: -45.0195, longitude: 168.732, zoom: 12.5 };
  window.sessionStorage.setItem("map.camera", JSON.stringify(frankton));

  openMap();

  expect(mapProps().camera).toEqual(frankton);
});

test("reads the filter from the URL", () => {
  openMap("/?filter=food,cafe");

  expect(pressedChips()).toEqual(["Food", "Cafes"]);
  expect(vi.mocked(useMarkers).mock.lastCall?.[1]).toEqual(["food", "cafe"]);
});

test("pressing a chip rewrites the URL without adding history", async () => {
  openMap("/?filter=food,cafe");
  const entries = window.history.length;

  await userEvent.click(screen.getByRole("button", { name: "Bars" }));

  expect(window.location.pathname + window.location.search).toBe("/?filter=food,cafe,bar");
  expect(window.history.length).toBe(entries);
  expect(pressedChips()).toEqual(["Food", "Cafes", "Bars"]);
});

test("releasing the last chip takes the filter out of the URL", async () => {
  openMap("/?filter=bar");

  await userEvent.click(screen.getByRole("button", { name: "Bars" }));

  expect(window.location.pathname + window.location.search).toBe("/");
});

test("leaves other parameters of the URL alone", async () => {
  openMap("/?ref=newsletter&filter=food");

  await userEvent.click(screen.getByRole("button", { name: "Cafes" }));

  expect(window.location.search).toBe("?ref=newsletter&filter=food,cafe");
});

test("selecting a marker shows its preview and puts it in the URL", () => {
  openMap();
  expect(screen.queryByRole("heading", { name: "Lakeside Kitchen" })).not.toBeInTheDocument();
  const entries = window.history.length;

  act(() => mapProps().onSelect("place:lakeside-kitchen"));

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", "/places/lakeside-kitchen");
  expect(window.location.search).toBe("?place=lakeside-kitchen");
  expect(window.history.length).toBe(entries);
  expect(mapProps().selectedKey).toBe("place:lakeside-kitchen");
});

test("reads the selection from the URL", () => {
  openMap("/?place=lakeside-kitchen");

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(mapProps().selectedKey).toBe("place:lakeside-kitchen");
});

test("shows no preview for a place that is not among the markers", () => {
  openMap("/?place=somewhere-else");

  expect(screen.queryByRole("link", { name: "View details" })).not.toBeInTheDocument();
});

test("closing the preview clears the selection", async () => {
  openMap("/?filter=food&place=lakeside-kitchen");

  await userEvent.click(screen.getByRole("button", { name: "Close" }));

  expect(screen.queryByRole("heading", { name: "Lakeside Kitchen" })).not.toBeInTheDocument();
  expect(window.location.search).toBe("?filter=food");
  expect(mapProps().selectedKey).toBeNull();
});

test("a click on the map itself closes the preview", () => {
  openMap("/?place=lakeside-kitchen");

  act(() => mapProps().onSelect(null));

  expect(screen.queryByRole("heading", { name: "Lakeside Kitchen" })).not.toBeInTheDocument();
  expect(window.location.pathname + window.location.search).toBe("/");
});

// Opening the preview makes the map smaller on a phone, which can push the marker out of the
// box. Losing the preview then would make the map grow again and the two would chase each other.
test("keeps the preview when the selected marker leaves the answer", () => {
  openMap("/?place=lakeside-kitchen");
  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();

  // The map moves, and the answer for the new box no longer holds the marker.
  markersAre({ markers: [] });
  act(() => mapProps().onMove(queenstownBox, { latitude: -45.03, longitude: 168.66, zoom: 14 }));

  expect(mapProps().markers).toEqual([]);
  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
});

test("turning off the category of the selected place closes its preview", async () => {
  openMap("/?filter=food,cafe&place=lakeside-kitchen");

  await userEvent.click(screen.getByRole("button", { name: "Food" }));

  expect(window.location.search).toBe("?filter=cafe");
  expect(screen.queryByRole("heading", { name: "Lakeside Kitchen" })).not.toBeInTheDocument();
});

test("keeps the preview when the filter still shows the selected place", async () => {
  openMap("/?filter=food&place=lakeside-kitchen");

  await userEvent.click(screen.getByRole("button", { name: "Cafes" }));
  expect(window.location.search).toBe("?filter=food,cafe&place=lakeside-kitchen");

  // No chip pressed means everything is shown.
  await userEvent.click(screen.getByRole("button", { name: "Cafes" }));
  await userEvent.click(screen.getByRole("button", { name: "Food" }));
  expect(window.location.search).toBe("?place=lakeside-kitchen");
});

test("explains an empty area and offers to clear the filters", async () => {
  markersAre({ markers: [] });
  openMap("/?filter=bar");

  expect(screen.getByText("No places in this area.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

  expect(window.location.pathname + window.location.search).toBe("/");
  expect(screen.queryAllByRole("button", { pressed: true })).toEqual([]);
});

test("an empty area without a filter has nothing to clear", () => {
  markersAre({ markers: [] });
  openMap();

  expect(screen.getByText("No places in this area.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
});

test("does not call an area empty while it is still loading", () => {
  markersAre({ status: "loading", markers: [] });
  openMap("/?filter=bar");

  expect(screen.queryByText("No places in this area.")).not.toBeInTheDocument();
});

test("a load that takes over five seconds says the server is waking up, and the message goes when it ends", () => {
  vi.useFakeTimers();
  try {
    markersAre({ status: "loading", markers: [] });
    const view = openMap();
    expect(screen.queryByText(/Waking up the server/)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText("Waking up the server… This can take up to a minute.")).toBeInTheDocument();

    markersAre({});
    view.rerender(<MapScreen />);
    expect(screen.queryByText(/Waking up the server/)).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

test("explains a failed load and offers a retry", async () => {
  const state = markersAre({ status: "error" });
  openMap();

  expect(screen.getByText("We couldn't load the map data.")).toBeInTheDocument();
  expect(screen.getByTestId("map-view")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(state.retry).toHaveBeenCalledTimes(1);
});

test("a failed load is not reported as an empty area", () => {
  markersAre({ status: "error", markers: [] });
  openMap("/?filter=bar");

  expect(screen.getByText("We couldn't load the map data.")).toBeInTheDocument();
  expect(screen.queryByText("No places in this area.")).not.toBeInTheDocument();
});

test("says when not everything is shown", () => {
  markersAre({ truncated: true });
  openMap();

  expect(screen.getByText("Zoom in to see every place.")).toBeInTheDocument();
});

test("says nothing when all is well", () => {
  openMap();

  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

// About 170 m from the kitchen.
const inTown = { latitude: -45.0312, longitude: 168.6626 };
const seoul = { latitude: 37.5665, longitude: 126.978 };
const queenstownCamera = { latitude: -45.0312, longitude: 168.6626, zoom: 14 };

function locationIs(result: LocationResult) {
  vi.mocked(locate).mockResolvedValue(result);
}

async function pressLocate() {
  await userEvent.click(screen.getByRole("button", { name: "Show my location" }));
}

test("does not ask for the location on arrival", async () => {
  openMap();

  await act(async () => {});

  expect(wasLocationGranted).toHaveBeenCalledTimes(1);
  expect(locate).not.toHaveBeenCalled();
});

test("uses the location straight away when it was granted before", async () => {
  vi.mocked(wasLocationGranted).mockResolvedValue(true);
  locationIs({ status: "inside", position: inTown });

  openMap();

  await waitFor(() => expect(mapProps().userLocation).toEqual(inTown));
  expect(locate).toHaveBeenCalledTimes(1);
});

// Coming back from a detail page, or opening a shared link, must show the place it shows.
test("a location known on arrival does not move the map", async () => {
  vi.mocked(wasLocationGranted).mockResolvedValue(true);
  locationIs({ status: "inside", position: { latitude: -45.0195, longitude: 168.732 } });

  openMap("/?place=lakeside-kitchen");

  await waitFor(() => expect(mapProps().userLocation).not.toBeNull());
  expect(mapProps().camera).toEqual(queenstownCamera);
});

test("says nothing on arrival when the visitor is outside the area", async () => {
  vi.mocked(wasLocationGranted).mockResolvedValue(true);
  locationIs({ status: "outside", position: seoul });

  openMap();

  await waitFor(() => expect(locate).toHaveBeenCalledTimes(1));
  await act(async () => {});
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(mapProps().userLocation).toBeNull();
});

test("the button moves the map to a position inside the area", async () => {
  const frankton = { latitude: -45.0195, longitude: 168.732 };
  locationIs({ status: "inside", position: frankton });
  openMap();

  await pressLocate();

  expect(mapProps().camera).toEqual({ ...frankton, zoom: 15 });
  expect(mapProps().userLocation).toEqual(frankton);
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("pressing the button again returns to the position", async () => {
  locationIs({ status: "inside", position: inTown });
  openMap();
  await pressLocate();
  const first = mapProps().camera;

  await pressLocate();

  expect(mapProps().camera).toEqual(first);
  expect(mapProps().camera).not.toBe(first);
});

test("outside the area the map stays and says why", async () => {
  locationIs({ status: "outside", position: seoul });
  openMap();

  await pressLocate();

  expect(
    screen.getByText("You're outside the Queenstown area, so the map stays on Queenstown."),
  ).toBeInTheDocument();
  expect(mapProps().camera).toEqual(queenstownCamera);
  expect(mapProps().userLocation).toBeNull();
});

test("a denied permission explains how to turn it on", async () => {
  locationIs({ status: "denied" });
  openMap();

  await pressLocate();

  expect(
    screen.getByText(
      "Location is turned off for this site. Turn it on in your browser settings to see your position.",
    ),
  ).toBeInTheDocument();
  expect(mapProps().camera).toEqual(queenstownCamera);
});

test("an unavailable location says so", async () => {
  locationIs({ status: "unavailable" });
  openMap();

  await pressLocate();

  expect(screen.getByText("We couldn't find your location.")).toBeInTheDocument();
});

test("the button is busy while the position is being found", async () => {
  let finish!: (result: LocationResult) => void;
  vi.mocked(locate).mockReturnValue(new Promise((resolve) => (finish = resolve)));
  openMap();

  await pressLocate();
  expect(screen.getByRole("button", { name: "Show my location" })).toBeDisabled();

  await act(async () => finish({ status: "unavailable" }));
  expect(screen.getByRole("button", { name: "Show my location" })).toBeEnabled();
});

test("a later failure takes the position off the map", async () => {
  locationIs({ status: "inside", position: inTown });
  openMap();
  await pressLocate();
  expect(mapProps().userLocation).toEqual(inTown);

  locationIs({ status: "denied" });
  await pressLocate();

  expect(mapProps().userLocation).toBeNull();
});

test("a message about the location goes away when the map is moved", async () => {
  locationIs({ status: "unavailable" });
  openMap();
  await pressLocate();
  expect(screen.getByText("We couldn't find your location.")).toBeInTheDocument();

  act(() => mapProps().onMove(queenstownBox, queenstownCamera));

  expect(screen.queryByText("We couldn't find your location.")).not.toBeInTheDocument();
});

test("the preview shows the distance once the location is known", async () => {
  locationIs({ status: "inside", position: inTown });
  openMap("/?place=lakeside-kitchen");
  expect(screen.queryByText("170 m")).not.toBeInTheDocument();

  await pressLocate();

  expect(screen.getByText("170 m")).toBeInTheDocument();
});

test("offers no location button when there is no map", () => {
  vi.stubEnv("NEXT_PUBLIC_MAPBOX_TOKEN", "");

  openMap();

  expect(screen.queryByRole("button", { name: "Show my location" })).not.toBeInTheDocument();
});

// A link such as /?place=frankton-market can name a place the map is not showing: the marker is
// outside the box, or hidden by a filter. The screen then asks the API for that one place.

const market: PlaceDetail = {
  slug: "frankton-market",
  name: "Frankton Market",
  category: "shopping",
  subtype: null,
  address: "Frankton",
  imageUrl: null,
  latitude: -45.0195,
  longitude: 168.732,
  description: null,
  openingHours: null,
  phone: null,
  website: null,
  source: "Check data",
  sourceUrl: "https://example.com",
  updatedAt: "2026-10-02T01:30:00Z",
};

/** A lookup the test answers by hand. */
function pendingPlace() {
  let resolve!: (place: PlaceDetail | null) => void;
  const promise = new Promise<PlaceDetail | null>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test("a place from the URL that is not on screen is looked up and shown", async () => {
  vi.mocked(getPlace).mockResolvedValue(market);

  openMap("/?place=frankton-market");

  expect(await screen.findByRole("heading", { name: "Frankton Market" })).toBeInTheDocument();
  expect(getPlace).toHaveBeenCalledTimes(1);
  expect(getPlace).toHaveBeenCalledWith("frankton-market");
  // A first arrival: the map goes to the place the link is about.
  expect(mapProps().camera).toEqual({ latitude: -45.0195, longitude: 168.732, zoom: 16 });
  expect(window.location.search).toBe("?place=frankton-market");
});

test("it leaves a map the visitor has positioned where it is", async () => {
  const lakefront = { latitude: -45.0331, longitude: 168.6597, zoom: 15 };
  window.sessionStorage.setItem("map.camera", JSON.stringify(lakefront));
  vi.mocked(getPlace).mockResolvedValue(market);

  openMap("/?place=frankton-market");

  // Back from a detail page: the preview returns, the map stays where the visitor left it.
  expect(await screen.findByRole("heading", { name: "Frankton Market" })).toBeInTheDocument();
  expect(mapProps().camera).toEqual(lakefront);
});

test("the lookup waits for the markers", () => {
  markersAre({ status: "loading", markers: [] });

  openMap("/?place=frankton-market");

  expect(getPlace).not.toHaveBeenCalled();
});

test("a marker that is on screen is not looked up", () => {
  openMap("/?place=lakeside-kitchen");

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(getPlace).not.toHaveBeenCalled();
});

test("a place that no longer exists leaves the URL", async () => {
  vi.mocked(getPlace).mockResolvedValue(null);

  openMap("/?filter=food&place=gone");

  await waitFor(() => expect(window.location.search).toBe("?filter=food"));
  expect(screen.queryByRole("link", { name: "View details" })).not.toBeInTheDocument();
  expect(mapProps().selectedKey).toBeNull();
});

test("a failed lookup changes nothing", async () => {
  vi.mocked(getPlace).mockRejectedValue(new Error("down"));

  openMap("/?place=frankton-market");
  await waitFor(() => expect(getPlace).toHaveBeenCalled());
  await act(async () => {});

  expect(window.location.search).toBe("?place=frankton-market");
  expect(screen.queryByRole("link", { name: "View details" })).not.toBeInTheDocument();
  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
});

test("a place is looked up once", async () => {
  vi.mocked(getPlace).mockRejectedValue(new Error("down"));
  openMap("/?place=frankton-market");
  await waitFor(() => expect(getPlace).toHaveBeenCalledTimes(1));
  await act(async () => {});

  // Each move of the map brings a new answer without the place.
  markersAre({ markers: [] });
  act(() => mapProps().onMove(queenstownBox, { latitude: -45.03, longitude: 168.66, zoom: 14 }));
  await act(async () => {});

  expect(getPlace).toHaveBeenCalledTimes(1);
});

test("the place wins over a filter that hides it", async () => {
  vi.mocked(getPlace).mockResolvedValue(market);

  openMap("/?filter=cafe&place=frankton-market");

  expect(await screen.findByRole("heading", { name: "Frankton Market" })).toBeInTheDocument();
  expect(window.location.search).toBe("?place=frankton-market");
  expect(screen.queryAllByRole("button", { pressed: true })).toEqual([]);
});

test("a filter that shows the place stays", async () => {
  vi.mocked(getPlace).mockResolvedValue(market);

  openMap("/?filter=cafe,shopping&place=frankton-market");

  expect(await screen.findByRole("heading", { name: "Frankton Market" })).toBeInTheDocument();
  expect(window.location.search).toBe("?filter=cafe,shopping&place=frankton-market");
});

test("an answer for a place the visitor has left is dropped", async () => {
  const lookup = pendingPlace();
  vi.mocked(getPlace).mockReturnValue(lookup.promise);
  openMap("/?place=frankton-market");
  await waitFor(() => expect(getPlace).toHaveBeenCalled());

  // The visitor picks another place before the answer arrives.
  act(() => mapProps().onSelect("place:lakeside-kitchen"));
  await act(async () => {
    lookup.resolve(market);
    await lookup.promise;
  });

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Frankton Market" })).not.toBeInTheDocument();
  expect(window.location.search).toBe("?place=lakeside-kitchen");
  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
});

test("an answer that arrives after the screen has gone touches nothing", async () => {
  const lookup = pendingPlace();
  vi.mocked(getPlace).mockReturnValue(lookup.promise);
  const { unmount } = openMap("/?place=gone");
  await waitFor(() => expect(getPlace).toHaveBeenCalled());

  unmount();
  // By now the address belongs to another screen.
  window.history.replaceState(null, "", "/places/somewhere?place=gone");
  await act(async () => {
    lookup.resolve(null);
    await lookup.promise;
  });

  expect(window.location.pathname + window.location.search).toBe("/places/somewhere?place=gone");
});

// Events and notices share the map with places. A slug is unique within its kind only.

const nightMarket: MapMarker = {
  kind: "event",
  slug: "lakefront-night-market",
  latitude: -45.0331,
  longitude: 168.6597,
  title: "Lakefront Night Market",
  startsAt: "2026-10-09T17:00:00+13:00",
  endsAt: "2026-10-09T21:00:00+13:00",
  venueName: "Earnslaw Park",
};

const roadWorks: MapMarker = {
  kind: "notice",
  slug: "shotover-street-road-works",
  latitude: -45.0312,
  longitude: 168.6626,
  title: "Shotover Street road works",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-06T07:00:00+13:00",
  endsAt: null,
};

const eventDetail: EventDetail = {
  ...(nightMarket as Extract<MapMarker, { kind: "event" }>),
  imageUrl: null,
  description: null,
  address: null,
  source: "Organiser",
  sourceUrl: "https://nightmarket.example",
  updatedAt: "2026-10-01T22:00:00Z",
  ended: false,
};

const noticeDetail: NoticeDetail = {
  slug: "lake-esplanade-closure",
  title: "Lake Esplanade closed",
  type: "road-closure",
  isOfficial: true,
  startsAt: "2026-10-17T08:00:00+13:00",
  endsAt: "2026-10-17T18:00:00+13:00",
  summary: "Closed for an event.",
  locationName: "Lake Esplanade",
  latitude: -45.0352,
  longitude: 168.655,
  sourceOrg: "QLDC",
  sourceUrl: "https://qldc.example",
  updatedAt: "2026-10-10T20:00:00Z",
  ended: false,
};

test("selecting an event shows its card and replaces a selected place in the URL", () => {
  markersAre({ markers: [kitchen, nightMarket] });
  openMap("/?place=lakeside-kitchen");

  act(() => mapProps().onSelect("event:lakefront-night-market"));

  expect(window.location.search).toBe("?event=lakefront-night-market");
  expect(mapProps().selectedKey).toBe("event:lakefront-night-market");
  expect(screen.getByRole("heading", { name: "Lakefront Night Market" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute(
    "href",
    "/events/lakefront-night-market",
  );
});

test("reads a selected notice from the URL", () => {
  markersAre({ markers: [kitchen, roadWorks] });
  openMap("/?notice=shotover-street-road-works");

  expect(mapProps().selectedKey).toBe("notice:shotover-street-road-works");
  expect(screen.getByRole("heading", { name: "Shotover Street road works" })).toBeInTheDocument();
  expect(screen.getByText("Road Work")).toBeInTheDocument();
});

test("an event selects the event, not a place with the same slug", () => {
  const samePlace: MapMarker = { ...kitchen, slug: "lakefront-night-market", name: "Night Market Cafe" };
  markersAre({ markers: [samePlace, nightMarket] });
  openMap("/?event=lakefront-night-market");

  expect(mapProps().selectedKey).toBe("event:lakefront-night-market");
  expect(screen.getByRole("heading", { name: "Lakefront Night Market" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Night Market Cafe" })).not.toBeInTheDocument();
});

test("turning off the Events chip closes the card of a selected event", async () => {
  markersAre({ markers: [kitchen, nightMarket] });
  openMap("/?filter=food,event&event=lakefront-night-market");

  await userEvent.click(screen.getByRole("button", { name: "Events" }));

  expect(window.location.search).toBe("?filter=food");
});

test("an event from the URL that is not on screen is looked up and shown", async () => {
  vi.mocked(getEvent).mockResolvedValue(eventDetail);

  openMap("/?filter=food&event=lakefront-night-market");

  expect(await screen.findByRole("heading", { name: "Lakefront Night Market" })).toBeInTheDocument();
  expect(getEvent).toHaveBeenCalledWith("lakefront-night-market");
  expect(getPlace).not.toHaveBeenCalled();
  expect(mapProps().camera).toEqual({ latitude: -45.0331, longitude: 168.6597, zoom: 16 });
  // The link is about the event, so the filter that hid it gives way.
  expect(window.location.search).toBe("?event=lakefront-night-market");
});

test("an event that has ended leaves the URL", async () => {
  vi.mocked(getEvent).mockResolvedValue({ ...eventDetail, ended: true });

  openMap("/?event=lakefront-night-market");

  await waitFor(() => expect(window.location.search).toBe(""));
  expect(screen.queryByRole("heading", { name: "Lakefront Night Market" })).not.toBeInTheDocument();
});

test("a notice from the URL that is not on screen is looked up and shown", async () => {
  vi.mocked(getNotice).mockResolvedValue(noticeDetail);

  openMap("/?notice=lake-esplanade-closure");

  expect(await screen.findByRole("heading", { name: "Lake Esplanade closed" })).toBeInTheDocument();
  expect(mapProps().selectedKey).toBe("notice:lake-esplanade-closure");
});

test("a notice without a location leaves the URL", async () => {
  vi.mocked(getNotice).mockResolvedValue({ ...noticeDetail, latitude: null, longitude: null, locationName: null });

  openMap("/?filter=notice&notice=lake-esplanade-closure");

  await waitFor(() => expect(window.location.search).toBe("?filter=notice"));
});

describe("search results on the map (SEARCH-03)", () => {
  const coffee = { ...kitchen, slug: "harbour-coffee", name: "Harbour Coffee", category: "cafe", latitude: -45.0335 } as PlaceMarker;
  const bean = { ...coffee, slug: "bean-around", name: "Bean Around", latitude: -45.0309, longitude: 168.6618 };

  test("search words show only the places that match, fitted on the map, with no chips and no area requests", () => {
    searchIs({ markers: [coffee, bean], total: 2 });
    openMap("/?q=coffee");

    expect(vi.mocked(useSearchMarkers).mock.lastCall?.[0]).toBe("coffee");
    expect(mapProps().markers).toEqual([coffee, bean]);
    expect(mapProps().fit).toEqual(boundsOf([coffee, bean]));
    act(() => mapProps().onMove(queenstownBox, { latitude: -45.03, longitude: 168.66, zoom: 14 }));
    expect(vi.mocked(useMarkers).mock.lastCall?.[0]).toBeNull();
    expect(screen.queryByRole("group", { name: "Filters" })).not.toBeInTheDocument();
    expect(screen.getByText("Results for “coffee”")).toBeInTheDocument();
  });

  test("Clear search goes back to the whole map and keeps the selected place", async () => {
    searchIs({ markers: [coffee], total: 1 });
    openMap("/?q=coffee&place=harbour-coffee");

    await userEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(window.location.search).toBe("?place=harbour-coffee");
    expect(vi.mocked(useSearchMarkers).mock.lastCall?.[0]).toBeNull();
    expect(screen.getByRole("group", { name: "Filters" })).toBeInTheDocument();
  });

  test("a search that matches nothing says so and fits nothing", () => {
    searchIs({ markers: [], total: 0 });
    openMap("/?q=sushi");

    expect(screen.getByText("No places match “sushi”.")).toBeInTheDocument();
    expect(mapProps().fit).toBeNull();
  });

  test("more than fifty matches say that only the first fifty are shown", () => {
    searchIs({ markers: [coffee], total: 60 });
    openMap("/?q=shop");

    expect(screen.getByText("Showing the first 50 results.")).toBeInTheDocument();
  });

  test("a failed search offers to try again", async () => {
    const state = searchIs({ status: "error" });
    openMap("/?q=coffee");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(state.retry).toHaveBeenCalledTimes(1);
  });

  test("a result's marker opens its card", () => {
    searchIs({ markers: [coffee], total: 1 });
    openMap("/?q=coffee");

    act(() => mapProps().onSelect("place:harbour-coffee"));

    expect(window.location.search).toBe("?q=coffee&place=harbour-coffee");
    expect(screen.getByRole("heading", { name: "Harbour Coffee" })).toBeInTheDocument();
  });
});
