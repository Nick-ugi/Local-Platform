import { isInServiceArea, type LatLng } from "@queenstown/shared";

/**
 * What asking for the visitor's position led to (docs/03-user-flow.md, UF-01). A position outside
 * the service area is still a position; the screen decides not to move the map to it.
 */
export type LocationResult =
  | { status: "inside"; position: LatLng }
  | { status: "outside"; position: LatLng }
  | { status: "denied" }
  | { status: "unavailable" };

/** GeolocationPositionError.PERMISSION_DENIED */
const PERMISSION_DENIED = 1;

/**
 * Asks the browser where the visitor is. The first call makes the browser ask for permission, so
 * the Map screen calls this from the location button and not on arrival. Never rejects.
 */
export function locate(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ status: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { latitude: coords.latitude, longitude: coords.longitude };
        resolve({ status: isInServiceArea(position) ? "inside" : "outside", position });
      },
      (error) => resolve({ status: error.code === PERMISSION_DENIED ? "denied" : "unavailable" }),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

/**
 * True when the visitor allowed this site to read their position on an earlier visit, in which
 * case locate() answers without the browser asking. Browsers that cannot tell count as "no".
 */
export async function wasLocationGranted(): Promise<boolean> {
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state === "granted";
  } catch {
    return false;
  }
}
