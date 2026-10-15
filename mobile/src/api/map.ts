import type { MapBounds, MarkersResponse } from "@queenstown/shared";
import { apiGet } from "./client";

/**
 * The markers inside the box. An empty filter asks for every kind. The query is written out by
 * hand: React Native's URLSearchParams is not the browser's, and parts of it are missing.
 */
export function getMarkers(
  bounds: MapBounds,
  filter: readonly string[],
  options?: { signal?: AbortSignal },
): Promise<MarkersResponse> {
  const params: [string, string][] = [
    ["west", String(bounds.west)],
    ["south", String(bounds.south)],
    ["east", String(bounds.east)],
    ["north", String(bounds.north)],
  ];
  if (filter.length > 0) {
    params.push(["filter", filter.join(",")]);
  }
  const query = params.map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join("&");
  return apiGet<MarkersResponse>(`/map/markers?${query}`, options);
}
