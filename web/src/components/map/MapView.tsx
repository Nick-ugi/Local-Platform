"use client";

import type { LatLng, MapBounds, MapMarker } from "@queenstown/shared";
import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MapboxMap,
  MapMouseEvent,
} from "mapbox-gl";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { toMapBounds, wrapLongitude } from "@/lib/map/bounds";
import type { Camera } from "@/lib/map/camera";
import { toFeatureCollection } from "@/lib/map/geojson";

type Props = {
  /** Mapbox public token. */
  token: string;
  /** Where the map looks when it is created. */
  camera: Camera;
  markers: readonly MapMarker[];
  selectedSlug: string | null;
  userLocation: LatLng | null;
  /** Called when the map has loaded and after every move, with the visible box. */
  onMove: (bounds: MapBounds, camera: Camera) => void;
  /** Called with the marker that was clicked, or null for a click on the map itself. */
  onSelect: (slug: string | null) => void;
  /** Called when no map can be shown: no WebGL, or Mapbox refused the token. */
  onUnavailable: () => void;
};

const STYLE = "mapbox://styles/mapbox/standard";

const SOURCE = "markers";
const CIRCLES = "marker-circles";
const SELECTED = "marker-selected";
const LABELS = "marker-labels";

const INK = "#171717";
const PAPER = "#ffffff";
const RADIUS_PX = 14;
/** A click this far outside a marker still counts, which makes the marker a 44 px target. */
const REACH_PX = 22 - RADIUS_PX;

/** Matches the selected marker only. No marker has an empty slug, so null matches none. */
function onlySlug(slug: string | null): FilterSpecification {
  return ["==", ["get", "slug"], slug ?? ""];
}

function labelColor(selectedSlug: string | null): ExpressionSpecification {
  return ["case", ["==", ["get", "slug"], selectedSlug ?? ""], PAPER, INK];
}

/**
 * One source and three layers: a circle per marker, a larger filled circle for the selected one
 * (wireframe m-map-place) and the category letter on top.
 */
function addMarkerLayers(map: MapboxMap) {
  map.addSource(SOURCE, { type: "geojson", data: toFeatureCollection([]) });
  map.addLayer({
    id: CIRCLES,
    type: "circle",
    source: SOURCE,
    paint: {
      "circle-radius": RADIUS_PX,
      "circle-color": PAPER,
      "circle-stroke-color": INK,
      "circle-stroke-width": 2,
      "circle-emissive-strength": 1,
    },
  });
  map.addLayer({
    id: SELECTED,
    type: "circle",
    source: SOURCE,
    filter: onlySlug(null),
    paint: {
      "circle-radius": RADIUS_PX + 6,
      "circle-color": INK,
      "circle-stroke-color": PAPER,
      "circle-stroke-width": 2,
      "circle-emissive-strength": 1,
    },
  });
  map.addLayer({
    id: LABELS,
    type: "symbol",
    source: SOURCE,
    layout: {
      "text-field": ["get", "label"],
      "text-size": 13,
      "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: { "text-color": labelColor(null), "text-emissive-strength": 1 },
  });
}

/** The slug of the marker at the pointer, or null when there is none within reach. */
function slugAt(map: MapboxMap, event: MapMouseEvent): string | null {
  const { x, y } = event.point;
  const found = map.queryRenderedFeatures(
    [
      [x - REACH_PX, y - REACH_PX],
      [x + REACH_PX, y + REACH_PX],
    ],
    { layers: [CIRCLES] },
  );
  const slug: unknown = found[0]?.properties?.slug;
  return typeof slug === "string" ? slug : null;
}

/** True for the answer Mapbox gives to a token it does not accept. */
function isRefusal(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * The map itself. This is the only file that touches mapbox-gl; everything that can be decided
 * without the SDK lives in lib/map. The SDK is imported inside an effect, so it is neither part
 * of the server render nor of the first script the browser loads.
 */
export function MapView({ token, camera, markers, selectedSlug, onMove, onSelect, onUnavailable }: Props) {
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
  const reportSelect = useEffectEvent((slug: string | null) => onSelect(slug));
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
          center: [startCamera.longitude, startCamera.latitude],
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
        addMarkerLayers(target);
        target.on("click", (event) => reportSelect(slugAt(target, event)));
        target.on("mousemove", (event) => {
          target.getCanvas().style.cursor = slugAt(target, event) === null ? "" : "pointer";
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
    };
  }, [token, startCamera]);

  useEffect(() => {
    map?.getSource<GeoJSONSource>(SOURCE)?.setData(toFeatureCollection(markers));
  }, [map, markers]);

  useEffect(() => {
    if (!map) {
      return;
    }
    map.setFilter(SELECTED, onlySlug(selectedSlug));
    map.setPaintProperty(LABELS, "text-color", labelColor(selectedSlug));
  }, [map, selectedSlug]);

  // Mapbox's stylesheet makes the container position: relative, so the box that fills the
  // parent has to be a separate element.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
