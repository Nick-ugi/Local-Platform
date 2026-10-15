import {
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
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import type { Camera } from "./camera";

type Props = {
  /** Mapbox public token. */
  token: string;
  /** Where the map looks when it is created. Giving a new object afterwards moves the map there. */
  camera: Camera;
  markers: readonly MapMarker[];
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

// The markers look as they do on the web (web/src/components/map/MapView.tsx): a white circle with
// a dark ring and the category letter. Full emissive strength keeps them bright in the Standard
// style's lighting.
const INK = "#171717";
const PAPER = "#ffffff";
const RADIUS = 14;

const circleStyle: CircleLayerStyle = {
  circleRadius: RADIUS,
  circleColor: PAPER,
  circleStrokeColor: INK,
  circleStrokeWidth: 2,
  circleEmissiveStrength: 1,
};

const labelStyle: SymbolLayerStyle = {
  textField: ["get", "label"],
  textSize: 13,
  textFont: ["DIN Pro Bold", "Arial Unicode MS Bold"],
  textAllowOverlap: true,
  textIgnorePlacement: true,
  textColor: INK,
  textEmissiveStrength: 1,
};

/**
 * The map itself. This is the only file that touches @rnmapbox/maps; everything that can be
 * decided without the SDK lives in @queenstown/shared and the screen.
 */
export function MapView({ token, camera, markers, showUserLocation, onIdle, onGesture, onUnavailable }: Props) {
  const cameraRef = useRef<MapboxCamera>(null);
  const [startCamera] = useState(camera);
  const shape = useMemo(() => toFeatureCollection(markers), [markers]);

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
    >
      <MapboxCamera
        ref={cameraRef}
        defaultSettings={{ centerCoordinate: toLngLat(startCamera), zoomLevel: startCamera.zoom }}
      />
      {showUserLocation ? <LocationPuck puckBearingEnabled={false} /> : null}
      {/* After the position, so the markers stay on top of it. */}
      <ShapeSource id="markers" shape={shape}>
        <CircleLayer id="marker-circles" style={circleStyle} />
        <SymbolLayer id="marker-labels" style={labelStyle} />
      </ShapeSource>
    </MapboxMapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
