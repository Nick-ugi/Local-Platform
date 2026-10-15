import type { MapBounds } from '../api'

/** The same longitude within -180 (included) to 180 (not included). */
export function wrapLongitude(longitude: number): number {
  if (longitude >= -180 && longitude < 180) {
    return longitude
  }
  return ((((longitude + 180) % 360) + 360) % 360) - 180
}

/**
 * Turns the box a map reports into one the API accepts, or null when there is no area to ask
 * about. A map dragged round the world reports longitudes beyond 180, and one zoomed far out a
 * box wider than the world; the API rejects both.
 */
export function toMapBounds(west: number, south: number, east: number, north: number): MapBounds | null {
  if (![west, south, east, north].every(Number.isFinite)) {
    return null
  }
  const bottom = Math.max(south, -90)
  const top = Math.min(north, 90)
  const width = east - west
  if (width <= 0 || bottom >= top) {
    return null
  }
  if (width >= 360) {
    return { west: -180, south: bottom, east: 180, north: top }
  }

  const left = wrapLongitude(west)
  const right = left === west ? east : left + width
  // The part beyond the antimeridian is left out. Queenstown is at 168 degrees east.
  return { west: left, south: bottom, east: Math.min(right, 180), north: top }
}
