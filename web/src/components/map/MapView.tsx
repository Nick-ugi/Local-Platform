"use client";

import {
  type LatLng,
  type MapBounds,
  keyOf,
  type MapMarker,
  toFeatureCollection,
  toLngLat,
  toMapBounds,
  toPositionCollection,
  wrapLongitude,
} from "@queenstown/shared";
import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MapboxMap,
  MapMouseEvent,
  SymbolLayerSpecification,
} from "mapbox-gl";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Camera } from "@/lib/map/camera";

type Props = {
  /** Mapbox public token. */
  token: string;
  /** Where the map looks when it is created. Giving a new object afterwards moves the map there. */
  camera: Camera;
  markers: readonly MapMarker[];
  /** The key of the selected marker (shared/src/map/selection.ts), or null. */
  selectedKey: string | null;
  /** The visitor's position, drawn as a dot, or null to draw none. */
  userLocation: LatLng | null;
  /** Called when the map has loaded and after every move, with the visible box. */
  onMove: (bounds: MapBounds, camera: Camera) => void;
  /** Called with the key of the marker that was clicked, or null for a click on the map itself. */
  onSelect: (key: string | null) => void;
  /** Called when no map can be shown: no WebGL, or Mapbox refused the token. */
  onUnavailable: () => void;
  /** A box to show whole, such as search results. A box with other edges moves the map again. */
  fit?: MapBounds | null;
};

const STYLE = "mapbox://styles/mapbox/standard";

const SOURCE = "markers";
const CLUSTERS = "marker-clusters";
const CLUSTER_COUNTS = "marker-cluster-counts";
const CIRCLES = "marker-circles";
const LABELS = "marker-labels";
const SELECTED_SOURCE = "selected-marker";
const SELECTED = "marker-selected";
const SELECTED_LABEL = "marker-selected-label";

// Markers closer than this on screen are drawn as one numbered cluster (MAP-09), up to this zoom.
const CLUSTER_RADIUS_PX = 44;
const CLUSTER_MAX_ZOOM = 17;
// Room round a fitted box, and no closer than a street, so one result is not shown at zoom 22.
const FIT_PADDING = 64;
const FIT_MAX_ZOOM = 16;
const NOT_A_CLUSTER: FilterSpecification = ["!", ["has", "point_count"]];

const VISITOR = "visitor";
const VISITOR_HALO = "visitor-halo";
const VISITOR_DOT = "visitor-dot";

const INK = "#171717";
const PAPER = "#ffffff";
const VISITOR_BLUE = "#1d4ed8";
const RADIUS_PX = 14;
/** A click this far outside a marker still counts, which makes the marker a 44 px target. */
const REACH_PX = 22 - RADIUS_PX;

/** A cluster grows a little with its count: 18, 22 or 26 px. */
const CLUSTER_RADIUS: ExpressionSpecification = ["step", ["get", "point_count"], 18, 10, 22, 50, 26];

/** The visitor's position: a blue dot with a halo (wireframe m-map-place). */
function addVisitorLayers(map: MapboxMap) {
  map.addSource(VISITOR, { type: "geojson", data: toPositionCollection(null) });
  map.addLayer({
    id: VISITOR_HALO,
    type: "circle",
    source: VISITOR,
    paint: { "circle-radius": 16, "circle-color": VISITOR_BLUE, "circle-opacity": 0.2, "circle-emissive-strength": 1 },
  });
  map.addLayer({
    id: VISITOR_DOT,
    type: "circle",
    source: VISITOR,
    paint: {
      "circle-radius": 6,
      "circle-color": VISITOR_BLUE,
      "circle-stroke-color": PAPER,
      "circle-stroke-width": 2,
      "circle-emissive-strength": 1,
    },
  });
}

/**
 * One clustered source and five layers (MAP-09): a numbered dark circle for each cluster, then for
 * single markers a circle in their kind's colour (shared/src/categoryStyle.ts), a larger one with a
 * dark ring for the selected marker (wireframe m-map-place), and the category letter in white.
 */
function addMarkerLayers(map: MapboxMap) {
  map.addSource(SOURCE, {
    type: "geojson",
    data: toFeatureCollection([]),
    cluster: true,
    clusterRadius: CLUSTER_RADIUS_PX,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
  });
  map.addLayer({
    id: CLUSTERS,
    type: "circle",
    source: SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-radius": CLUSTER_RADIUS,
      "circle-color": INK,
      "circle-stroke-color": PAPER,
      "circle-stroke-width": 2,
      "circle-emissive-strength": 1,
    },
  });
  map.addLayer({
    id: CLUSTER_COUNTS,
    type: "symbol",
    source: SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-size": 13,
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": PAPER, "text-emissive-strength": 1 },
  });
  map.addLayer({
    id: CIRCLES,
    type: "circle",
    source: SOURCE,
    filter: NOT_A_CLUSTER,
    paint: {
      "circle-radius": RADIUS_PX,
      "circle-color": ["get", "color"],
      "circle-stroke-color": PAPER,
      "circle-stroke-width": 2,
      "circle-emissive-strength": 1,
    },
  });
  map.addLayer({ id: LABELS, type: "symbol", source: SOURCE, filter: NOT_A_CLUSTER, layout: LETTER, paint: WHITE_TEXT });

  // The selected marker is kept out of the clusters and drawn last, on its own source, so a linked
  // place shows even where its neighbours are clustered (the map keeps the visitor's view).
  map.addSource(SELECTED_SOURCE, { type: "geojson", data: toFeatureCollection([]) });
  map.addLayer({
    id: SELECTED,
    type: "circle",
    source: SELECTED_SOURCE,
    paint: {
      "circle-radius": RADIUS_PX + 6,
      "circle-color": ["get", "color"],
      "circle-stroke-color": INK,
      "circle-stroke-width": 3,
      "circle-emissive-strength": 1,
    },
  });
  map.addLayer({ id: SELECTED_LABEL, type: "symbol", source: SELECTED_SOURCE, layout: LETTER, paint: WHITE_TEXT });
}

/** The category letter drawn in the middle of a marker. */
const LETTER = {
  "text-field": ["get", "label"],
  "text-size": 13,
  "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
  "text-allow-overlap": true,
  "text-ignore-placement": true,
} satisfies SymbolLayerSpecification["layout"];

const WHITE_TEXT = { "text-color": PAPER, "text-emissive-strength": 1 } satisfies SymbolLayerSpecification["paint"];

/** The cluster at the pointer, with its id and centre, or null. */
function clusterAt(map: MapboxMap, event: MapMouseEvent): { id: number; center: [number, number] } | null {
  const [found] = map.queryRenderedFeatures(event.point, { layers: [CLUSTERS] });
  const id: unknown = found?.properties?.cluster_id;
  const geometry = found?.geometry;
  if (typeof id !== "number" || geometry?.type !== "Point") {
    return null;
  }
  const [longitude, latitude] = geometry.coordinates;
  return { id, center: [longitude, latitude] };
}

/** Moves in to the zoom at which the cluster comes apart into its markers. */
function openCluster(map: MapboxMap, cluster: { id: number; center: [number, number] }) {
  map.getSource<GeoJSONSource>(SOURCE)?.getClusterExpansionZoom(cluster.id, (error, zoom) => {
    if (!error && typeof zoom === "number") {
      map.easeTo({ center: cluster.center, zoom });
    }
  });
}

/** The key of the marker at the pointer, or null when there is none within reach. */
function keyAt(map: MapboxMap, event: MapMouseEvent): string | null {
  const { x, y } = event.point;
  const found = map.queryRenderedFeatures(
    [
      [x - REACH_PX, y - REACH_PX],
      [x + REACH_PX, y + REACH_PX],
    ],
    { layers: [SELECTED, CIRCLES] },
  );
  const key: unknown = found[0]?.properties?.key;
  return typeof key === "string" ? key : null;
}

/** True for the answer Mapbox gives to a token it does not accept. */
function isRefusal(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * The map itself. This is the only file that touches mapbox-gl; everything that can be decided
 * without the SDK lives in shared/src/map and lib/map. The SDK is imported inside an effect, so it
 * is neither part of the server render nor of the first script the browser loads.
 */
export function MapView({
  token,
  camera,
  markers,
  selectedKey,
  userLocation,
  onMove,
  onSelect,
  onUnavailable,
  fit = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Set once the style has loaded, which is when sources and layers can be changed.
  const [map, setMap] = useState<MapboxMap | null>(null);
  const [startCamera] = useState(camera);

  const reportMove = useEffectEvent((target: MapboxMap) => {
    const box = target.getBounds();
    const bounds = box ? toMapBounds(box.getWest(), box.getSouth(), box.getEast(), box.getNorth()) : null;
    if (!bounds) {
      return;
    }
    const center = target.getCenter();
    onMove(bounds, { latitude: center.lat, longitude: wrapLongitude(center.lng), zoom: target.getZoom() });
  });
  const reportSelect = useEffectEvent((key: string | null) => onSelect(key));
  const reportUnavailable = useEffectEvent(() => onUnavailable());

  useEffect(() => {
    let gone = false;
    let created: MapboxMap | null = null;

    async function start() {
      try {
        const { default: mapboxgl } = await import("mapbox-gl");
        if (gone || !containerRef.current) {
          return;
        }
        created = new mapboxgl.Map({
          accessToken: token,
          container: containerRef.current,
          style: STYLE,
          center: toLngLat(startCamera),
          zoom: startCamera.zoom,
        });
      } catch {
        // The browser has no WebGL, or the SDK could not be loaded.
        if (!gone) {
          reportUnavailable();
        }
        return;
      }

      const target = created;
      let loaded = false;
      target.on("load", () => {
        loaded = true;
        // The markers go on last, so they stay on top of the visitor's dot.
        addVisitorLayers(target);
        addMarkerLayers(target);
        target.on("click", (event) => {
          // A cluster opens up; it is not a selection.
          const cluster = clusterAt(target, event);
          if (cluster) {
            openCluster(target, cluster);
            return;
          }
          reportSelect(keyAt(target, event));
        });
        target.on("mousemove", (event) => {
          const over = clusterAt(target, event) !== null || keyAt(target, event) !== null;
          target.getCanvas().style.cursor = over ? "pointer" : "";
        });
        setMap(target);
        reportMove(target);
      });
      target.on("moveend", () => reportMove(target));
      target.on("error", (event) => {
        // Before the style has loaded a refusal means there will be no map. Later errors are
        // single tiles or images, and the map carries on without them.
        if (!loaded && isRefusal(event.error)) {
          reportUnavailable();
        }
      });
    }

    void start();

    return () => {
      gone = true;
      created?.remove();
      // A removed map must not be drawn on; the effects below wait for the next one to load.
      setMap(null);
    };
  }, [token, startCamera]);

  useEffect(() => {
    if (!map) {
      return;
    }
    const isSelected = (marker: MapMarker) => keyOf(marker) === selectedKey;
    map.getSource<GeoJSONSource>(SOURCE)?.setData(toFeatureCollection(markers.filter((marker) => !isSelected(marker))));
    map.getSource<GeoJSONSource>(SELECTED_SOURCE)?.setData(toFeatureCollection(markers.filter(isSelected)));
  }, [map, markers, selectedKey]);

  useEffect(() => {
    map?.getSource<GeoJSONSource>(VISITOR)?.setData(toPositionCollection(userLocation));
  }, [map, userLocation]);

  useEffect(() => {
    // The camera the map was created with needs no move; any later one does.
    if (map && camera !== startCamera) {
      map.flyTo({ center: toLngLat(camera), zoom: camera.zoom });
    }
  }, [map, camera, startCamera]);

  // Keyed by the edges, so the same box given again as a new object does not move the map back.
  const { west, south, east, north } = fit ?? {};
  useEffect(() => {
    if (map && west !== undefined && south !== undefined && east !== undefined && north !== undefined) {
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: FIT_PADDING, maxZoom: FIT_MAX_ZOOM },
      );
    }
  }, [map, west, south, east, north]);

  // Mapbox's stylesheet makes the container position: relative, so the box that fills the
  // parent has to be a separate element.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
