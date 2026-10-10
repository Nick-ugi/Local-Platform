import type { MapBounds, MarkersResponse } from "@queenstown/shared";
import { apiGet } from "./client";

/** The markers inside the box. An empty filter asks for every kind. */
export function getMarkers(
  bounds: MapBounds,
  filter: readonly string[],
  options?: { signal?: AbortSignal },
): Promise<MarkersResponse> {
  const query = new URLSearchParams({
    west: String(bounds.west),
    south: String(bounds.south),
    east: String(bounds.east),
    north: String(bounds.north),
  });
  if (filter.length > 0) {
    query.set("filter", filter.join(","));
  }
  return apiGet<MarkersResponse>(`/map/markers?${query}`, options);
}
