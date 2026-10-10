import type { Category, FacilitySubtype, LatLng, MapMarker } from "@queenstown/shared";

// The API and the app's own types say latitude and longitude. GeoJSON and Mapbox want
// [longitude, latitude]. This file is the one place where the order is turned round.

export type LngLat = [longitude: number, latitude: number];

/** What the map's layers read from each marker. */
export interface MarkerProperties {
  slug: string;
  category: Category;
  subtype: FacilitySubtype | null;
  /** The letter drawn inside the marker until the categories get icons. */
  label: string;
}

interface PointFeature<P> {
  type: "Feature";
  geometry: { type: "Point"; coordinates: LngLat };
  properties: P;
}

interface PointCollection<P> {
  type: "FeatureCollection";
  features: PointFeature<P>[];
}

export type MarkerCollection = PointCollection<MarkerProperties>;
export type PositionCollection = PointCollection<Record<string, never>>;

// The wireframes mark a public facility with P.
const LABELS: Record<Category, string> = {
  food: "F",
  cafe: "C",
  bar: "B",
  activity: "A",
  shopping: "S",
  facility: "P",
};

export function toLngLat(position: LatLng): LngLat {
  return [position.longitude, position.latitude];
}

/** The markers as GeoJSON for the map. */
export function toFeatureCollection(markers: readonly MapMarker[]): MarkerCollection {
  return {
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: toLngLat(marker) },
      properties: {
        slug: marker.slug,
        category: marker.category,
        subtype: marker.subtype,
        label: LABELS[marker.category],
      },
    })),
  };
}

/** One position, such as the visitor's, as GeoJSON. No position is an empty collection. */
export function toPositionCollection(position: LatLng | null): PositionCollection {
  return {
    type: "FeatureCollection",
    features: position
      ? [{ type: "Feature", geometry: { type: "Point", coordinates: toLngLat(position) }, properties: {} }]
      : [],
  };
}
