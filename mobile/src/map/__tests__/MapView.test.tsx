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
  shape: null as unknown,
  source: null as Record<string, unknown> | null,
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
    ShapeSource: (props: { shape: unknown; children?: unknown }) => {
      mockSdk.shape = props.shape;
      mockSdk.source = props;
      return <View>{props.children as never}</View>;
    },
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
  mockSdk.shape = null;
  mockSdk.source = null;
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
};

test("draws the markers as circles with their letters", () => {
  const { update } = renderMap();
  expect(mockSdk.shape).toEqual(toFeatureCollection([]));

  update({ markers: [kitchen] });

  expect(mockSdk.shape).toEqual(toFeatureCollection([kitchen]));
  expect(new Set(mockSdk.layers)).toEqual(new Set(["marker-circles", "marker-selected", "marker-labels"]));
});

test("draws the selected marker filled, and no marker without a selection", () => {
  const { update } = renderMap({ markers: [kitchen] });
  expect(mockSdk.layerProps["marker-selected"].filter).toEqual(["==", ["get", "key"], ""]);

  update({ markers: [kitchen], selectedKey: "place:lakeside-kitchen" });

  expect(mockSdk.layerProps["marker-selected"].filter).toEqual(["==", ["get", "key"], "place:lakeside-kitchen"]);
  const label = mockSdk.layerProps["marker-labels"].style as { textColor: unknown };
  expect(label.textColor).toEqual(["case", ["==", ["get", "key"], "place:lakeside-kitchen"], "#ffffff", "#171717"]);
});

test("a press on a marker selects it, with a 44 pt target", () => {
  const { props } = renderMap({ markers: [kitchen] });

  expect(mockSdk.source?.hitbox).toEqual({ width: 44, height: 44 });
  (mockSdk.source?.onPress as (event: unknown) => void)({
    features: [{ properties: { key: "place:lakeside-kitchen", kind: "place", label: "F" } }],
  });

  expect(props.onSelect).toHaveBeenCalledWith("place:lakeside-kitchen");
});

test("a press beside every marker clears the selection", () => {
  const { props } = renderMap({ markers: [kitchen], selectedKey: "place:lakeside-kitchen" });

  mockSdk.map?.onPress();

  expect(props.onSelect).toHaveBeenCalledWith(null);
});
