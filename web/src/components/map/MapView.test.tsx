import { type MapMarker, toFeatureCollection } from "@queenstown/shared";
import { act, render, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { MapView } from "./MapView";

// A stand-in for the Mapbox map. It records what the component asks of it and lets a test fire
// the map's events.
const { FakeMap } = vi.hoisted(() => {
  type Handler = (event?: unknown) => void;

  class FakeMap {
    static instances: FakeMap[] = [];
    static failWith: Error | null = null;

    options: Record<string, unknown>;
    handlers: Record<string, Handler[]> = {};
    sources: Record<string, { data: unknown; setData: (data: unknown) => void }> = {};
    layers: { id: string; source?: string }[] = [];
    filters: Record<string, unknown> = {};
    canvas = { style: { cursor: "" } };
    flights: unknown[] = [];
    removed = false;

    box = { west: 168.65, south: -45.04, east: 168.67, north: -45.02 };
    center = { lng: 168.66, lat: -45.03 };
    zoom = 13;
    /** What a click or the pointer finds on the marker layers. */
    featuresUnderPointer: unknown[] = [];

    constructor(options: Record<string, unknown>) {
      if (FakeMap.failWith) {
        throw FakeMap.failWith;
      }
      this.options = options;
      FakeMap.instances.push(this);
    }

    on(type: string, handler: Handler) {
      (this.handlers[type] ??= []).push(handler);
      return this;
    }

    fire(type: string, event?: unknown) {
      for (const handler of this.handlers[type] ?? []) {
        handler(event);
      }
    }

    addSource(id: string, source: { data: unknown }) {
      const entry = {
        data: source.data,
        setData: (data: unknown) => {
          entry.data = data;
        },
      };
      this.sources[id] = entry;
    }

    /** The real map throws when it is used after remove(). */
    mustBeAlive() {
      if (this.removed) {
        throw new Error("the map was used after it was removed");
      }
    }

    getSource(id: string) {
      this.mustBeAlive();
      return this.sources[id];
    }

    addLayer(layer: { id: string; source?: string; filter?: unknown }) {
      this.layers.push(layer);
      this.filters[layer.id] = layer.filter;
    }

    setFilter(id: string, filter: unknown) {
      this.mustBeAlive();
      this.filters[id] = filter;
    }

    setPaintProperty() {
      this.mustBeAlive();
    }

    getBounds() {
      return {
        getWest: () => this.box.west,
        getSouth: () => this.box.south,
        getEast: () => this.box.east,
        getNorth: () => this.box.north,
      };
    }

    getCenter() {
      return this.center;
    }

    getZoom() {
      return this.zoom;
    }

    queryRenderedFeatures() {
      return this.featuresUnderPointer;
    }

    getCanvas() {
      return this.canvas;
    }

    flyTo(options: unknown) {
      this.mustBeAlive();
      this.flights.push(options);
    }

    remove() {
      this.removed = true;
    }
  }

  return { FakeMap };
});

vi.mock("mapbox-gl", () => ({ default: { Map: FakeMap } }));

function place(slug: string, latitude: number, longitude: number): MapMarker {
  return { kind: "place", slug, latitude, longitude, name: slug, category: "food", subtype: null };
}

const kitchen = place("lakeside-kitchen", -45.0322, 168.661);
const bakery = place("beach-street-bakery", -45.0331, 168.6597);

type Props = ComponentProps<typeof MapView>;

function renderMap(overrides: Partial<Props> = {}) {
  const props: Props = {
    token: "pk.test",
    camera: { latitude: -45.0312, longitude: 168.6626, zoom: 14 },
    markers: [kitchen],
    selectedKey: null,
    userLocation: null,
    onMove: vi.fn(),
    onSelect: vi.fn(),
    onUnavailable: vi.fn(),
    ...overrides,
  };
  const view = render(<MapView {...props} />);
  return {
    props,
    unmount: view.unmount,
    update: (changes: Partial<Props>) => view.rerender(<MapView {...props} {...changes} />),
  };
}

/** The component creates the map once it has loaded the SDK. */
async function createdMap() {
  await waitFor(() => expect(FakeMap.instances).toHaveLength(1));
  return FakeMap.instances[0];
}

async function loadedMap() {
  const map = await createdMap();
  act(() => map.fire("load"));
  return map;
}

/** The GeoJSON currently in one of the map's two sources. */
function dataOf(map: InstanceType<typeof FakeMap>, source: "markers" | "visitor") {
  return map.sources[source].data;
}

beforeEach(() => {
  FakeMap.instances = [];
  FakeMap.failWith = null;
});

test("creates the map with the token and the camera", async () => {
  renderMap();

  const map = await createdMap();

  expect(map.options.accessToken).toBe("pk.test");
  expect(map.options.center).toEqual([168.6626, -45.0312]);
  expect(map.options.zoom).toBe(14);
  expect(map.options.style).toBe("mapbox://styles/mapbox/standard");
  expect(document.body).toContainElement(map.options.container as HTMLElement);
});

test("draws the markers once the map has loaded", async () => {
  renderMap({ markers: [kitchen, bakery] });
  const map = await createdMap();
  expect(map.sources).toEqual({});

  act(() => map.fire("load"));

  expect(dataOf(map, "markers")).toEqual(toFeatureCollection([kitchen, bakery]));
  expect(map.layers.filter((layer) => layer.source === "markers")).toHaveLength(3);
});

test("updates the data when the markers change", async () => {
  const { update } = renderMap({ markers: [kitchen] });
  const map = await loadedMap();

  update({ markers: [bakery] });

  expect(dataOf(map, "markers")).toEqual(toFeatureCollection([bakery]));
});

test("shows the visitor's position", async () => {
  const { update } = renderMap({ userLocation: { latitude: -45.0312, longitude: 168.6626 } });
  const map = await loadedMap();

  expect(dataOf(map, "visitor")).toEqual({
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: { type: "Point", coordinates: [168.6626, -45.0312] }, properties: {} }],
  });

  update({ userLocation: null });

  expect(dataOf(map, "visitor")).toEqual({ type: "FeatureCollection", features: [] });
});

test("shows no position until there is one", async () => {
  const { update } = renderMap();
  const map = await loadedMap();
  expect(dataOf(map, "visitor")).toEqual({ type: "FeatureCollection", features: [] });

  update({ userLocation: { latitude: -45.0195, longitude: 168.732 } });

  expect(dataOf(map, "visitor")).toMatchObject({ features: [{ geometry: { coordinates: [168.732, -45.0195] } }] });
});

test("draws the markers above the visitor's position", async () => {
  renderMap();
  const map = await loadedMap();

  const sources = map.layers.map((layer) => layer.source);
  expect(sources.lastIndexOf("visitor")).toBeGreaterThanOrEqual(0);
  expect(sources.lastIndexOf("visitor")).toBeLessThan(sources.indexOf("markers"));
});

test("moves when the camera changes", async () => {
  const { update } = renderMap();
  const map = await loadedMap();
  expect(map.flights).toEqual([]);

  update({ camera: { latitude: -45.0195, longitude: 168.732, zoom: 15 } });

  expect(map.flights).toEqual([{ center: [168.732, -45.0195], zoom: 15 }]);
});

test("goes to a camera that changed while the map was still loading", async () => {
  const { update } = renderMap();
  const map = await createdMap();

  update({ camera: { latitude: -45.0195, longitude: 168.732, zoom: 15 } });
  expect(map.flights).toEqual([]);
  act(() => map.fire("load"));

  expect(map.flights).toEqual([{ center: [168.732, -45.0195], zoom: 15 }]);
});

test("goes back to the same camera when it is given again", async () => {
  const { update } = renderMap();
  const map = await loadedMap();

  update({ camera: { latitude: -45.0195, longitude: 168.732, zoom: 15 } });
  update({ camera: { latitude: -45.0195, longitude: 168.732, zoom: 15 } });

  expect(map.flights).toHaveLength(2);
});

test("reports the first box when the map has loaded", async () => {
  const { props } = renderMap();

  await loadedMap();

  expect(props.onMove).toHaveBeenCalledTimes(1);
  expect(props.onMove).toHaveBeenCalledWith(
    { west: 168.65, south: -45.04, east: 168.67, north: -45.02 },
    { latitude: -45.03, longitude: 168.66, zoom: 13 },
  );
});

test("reports the box and camera after a move", async () => {
  const { props } = renderMap();
  const map = await loadedMap();
  vi.mocked(props.onMove).mockClear();

  map.box = { west: 168.72, south: -45.03, east: 168.74, north: -45.01 };
  map.center = { lng: 168.73, lat: -45.02 };
  map.zoom = 12.5;
  act(() => map.fire("moveend"));

  expect(props.onMove).toHaveBeenCalledTimes(1);
  expect(props.onMove).toHaveBeenCalledWith(
    { west: 168.72, south: -45.03, east: 168.74, north: -45.01 },
    { latitude: -45.02, longitude: 168.73, zoom: 12.5 },
  );
});

// After a drag once round the world the map reports longitudes 360 higher.
test("reports a box the API accepts from another copy of the world", async () => {
  const { props } = renderMap();
  const map = await loadedMap();
  vi.mocked(props.onMove).mockClear();

  map.box = { west: 528.65, south: -45.04, east: 528.67, north: -45.02 };
  map.center = { lng: 528.66, lat: -45.03 };
  act(() => map.fire("moveend"));

  const [bounds, camera] = vi.mocked(props.onMove).mock.calls[0];
  expect(bounds.west).toBeCloseTo(168.65, 9);
  expect(bounds.east).toBeCloseTo(168.67, 9);
  expect(camera.longitude).toBeCloseTo(168.66, 9);
});

test("does not report a box with no area", async () => {
  const { props } = renderMap();
  const map = await loadedMap();
  vi.mocked(props.onMove).mockClear();

  map.box = { west: 168.65, south: -45.04, east: 168.65, north: -45.04 };
  act(() => map.fire("moveend"));

  expect(props.onMove).not.toHaveBeenCalled();
});

test("reports the marker that was clicked", async () => {
  const { props } = renderMap();
  const map = await loadedMap();

  map.featuresUnderPointer = [{ properties: { key: "place:lakeside-kitchen" } }];
  act(() => map.fire("click", { point: { x: 120, y: 80 } }));

  expect(props.onSelect).toHaveBeenCalledTimes(1);
  expect(props.onSelect).toHaveBeenCalledWith("place:lakeside-kitchen");
});

test("clears the selection on a click elsewhere", async () => {
  const { props } = renderMap({ selectedKey: "place:lakeside-kitchen" });
  const map = await loadedMap();

  map.featuresUnderPointer = [];
  act(() => map.fire("click", { point: { x: 10, y: 10 } }));

  expect(props.onSelect).toHaveBeenCalledTimes(1);
  expect(props.onSelect).toHaveBeenCalledWith(null);
});

test("draws the selected marker apart from the others", async () => {
  const { update } = renderMap({ selectedKey: "place:lakeside-kitchen" });
  const map = await loadedMap();
  const selectedOnly = ["==", ["get", "key"], "place:lakeside-kitchen"];
  expect(Object.values(map.filters)).toContainEqual(selectedOnly);

  update({ selectedKey: "place:beach-street-bakery" });

  expect(Object.values(map.filters)).toContainEqual(["==", ["get", "key"], "place:beach-street-bakery"]);
  expect(Object.values(map.filters)).not.toContainEqual(selectedOnly);
});

test("shows a pointer over a marker", async () => {
  renderMap();
  const map = await loadedMap();

  map.featuresUnderPointer = [{ properties: { key: "place:lakeside-kitchen" } }];
  act(() => map.fire("mousemove", { point: { x: 120, y: 80 } }));
  expect(map.canvas.style.cursor).toBe("pointer");

  map.featuresUnderPointer = [];
  act(() => map.fire("mousemove", { point: { x: 10, y: 10 } }));
  expect(map.canvas.style.cursor).toBe("");
});

test("removes the map when it goes away", async () => {
  const { unmount } = renderMap();
  const map = await loadedMap();

  unmount();

  expect(map.removed).toBe(true);
});

// The effect that creates the map runs again when the token changes, and in development on
// every edit of the file. The old map is gone then, and the new one has not loaded yet.
test("leaves a map alone once it has removed it", async () => {
  const { update } = renderMap();
  const first = await loadedMap();

  update({ token: "pk.other" });
  await waitFor(() => expect(FakeMap.instances).toHaveLength(2));
  expect(first.removed).toBe(true);

  expect(() =>
    update({
      token: "pk.other",
      markers: [bakery],
      selectedKey: "place:beach-street-bakery",
      userLocation: { latitude: -45.0312, longitude: 168.6626 },
      camera: { latitude: -45.0195, longitude: 168.732, zoom: 15 },
    }),
  ).not.toThrow();
});

test("creates no map when it goes away before the SDK has loaded", async () => {
  const { unmount } = renderMap();

  unmount();
  await act(async () => {});

  expect(FakeMap.instances).toHaveLength(0);
});

test("reports when the map cannot start", async () => {
  FakeMap.failWith = new Error("Failed to initialize WebGL");
  const { props } = renderMap();

  await waitFor(() => expect(props.onUnavailable).toHaveBeenCalledTimes(1));

  expect(FakeMap.instances).toHaveLength(0);
});

test("reports when Mapbox refuses the token", async () => {
  const { props } = renderMap();
  const map = await createdMap();

  act(() => map.fire("error", { error: { status: 401 } }));

  expect(props.onUnavailable).toHaveBeenCalledTimes(1);
});

test("keeps the map when a single tile fails", async () => {
  const { props } = renderMap();
  const map = await loadedMap();

  act(() => map.fire("error", { error: { status: 503 } }));
  act(() => map.fire("error", { error: new Error("tile failed") }));

  expect(props.onUnavailable).not.toHaveBeenCalled();
});
