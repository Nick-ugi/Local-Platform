import { CATEGORIES, type MapBounds } from "@queenstown/shared";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { LocationResult } from "@/geo/location";
import { type LocationProblem, useVisitorPosition } from "@/geo/VisitorPosition";
import { type Camera, DEFAULT_CAMERA, LOCATE_ZOOM } from "./camera";
import { LocateButton } from "./LocateButton";
import { MapNotice } from "./MapNotice";
import { MapView } from "./MapView";
import { useMarkers } from "./useMarkers";

/** The message for each way of not getting a usable position (docs/03-user-flow.md, UF-01). */
const LOCATION_PROBLEMS = {
  outside: "outsideArea",
  denied: "locationDenied",
  unavailable: "locationUnavailable",
} as const;

/**
 * Week 9 shows places only (MAP-03); events and notices come to the app with week 10. Naming the
 * categories leaves the other kinds out, as on the web's map with chips chosen.
 */
const PLACES_ONLY = [...CATEGORIES];

/**
 * The Map tab (wireframe a-map, MAP-01 ~ MAP-03): Queenstown on the map with the places in view,
 * the visitor's position and the button that brings the map back to it.
 *
 * The app asks for the position when it starts (VisitorPositionProvider). With a position inside
 * the service area the map goes there; otherwise it stays on Queenstown and says why.
 */
export function MapScreen() {
  const t = useTranslations("Map");
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { status, markers, truncated, retry } = useMarkers(bounds, PLACES_ONLY);
  const [unavailable, setUnavailable] = useState(false);
  const { result, locating, request } = useVisitorPosition();
  const [problem, setProblem] = useState<LocationProblem | null>(null);

  // Each answer from the phone, on arrival or from the button, is acted on once: inside the area
  // the map goes there, otherwise it stays and says why. The answer is compared while rendering,
  // so the move and the message come with the render that shows the new answer.
  const [handled, setHandled] = useState<LocationResult | null>(null);
  if (result !== handled) {
    setHandled(result);
    if (result?.status === "inside") {
      setProblem(null);
      setCamera({ ...result.position, zoom: LOCATE_ZOOM });
    } else {
      setProblem(result?.status ?? null);
    }
  }
  const showUserLocation = result?.status === "inside" || result?.status === "outside";

  if (!token || unavailable) {
    return (
      <View style={styles.centred}>
        <Text style={styles.message}>{t("notConfigured")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        token={token}
        camera={camera}
        markers={markers}
        showUserLocation={showUserLocation}
        onIdle={(box) => setBounds(box)}
        onGesture={() => setProblem(null)}
        onUnavailable={() => setUnavailable(true)}
      />
      <View accessibilityLiveRegion="polite" pointerEvents="box-none" style={styles.notices}>
        {status === "error" ? <MapNotice text={t("loadFailed")} action={{ label: t("retry"), onPress: retry }} /> : null}
        {status === "ready" && markers.length === 0 ? <MapNotice text={t("empty")} /> : null}
        {status !== "error" && truncated ? <MapNotice text={t("truncated")} /> : null}
        {problem ? <MapNotice text={t(LOCATION_PROBLEMS[problem])} /> : null}
      </View>
      {/* Bottom right, above Mapbox's attribution (wireframe a-map). */}
      <View style={styles.locate}>
        <LocateButton onPress={() => void request()} busy={locating} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  message: { fontSize: 16, color: "#525252", textAlign: "center" },
  notices: { position: "absolute", top: 12, left: 16, right: 16, alignItems: "center", gap: 8 },
  locate: { position: "absolute", right: 16, bottom: 40 },
});
