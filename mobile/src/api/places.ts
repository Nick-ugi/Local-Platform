import type { Category, LatLng, Page, PlaceDetail, PlaceSummary } from "@queenstown/shared";
import { apiGet } from "./client";
import { getDetail, queryString } from "./detail";

/** A public place, or null when there is none for the slug. */
export function getPlace(slug: string, options?: { signal?: AbortSignal }): Promise<PlaceDetail | null> {
  return getDetail<PlaceDetail>("places", slug, options);
}

/** What a list of places is narrowed and ordered by. Anything left out or null does not apply. */
export interface PlaceListQuery {
  category?: Category | null;
  /** Search words. */
  q?: string | null;
  /** Where "nearest" is measured from. Without it the list runs from the centre of Queenstown. */
  position?: LatLng | null;
  page?: number;
  /** Places a page; 20 unless given, at most 50. */
  size?: number;
}

/** How many decimals of a position are sent: about 11 m, enough to order places by distance. */
const POSITION_DECIMALS = 4;

/** One page of the public places, nearest first. Distances come only with a position. */
export function getPlaces(query: PlaceListQuery, options?: { signal?: AbortSignal }): Promise<Page<PlaceSummary>> {
  const search = queryString({
    category: query.category,
    q: query.q?.trim(),
    lat: query.position?.latitude.toFixed(POSITION_DECIMALS),
    lng: query.position?.longitude.toFixed(POSITION_DECIMALS),
    page: query.page !== undefined && query.page > 1 ? query.page : null,
    size: query.size,
  });
  return apiGet<Page<PlaceSummary>>(`/places${search}`, options);
}
