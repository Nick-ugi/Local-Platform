import type { PlaceSummary } from './api'

/** How many of the nearest places a detail screen asks for, so some can be left out (PLACE-08). */
export const NEARBY_FETCH = 12

const NEARBY_LIMIT = 5
const NEARBY_MAX_M = 1000

/**
 * The places to show under "Nearby" on a place's detail: from a list ordered nearest first from
 * that place, the first five within a kilometre, leaving out the place itself and facilities
 * (toilets and parking are for the map, not for "what else is around here").
 */
export function pickNearby(places: readonly PlaceSummary[], from: { slug: string }): PlaceSummary[] {
  return places
    .filter(
      (place) =>
        place.slug !== from.slug &&
        place.category !== 'facility' &&
        place.distanceM !== null &&
        place.distanceM <= NEARBY_MAX_M,
    )
    .slice(0, NEARBY_LIMIT)
}
