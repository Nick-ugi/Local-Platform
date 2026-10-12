import type { Category, LatLng, Page, PlaceDetail, PlaceSummary } from "@queenstown/shared";
import { ApiError, apiGet } from "./client";

/**
 * A public place, or null when there is none for the slug. A slug the server refuses to parse
 * (status 400) cannot belong to a place either, so it is treated the same as 404.
 */
export async function getPlace(slug: string): Promise<PlaceDetail | null> {
  try {
    return await apiGet<PlaceDetail>(`/places/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

/** What a list of places is narrowed and ordered by. Anything left out or null does not apply. */
export interface PlaceListQuery {
  category?: Category | null;
  /** Search words. */
  q?: string | null;
  /** Where "nearest" is measured from. Without it the list runs from the centre of Queenstown. */
  position?: LatLng | null;
  page?: number;
  size?: number;
}

/** How many decimals of a position are sent: about 11 m, enough to order places by distance. */
const POSITION_DECIMALS = 4;

/** One page of the public places, nearest first. Distances come only with a position. */
export function getPlaces(query: PlaceListQuery, options?: { signal?: AbortSignal }): Promise<Page<PlaceSummary>> {
  const params = new URLSearchParams();
  if (query.category) {
    params.set("category", query.category);
  }
  const q = query.q?.trim();
  if (q) {
    params.set("q", q);
  }
  if (query.position) {
    params.set("lat", query.position.latitude.toFixed(POSITION_DECIMALS));
    params.set("lng", query.position.longitude.toFixed(POSITION_DECIMALS));
  }
  if (query.page !== undefined && query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.size !== undefined) {
    params.set("size", String(query.size));
  }
  const search = params.toString();
  return apiGet<Page<PlaceSummary>>(search ? `/places?${search}` : "/places", options);
}
