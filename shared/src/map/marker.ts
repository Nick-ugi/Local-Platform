import type { PlaceMarker, PlaceSummary } from '../api'

/** A place from a list as a marker on the map, as GET /map/markers would give it (search results). */
export function placeMarkerOf(place: PlaceSummary): PlaceMarker {
  const { slug, latitude, longitude, name, category, subtype, openingHours } = place
  return { kind: 'place', slug, latitude, longitude, name, category, subtype, openingHours }
}
