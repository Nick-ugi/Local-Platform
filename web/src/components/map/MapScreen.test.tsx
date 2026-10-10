import type { MapMarker } from "@queenstown/shared";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { MarkersState } from "@/lib/map/useMarkers";
import { useMarkers } from "@/lib/map/useMarkers";
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
};

const queenstownBox = { west: 168.65, south: -45.04, east: 168.67, north: -45.02 };

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

  act(() => mapProps().onSelect("lakeside-kitchen"));

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", "/places/lakeside-kitchen");
  expect(window.location.search).toBe("?place=lakeside-kitchen");
  expect(window.history.length).toBe(entries);
  expect(mapProps().selectedSlug).toBe("lakeside-kitchen");
});

test("reads the selection from the URL", () => {
  openMap("/?place=lakeside-kitchen");

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(mapProps().selectedSlug).toBe("lakeside-kitchen");
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
  expect(mapProps().selectedSlug).toBeNull();
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
