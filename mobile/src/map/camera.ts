import { SERVICE_CENTER } from "@queenstown/shared";

/** Where the map looks: its centre and zoom. */
export interface Camera {
  latitude: number;
  longitude: number;
  zoom: number;
}

/** Queenstown, as the web app's map opens (MAP-01). */
export const DEFAULT_CAMERA: Camera = { ...SERVICE_CENTER, zoom: 14 };

/** How close the map goes when it moves to the visitor. */
export const LOCATE_ZOOM = 15;
