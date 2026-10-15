import type { Category, LatLng, Page, PlaceDetail, PlaceSummary } from "@queenstown/shared";
import { apiGet } from "./client";
import { getDetail } from "./detail";

/** A public place, or null when there is none for the slug. */
export function getPlace(slug: string): Promise<PlaceDetail | null> {
  return getDetail<PlaceDetail>("places", slug);
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
