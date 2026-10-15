import { isInServiceArea, type LatLng } from "@queenstown/shared";
import * as Location from "expo-location";

/**
 * What asking for the visitor's position led to (docs/03-user-flow.md, UF-01). The same cases as
 * the web app: a position outside the service area is still a position, and the screen decides
 * not to move the map to it.
 */
export type LocationResult =
  | { status: "inside"; position: LatLng }
  | { status: "outside"; position: LatLng }
  | { status: "denied" }
  | { status: "unavailable" };

/**
 * Asks the phone where the visitor is. The first call shows the permission dialog; the app makes
 * it when it starts (docs/03-user-flow.md, "Web과 App의 차이"). Never rejects.
 */
export async function locate(): Promise<LocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { status: "denied" };
    }
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const position = { latitude: coords.latitude, longitude: coords.longitude };
    return { status: isInServiceArea(position) ? "inside" : "outside", position };
  } catch {
    // Location services are off, or no fix could be had.
    return { status: "unavailable" };
  }
}
