import { type MapMarker, toFeatureCollection } from "@queenstown/shared";
import { render } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { MapView } from "../MapView";

// Stand-ins for the SDK's components that remember what they were given. Jest lets a mock factory
// use only variables whose names start with "mock".
const mockSdk = {
  map: null as Record<string, (...args: never[]) => void> | null,
  defaultSettings: null as unknown,
  setCamera: jest.fn(),
  setAccessToken: jest.fn(),
  puck: false,
  /** Each ShapeSource's props, by id. */
  sources: {} as Record<string, Record<string, unknown>>,
  expansionZoom: jest.fn(async (_feature: unknown) => 16),
  layers: [] as string[],
  layerProps: {} as Record<string, Record<string, unknown>>,
};

jest.mock("@rnmapbox/maps", () => {
  const { View } = jest.requireActual("react-native");
  const { forwardRef, useImperativeHandle } = jest.requireActual("react");
  return {
    __esModule: true,
    default: { setAccessToken: (token: string) => mockSdk.setAccessToken(token) },
    MapView: (props: { children?: unknown } & Record<string, (...args: never[]) => void>) => {
      mockSdk.map = props;
      return <View>{props.children as never}</View>;
    },
    Camera: forwardRef(function Camera(props: { defaultSettings: unknown }, ref: unknown) {
      mockSdk.defaultSettings = props.defaultSettings;
      useImperativeHandle(ref, () => ({ setCamera: mockSdk.setCamera }));
      return null;
    }),
    LocationPuck: () => {
      mockSdk.puck = true;
      return null;
    },
    ShapeSource: forwardRef(function ShapeSource(
      props: { id: string; shape: unknown; children?: unknown },
      ref: unknown,
    ) {
      mockSdk.sources[props.id] = props;
      useImperativeHandle(ref, () => ({ getClusterExpansionZoom: mockSdk.expansionZoom }));
      return <View>{props.children as never}</View>;
    }),
    CircleLayer: (props: { id: string }) => {
      mockSdk.layers.push(props.id);
      mockSdk.layerProps[props.id] = props;
      return null;
    },
    SymbolLayer: (props: { id: string }) => {
      mockSdk.layers.push(props.id);
      mockSdk.layerProps[props.id] = props;
      return null;
    },
  };
});

type Props = ComponentProps<typeof MapView>;

function renderMap(overrides: Partial<Props> = {}) {
  const props: Props = {
    token: "pk.test",
    camera: { latitude: -45.0312, longitude: 168.6626, zoom: 14 },
    markers: [],
    selectedKey: null,
    onSelect: jest.fn(),
    showUserLocation: false,
    onIdle: jest.fn(),
    onGesture: jest.fn(),
    onUnavailable: jest.fn(),
    ...overrides,
  };
  const view = render(<MapView {...props} />);
  return { props, update: (changes: Partial<Props>) => view.rerender(<MapView {...props} {...changes} />) };
}

beforeEach(() => {
  mockSdk.map = null;
  mockSdk.puck = false;
  mockSdk.sources = {};
  mockSdk.expansionZoom.mockClear();
  mockSdk.layers = [];
  mockSdk.layerProps = {};
  mockSdk.setCamera.mockClear();
  mockSdk.setAccessToken.mockClear();
});

test("gives the SDK the token and starts on the camera, longitude first", () => {
  renderMap();

  expect(mockSdk.setAccessToken).toHaveBeenCalledWith("pk.test");
  expect(mockSdk.defaultSettings).toEqual({ centerCoordinate: [168.6626, -45.0312], zoomLevel: 14 });
  expect(mockSdk.setCamera).not.toHaveBeenCalled();
});

test("moves to a new camera", () => {
  const { update } = renderMap();

  update({ camera: { latitude: -45.0322, longitude: 168.661, zoom: 15 } });

  expect(mockSdk.setCamera).toHaveBeenCalledWith({
    centerCoordinate: [168.661, -45.0322],
    zoomLevel: 15,
    animationDuration: 800,
  });
});

test("reports the box and camera when the map comes to rest", () => {
  const { props } = renderMap();

  mockSdk.map?.onMapIdle({
    properties: { bounds: { ne: [168.67, -45.02], sw: [168.65, -45.04] }, center: [168.66, -45.03], zoom: 14.5 },
  } as never);

  expect(props.onIdle).toHaveBeenCalledWith(
    { west: 168.65, south: -45.04, east: 168.67, north: -45.02 },
    { latitude: -45.03, longitude: 168.66, zoom: 14.5 },
  );
});

test("reports a gesture, and not a move the app made", () => {
  const { props } = renderMap();

  mockSdk.map?.onCameraChanged({ gestures: { isGestureActive: false } } as never);
  expect(props.onGesture).not.toHaveBeenCalled();

  mockSdk.map?.onCameraChanged({ gestures: { isGestureActive: true } } as never);
  expect(props.onGesture).toHaveBeenCalledTimes(1);
});

test("draws the visitor's position only when asked to", () => {
  const { update } = renderMap();
  expect(mockSdk.puck).toBe(false);

  update({ showUserLocation: true });
  expect(mockSdk.puck).toBe(true);
});

test("reports a map that failed to load", () => {
  const { props } = renderMap();

  mockSdk.map?.onDidFailLoadingMap();

  expect(props.onUnavailable).toHaveBeenCalledTimes(1);
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

const bakery: MapMarker = { ...kitchen, slug: "beach-street-bakery", latitude: -45.0331, longitude: 168.6597 };

/** The keys in one of the two sources. */
function keysIn(id: "markers" | "selected-marker") {
  return (mockSdk.sources[id].shape as ReturnType<typeof toFeatureCollection>).features.map(
    (feature) => feature.properties.key,
  );
}

test("draws the markers in their kind's colour with their letters, clustered when zoomed out", () => {
  const { update } = renderMap();
  expect(mockSdk.sources.markers.shape).toEqual(toFeatureCollection([]));

  update({ markers: [kitchen] });

  expect(mockSdk.sources.markers.shape).toEqual(toFeatureCollection([kitchen]));
  const { cluster, clusterRadius, clusterMaxZoomLevel } = mockSdk.sources.markers;
  expect({ cluster, clusterRadius, clusterMaxZoomLevel }).toEqual({ cluster: true, clusterRadius: 44, clusterMaxZoomLevel: 15 });
  expect(new Set(mockSdk.layers)).toEqual(
    new Set([
      "marker-clusters",
      "marker-cluster-counts",
      "marker-circles",
      "marker-labels",
      "marker-selected",
      "marker-selected-label",
    ]),
  );
  const circles = mockSdk.layerProps["marker-circles"].style as { circleColor: unknown };
  expect(circles.circleColor).toEqual(["get", "color"]);
});

test("draws the selected marker on its own, outside the clusters", () => {
  const { update } = renderMap({ markers: [kitchen, bakery] });
  expect(keysIn("markers")).toEqual(["place:lakeside-kitchen", "place:beach-street-bakery"]);
  expect(keysIn("selected-marker")).toEqual([]);

  update({ markers: [kitchen, bakery], selectedKey: "place:lakeside-kitchen" });

  expect(keysIn("markers")).toEqual(["place:beach-street-bakery"]);
  expect(keysIn("selected-marker")).toEqual(["place:lakeside-kitchen"]);
  expect(mockSdk.sources["selected-marker"].cluster).toBeUndefined();
});

test("a press on a marker selects it, with a 44 pt target", () => {
  const { props } = renderMap({ markers: [kitchen] });

  expect(mockSdk.sources.markers.hitbox).toEqual({ width: 44, height: 44 });
  (mockSdk.sources.markers.onPress as (event: unknown) => void)({
    features: [{ properties: { key: "place:lakeside-kitchen", kind: "place", label: "F" } }],
  });

  expect(props.onSelect).toHaveBeenCalledWith("place:lakeside-kitchen");
});

test("a press on a cluster moves in to where it comes apart, and selects nothing", async () => {
  const { props } = renderMap({ markers: [kitchen, bakery] });
  const cluster = {
    type: "Feature",
    geometry: { type: "Point", coordinates: [168.66, -45.032] },
    properties: { cluster: true, cluster_id: 7, point_count: 2 },
  };

  await (mockSdk.sources.markers.onPress as (event: unknown) => Promise<void>)({ features: [cluster] });

  expect(mockSdk.expansionZoom).toHaveBeenCalledWith(cluster);
  expect(mockSdk.setCamera).toHaveBeenCalledWith({
    centerCoordinate: [168.66, -45.032],
    zoomLevel: 16,
    animationDuration: 800,
  });
  expect(props.onSelect).not.toHaveBeenCalled();
});

test("a press beside every marker clears the selection", () => {
  const { props } = renderMap({ markers: [kitchen], selectedKey: "place:lakeside-kitchen" });

  mockSdk.map?.onPress();

  expect(props.onSelect).toHaveBeenCalledWith(null);
});
