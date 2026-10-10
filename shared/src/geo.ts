export interface LatLng {
  latitude: number
  longitude: number
}

/** Queenstown centre: the reference point when a request carries no location. */
export const SERVICE_CENTER = { latitude: -45.0312, longitude: 168.6626 } as const

/** A position farther than this from the centre is outside the service area. */
export const SERVICE_RADIUS_KM = 50

const EARTH_RADIUS_M = 6_371_008.8

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** The distance between two positions over the surface of a sphere (haversine), in metres. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function isInServiceArea(point: LatLng): boolean {
  return distanceMeters(SERVICE_CENTER, point) <= SERVICE_RADIUS_KM * 1000
}

/**
 * A distance for display: to the nearest 10 m below 1 km ("350 m"), with one decimal below 10 km
 * ("1.2 km"), and in whole kilometres from there ("12 km").
 */
export function formatDistance(meters: number): string {
  // Each step rounds first and then picks the unit, so 995 m reads "1.0 km" and never "1000 m".
  const tens = Math.round(meters / 10) * 10
  if (tens < 1000) {
    return `${tens} m`
  }
  const tenthsOfKm = Math.round(meters / 100) / 10
  if (tenthsOfKm < 10) {
    return `${tenthsOfKm.toFixed(1)} km`
  }
  return `${Math.round(meters / 1000)} km`
}
