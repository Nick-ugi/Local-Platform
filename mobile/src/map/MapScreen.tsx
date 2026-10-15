import { CATEGORIES, type MapBounds } from "@queenstown/shared";
import { useEffect, useEffectEvent, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { type LocationResult, locate } from "@/geo/location";
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

type LocationProblem = keyof typeof LOCATION_PROBLEMS;

/**
 * Week 9 shows places only (MAP-03); events and notices come to the app with week 10. Naming the
 * categories leaves the other kinds out, as on the web's map with chips chosen.
 */
const PLACES_ONLY = [...CATEGORIES];

/**
 * The Map tab (wireframe a-map, MAP-01 ~ MAP-03): Queenstown on the map with the places in view,
 * the visitor's position and the button that brings the map back to it.
 *
 * The app asks for the position as soon as the screen opens. With a position inside the service
 * area the map goes there; otherwise it stays on Queenstown and says why.
 */
export function MapScreen() {
  const t = useTranslations("Map");
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { status, markers, truncated, retry } = useMarkers(bounds, PLACES_ONLY);
  const [unavailable, setUnavailable] = useState(false);
  const [showUserLocation, setShowUserLocation] = useState(false);
  // The position is asked for as soon as the screen opens, so it starts out busy.
  const [locating, setLocating] = useState(true);
  const [problem, setProblem] = useState<LocationProblem | null>(null);

  function show(result: LocationResult) {
    setLocating(false);
    if (result.status === "inside" || result.status === "outside") {
      setShowUserLocation(true);
    }
    if (result.status === "inside") {
      setProblem(null);
      setCamera({ ...result.position, zoom: LOCATE_ZOOM });
    } else {
      setProblem(result.status);
    }
  }

  async function showLocation() {
    setLocating(true);
    show(await locate());
  }

  const showOnArrival = useEffectEvent(show);
  useEffect(() => {
    let gone = false;
    void locate().then((result) => {
      if (!gone) {
        showOnArrival(result);
      }
    });
    return () => {
      gone = true;
    };
  }, []);

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
        <LocateButton onPress={() => void showLocation()} busy={locating} />
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
