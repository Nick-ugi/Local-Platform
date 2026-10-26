import {
  keyOf,
  type MapBounds,
  type MapMarker,
  toFeatureCollection,
  toLngLat,
  toMapBounds,
  wrapLongitude,
} from "@queenstown/shared";
import Mapbox, {
  CircleLayer,
  type CircleLayerStyle,
  Camera as MapboxCamera,
  LocationPuck,
  MapView as MapboxMapView,
  type MapState,
  ShapeSource,
  SymbolLayer,
  type SymbolLayerStyle,
} from "@rnmapbox/maps";
import { type ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import type { Camera } from "./camera";

type Props = {
  /** Mapbox public token. */
  token: string;
  /** Where the map looks when it is created. Giving a new object afterwards moves the map there. */
  camera: Camera;
  markers: readonly MapMarker[];
  /** The key of the selected marker (shared/src/map/selection.ts), or null. */
  selectedKey: string | null;
  /** Called with the key of the marker the visitor pressed, or null for a press beside every marker. */
  onSelect: (key: string | null) => void;
  /** Draws the visitor's position, which the phone keeps up to date, once permission is granted. */
  showUserLocation: boolean;
  /** Called whenever the map comes to rest, with the visible box. */
  onIdle: (bounds: MapBounds, camera: Camera) => void;
  /** Called when the visitor starts moving the map with a finger. */
  onGesture: () => void;
  /** Called when no map can be shown: the style failed to load, usually a refused token. */
  onUnavailable: () => void;
};

/** The same style as the web app's map (README, "Map"). */
const STYLE = "mapbox://styles/mapbox/standard";

/** How long a move to a new camera takes. */
const MOVE_MS = 800;

// The markers look as they do on the web (web/src/components/map/MapView.tsx): a circle in their
// kind's colour (shared/src/categoryStyle.ts) with a white ring and a white letter. Markers close
// together become a numbered dark cluster up to zoom 15 (MAP-09). Full emissive strength keeps them
// bright in the Standard style's lighting.
const INK = "#171717";
const PAPER = "#ffffff";
const RADIUS = 14;
const CLUSTER_RADIUS = 44;
const CLUSTER_MAX_ZOOM = 15;

type Filter = ComponentProps<typeof CircleLayer>["filter"];
const CLUSTERED: Filter = ["has", "point_count"];
const NOT_CLUSTERED: Filter = ["!", ["has", "point_count"]];

const clusterStyle: CircleLayerStyle = {
  // 18, 22 or 26 pt as the count grows.
  circleRadius: ["step", ["get", "point_count"], 18, 10, 22, 50, 26],
  circleColor: INK,
  circleStrokeColor: PAPER,
  circleStrokeWidth: 2,
  circleEmissiveStrength: 1,
};

const circleStyle: CircleLayerStyle = {
  circleRadius: RADIUS,
  circleColor: ["get", "color"],
  circleStrokeColor: PAPER,
  circleStrokeWidth: 2,
  circleEmissiveStrength: 1,
};

// The selected marker is larger with a dark ring (wireframe a-map).
const selectedStyle: CircleLayerStyle = {
  circleRadius: RADIUS + 6,
  circleColor: ["get", "color"],
  circleStrokeColor: INK,
  circleStrokeWidth: 3,
  circleEmissiveStrength: 1,
};

function textStyle(field: SymbolLayerStyle["textField"]): SymbolLayerStyle {
  return {
    textField: field,
    textSize: 13,
    textFont: ["DIN Pro Bold", "Arial Unicode MS Bold"],
    textAllowOverlap: true,
    textIgnorePlacement: true,
    textColor: PAPER,
    textEmissiveStrength: 1,
  };
}

const labelStyle = textStyle(["get", "label"]);
const countStyle = textStyle(["get", "point_count_abbreviated"]);

/** A press this close to a marker's centre counts: a 44 pt target (README, "Map"). */
const HITBOX = { width: 44, height: 44 };

/**
 * The map itself. This is the only file that touches @rnmapbox/maps; everything that can be
 * decided without the SDK lives in @queenstown/shared and the screen.
 */
export function MapView({
  token,
  camera,
  markers,
  selectedKey,
  onSelect,
  showUserLocation,
  onIdle,
  onGesture,
  onUnavailable,
}: Props) {
  const cameraRef = useRef<MapboxCamera>(null);
  const markersRef = useRef<ShapeSource>(null);
  const [startCamera] = useState(camera);
  // The selected marker is kept out of the clusters, so a linked place shows even where its
  // neighbours are clustered: the map keeps the visitor's view rather than jumping to it.
  const shapes = useMemo(() => {
    const isSelected = (marker: MapMarker) => keyOf(marker) === selectedKey;
    return {
      others: toFeatureCollection(markers.filter((marker) => !isSelected(marker))),
      selected: toFeatureCollection(markers.filter(isSelected)),
    };
  }, [markers, selectedKey]);

  /** A press on a cluster moves in to where it comes apart; a press on a marker selects it. */
  async function press(feature: GeoJSON.Feature | undefined) {
    if (feature?.properties?.cluster) {
      if (feature.geometry.type !== "Point") {
        return;
      }
      const zoom = await markersRef.current?.getClusterExpansionZoom(feature);
      if (typeof zoom === "number") {
        cameraRef.current?.setCamera({
          centerCoordinate: feature.geometry.coordinates,
          zoomLevel: zoom,
          animationDuration: MOVE_MS,
        });
      }
      return;
    }
    const key: unknown = feature?.properties?.key;
    onSelect(typeof key === "string" ? key : null);
  }

  // The token has to be in place before the first map renders.
  useState(() => Mapbox.setAccessToken(token));

  useEffect(() => {
    // The camera the map was created with needs no move; any later one does.
    if (camera !== startCamera) {
      cameraRef.current?.setCamera({
        centerCoordinate: toLngLat(camera),
        zoomLevel: camera.zoom,
        animationDuration: MOVE_MS,
      });
    }
  }, [camera, startCamera]);

  function idle(state: MapState) {
    const { bounds, center, zoom } = state.properties;
    const box = toMapBounds(bounds.sw[0], bounds.sw[1], bounds.ne[0], bounds.ne[1]);
    if (box) {
      onIdle(box, { latitude: center[1], longitude: wrapLongitude(center[0]), zoom });
    }
  }

  return (
    <MapboxMapView
      style={styles.map}
      styleURL={STYLE}
      scaleBarEnabled={false}
      onMapIdle={idle}
      onCameraChanged={(state) => {
        if (state.gestures.isGestureActive) {
          onGesture();
        }
      }}
      onDidFailLoadingMap={onUnavailable}
      // A press on a marker goes to the markers' source and does not reach the map.
      onPress={() => onSelect(null)}
    >
      <MapboxCamera
        ref={cameraRef}
        defaultSettings={{ centerCoordinate: toLngLat(startCamera), zoomLevel: startCamera.zoom }}
      />
      {showUserLocation ? <LocationPuck puckBearingEnabled={false} /> : null}
      {/* After the position, so the markers stay on top of it. */}
      <ShapeSource
        ref={markersRef}
        id="markers"
        shape={shapes.others}
        cluster
        clusterRadius={CLUSTER_RADIUS}
        clusterMaxZoomLevel={CLUSTER_MAX_ZOOM}
        hitbox={HITBOX}
        onPress={(event) => press(event.features[0])}
      >
        <CircleLayer id="marker-clusters" style={clusterStyle} filter={CLUSTERED} />
        <SymbolLayer id="marker-cluster-counts" style={countStyle} filter={CLUSTERED} />
        <CircleLayer id="marker-circles" style={circleStyle} filter={NOT_CLUSTERED} />
        <SymbolLayer id="marker-labels" style={labelStyle} filter={NOT_CLUSTERED} />
      </ShapeSource>
      {/* Last, so the selected marker is drawn above everything else. */}
      <ShapeSource
        id="selected-marker"
        shape={shapes.selected}
        hitbox={HITBOX}
        onPress={(event) => press(event.features[0])}
      >
        <CircleLayer id="marker-selected" style={selectedStyle} />
        <SymbolLayer id="marker-selected-label" style={labelStyle} />
      </ShapeSource>
    </MapboxMapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
