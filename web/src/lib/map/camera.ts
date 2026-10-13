import { SERVICE_CENTER } from "@queenstown/shared";

/** Where the map looks: its centre and zoom. */
export interface Camera {
  latitude: number;
  longitude: number;
  zoom: number;
}

export const DEFAULT_CAMERA: Camera = {
  latitude: SERVICE_CENTER.latitude,
  longitude: SERVICE_CENTER.longitude,
  zoom: 14,
};

const STORAGE_KEY = "map.camera";
const MAX_ZOOM = 22;

function isNumberWithin(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && value >= min && value <= max;
}

function isCamera(value: unknown): value is Camera {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { latitude, longitude, zoom } = value as Record<string, unknown>;
  return isNumberWithin(latitude, -90, 90) && isNumberWithin(longitude, -180, 180) && isNumberWithin(zoom, 0, MAX_ZOOM);
}

/**
 * The position the map had earlier in this tab, so that coming back from a detail page shows the
 * same place. Without a usable stored value it is Queenstown.
 */
export function loadCamera(): Camera {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (isCamera(stored)) {
      return { latitude: stored.latitude, longitude: stored.longitude, zoom: stored.zoom };
    }
  } catch {
    // No storage (on the server, or blocked by the browser) or a value that is not JSON.
  }
  return DEFAULT_CAMERA;
}

export function saveCamera(camera: Camera): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(camera));
  } catch {
    // Remembering the position is a convenience; the map works without it.
  }
}

/** How close the map goes when it opens on one place. */
export const PLACE_ZOOM = 16;

/**
 * True when the map has been positioned earlier in this tab: by the visitor moving it, or by a
 * "View on map" link saving where it should open.
 */
export function hasSavedCamera(): boolean {
  try {
    return isCamera(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return false;
  }
}
