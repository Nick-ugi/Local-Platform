import { MARKER_ICON_PIXEL_RATIO, type MarkerIcon, markerImageName } from "@queenstown/shared";
import type { ImageSourcePropType } from "react-native";

// The white pictures inside the markers (shared/src/map/markerIcon.ts), the same files as the web
// app's (mobile/assets/markers/README.md). Metro needs each file named in full.
const FILES: Record<MarkerIcon, ImageSourcePropType> = {
  food: require("../../assets/markers/food.png"),
  cafe: require("../../assets/markers/cafe.png"),
  bar: require("../../assets/markers/bar.png"),
  activity: require("../../assets/markers/activity.png"),
  shopping: require("../../assets/markers/shopping.png"),
  toilet: require("../../assets/markers/toilet.png"),
  parking: require("../../assets/markers/parking.png"),
  information: require("../../assets/markers/information.png"),
  library: require("../../assets/markers/library.png"),
  medical: require("../../assets/markers/medical.png"),
  facility: require("../../assets/markers/facility.png"),
  event: require("../../assets/markers/event.png"),
  notice: require("../../assets/markers/notice.png"),
};

/**
 * The pictures for the map's <Images>, by the names the markers give (markerImageName). The scale
 * says the files hold three pixels to a point, so each draws at 16 pt.
 */
export const MARKER_IMAGES = Object.fromEntries(
  (Object.keys(FILES) as MarkerIcon[]).map((icon) => [
    markerImageName(icon),
    { image: FILES[icon], scale: MARKER_ICON_PIXEL_RATIO },
  ]),
);
