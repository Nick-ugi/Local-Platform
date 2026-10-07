import type { PlaceDetail } from "@queenstown/shared";
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
