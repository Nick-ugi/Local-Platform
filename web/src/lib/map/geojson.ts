import type { Category, FacilitySubtype, MapMarker } from "@queenstown/shared";

/** What the map's layers read from each marker. */
export interface MarkerProperties {
  slug: string;
  category: Category;
  subtype: FacilitySubtype | null;
  /** The letter drawn inside the marker until the categories get icons. */
  label: string;
}

export interface MarkerFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [longitude: number, latitude: number] };
  properties: MarkerProperties;
}

export interface MarkerCollection {
  type: "FeatureCollection";
  features: MarkerFeature[];
}

// The wireframes mark a public facility with P.
const LABELS: Record<Category, string> = {
  food: "F",
  cafe: "C",
  bar: "B",
  activity: "A",
  shopping: "S",
  facility: "P",
};

/**
 * The markers as GeoJSON for the map. This is the one place where the API's latitude and
 * longitude become GeoJSON's [longitude, latitude].
 */
export function toFeatureCollection(markers: readonly MapMarker[]): MarkerCollection {
  return {
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [marker.longitude, marker.latitude] },
      properties: {
        slug: marker.slug,
        category: marker.category,
        subtype: marker.subtype,
        label: LABELS[marker.category],
      },
    })),
  };
}
