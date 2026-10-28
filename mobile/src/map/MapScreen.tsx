import {
  boundsOf,
  categoryStyle,
  distanceMeters,
  FILTER_KEYS,
  type FilterKey,
  filterHides,
  formatDistance,
  keyOf,
  type MapBounds,
  type MapMarker,
  type Selection,
  toggleFilter,
} from "@queenstown/shared";
import { useEffect, useEffectEvent, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { LocationResult } from "@/geo/location";
import { type LocationProblem, useVisitorPosition } from "@/geo/VisitorPosition";
import { Chips } from "@/ui/Chips";
import { SearchBar } from "@/ui/SearchBar";
import { colors, TOUCH } from "@/ui/theme";
import { useSlow } from "@/ui/useSlow";
import { type Camera, DEFAULT_CAMERA, LOCATE_ZOOM, PLACE_ZOOM } from "./camera";
import { LocateButton } from "./LocateButton";
import { lookUp } from "./lookUp";
import { MapNotice } from "./MapNotice";
import { MapView } from "./MapView";
import { MarkerPreview } from "./MarkerPreview";
import { useMarkers } from "./useMarkers";
import { SEARCH_MARKERS, useSearchMarkers } from "./useSearchMarkers";

/** The message for each way of not getting a usable position (docs/03-user-flow.md, UF-01). */
const LOCATION_PROBLEMS = {
  outside: "outsideArea",
  denied: "locationDenied",
  unavailable: "locationUnavailable",
} as const;

type Props = {
  /** A place, event or notice to show, from "View on map" on a detail screen. */
  target: Selection | null;
  /** Called once the target has been dealt with, so the route can forget it. */
  onTargetDone: () => void;
  /** Opens the detail screen of a marker. */
  onOpenDetail: (marker: MapMarker) => void;
  /** Opens the Search screen. */
  onSearch: () => void;
  /** Search words whose results the map shows instead of its markers (SEARCH-03), or null. */
  search: string | null;
  /** Leaves the search results for the whole map. */
  onSearchClear: () => void;
};

/**
 * The Map tab (wireframe a-map, MAP-01 ~ MAP-08): the search box, the filter chips, the map with
 * its places, events and notices, the visitor's position, and the card of the selected marker.
 *
 * The app asks for the position when it starts (VisitorPositionProvider). With a position inside
 * the service area the map goes there; otherwise it stays on Queenstown and says why.
 *
 * The tab stays alive while detail screens open on top of it, so the filter, the selection and
 * the map's position are kept in the screen's state; the web app keeps them in its URL.
 */
export function MapScreen({ target, onTargetDone, onOpenDetail, onSearch, search, onSearchClear }: Props) {
  const t = useTranslations("Map");
  const tCategory = useTranslations("Category");
  const tPages = useTranslations("Pages");
  const tState = useTranslations("State");
  const tSearch = useTranslations("Search");
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [filter, setFilter] = useState<FilterKey[]>([]);
  // Search words put the map in a mode of their own: only the places that match, fitted on the
  // map, no chips and no markers by area.
  const results = useSearchMarkers(search);
  const area = useMarkers(search === null ? bounds : null, filter);
  const { status, markers, retry } = search === null ? area : results;
  const truncated = search === null ? area.truncated : results.total > SEARCH_MARKERS;
  const fit = search !== null && results.status === "ready" ? boundsOf(results.markers) : null;
  // A sleeping backend takes up to a minute to answer its first request (docs/07-deployment.md).
  const slow = useSlow(status === "loading");
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const { result, position, locating, request } = useVisitorPosition();
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

  // "View on map": the marker is selected and the map goes to it. One the map is not showing is
  // asked for on its own; one that has ended or has no location opens nothing.
  const show = useEffectEvent((wanted: Selection, done: () => void) => {
    // The visitor asked for one marker: the whole map, not the search results, shows it.
    if (search !== null) {
      onSearchClear();
    }
    const key = keyOf(wanted);
    const onMap = markers.find((marker) => keyOf(marker) === key);
    (onMap ? Promise.resolve(onMap) : lookUp(wanted)).then(
      (marker) => {
        if (marker !== null) {
          setSelected(marker);
          setCamera({ latitude: marker.latitude, longitude: marker.longitude, zoom: PLACE_ZOOM });
          // The visitor asked for this marker, so a filter that would hide it gives way.
          setFilter((current) => (filterHides(current, marker) ? [] : current));
        }
        done();
      },
      () => done(),
    );
  });
  const targetKey = target ? keyOf(target) : null;
  useEffect(() => {
    if (target !== null) {
      show(target, onTargetDone);
    }
    // A new target is a new key; the objects around it change on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  function select(key: string | null) {
    setSelected(key === null ? null : (markers.find((marker) => keyOf(marker) === key) ?? null));
  }

  function toggle(key: FilterKey) {
    const next = toggleFilter(filter, key);
    setFilter(next);
    if (selected !== null && filterHides(next, selected)) {
      setSelected(null);
    }
  }

  function label(key: FilterKey) {
    return key === "event" ? tPages("events") : key === "notice" ? tPages("notices") : tCategory(key);
  }

  // Without a map, Search still works.
  if (!token || unavailable) {
    return (
      <View style={styles.container}>
        <SearchBar onPress={onSearch} />
        <View style={styles.centred}>
          <Text style={styles.message}>{t("notConfigured")}</Text>
        </View>
      </View>
    );
  }

  const distanceText = position && selected ? formatDistance(distanceMeters(position, selected)) : null;
  const clearFilters = { label: t("clearFilters"), onPress: () => setFilter([]) };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <SearchBar onPress={onSearch} />
        {search !== null ? (
          <View style={styles.results}>
            <Text style={styles.resultsText} numberOfLines={1}>
              {t("searchResults", { q: search })}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tSearch("clear")}
              onPress={onSearchClear}
              style={styles.clear}
            >
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          </View>
        ) : (
          <Chips
          label={t("filters")}
          items={FILTER_KEYS.map((key) => ({
            key,
            label: label(key),
            selected: filter.includes(key),
            color: categoryStyle(key === "event" || key === "notice" ? key : { category: key, subtype: null }).color,
          }))}
          onPress={toggle}
          />
        )}
      </View>
      <View style={styles.mapArea}>
        <MapView
          token={token}
          camera={camera}
          markers={markers}
          selectedKey={selected ? keyOf(selected) : null}
          onSelect={select}
          showUserLocation={showUserLocation}
          onIdle={(box) => setBounds(box)}
          onGesture={() => setProblem(null)}
          onUnavailable={() => setUnavailable(true)}
          fit={fit}
        />
        <View accessibilityLiveRegion="polite" pointerEvents="box-none" style={styles.notices}>
          {status === "error" ? (
            <MapNotice text={t("loadFailed")} action={{ label: t("retry"), onPress: retry }} />
          ) : null}
          {slow ? <MapNotice text={tState("waking")} /> : null}
          {status === "ready" && markers.length === 0 ? (
            search === null ? (
              <MapNotice text={t("empty")} action={filter.length > 0 ? clearFilters : undefined} />
            ) : (
              <MapNotice text={tSearch("empty", { q: search })} />
            )
          ) : null}
          {status !== "error" && truncated ? (
            <MapNotice text={search === null ? t("truncated") : t("searchTruncated", { count: SEARCH_MARKERS })} />
          ) : null}
          {problem ? <MapNotice text={t(LOCATION_PROBLEMS[problem])} /> : null}
        </View>
        {/* The location button sits at the bottom right, above Mapbox's attribution or the card. */}
        <View pointerEvents="box-none" style={styles.bottom}>
          <View style={[styles.locate, selected === null && styles.locateAlone]}>
            <LocateButton onPress={() => void request()} busy={locating} />
          </View>
          {selected ? (
            <MarkerPreview
              marker={selected}
              distanceText={distanceText}
              onOpen={() => onOpenDetail(selected)}
              onClose={() => setSelected(null)}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  top: { backgroundColor: colors.paper },
  results: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 16, paddingRight: 8 },
  resultsText: { flex: 1, fontSize: 16, fontWeight: "600", color: colors.text },
  clear: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: 24, color: colors.muted },
  mapArea: { flex: 1 },
  centred: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  message: { fontSize: 16, color: colors.muted, textAlign: "center" },
  notices: { position: "absolute", top: 12, left: 16, right: 16, alignItems: "center", gap: 8 },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  locate: { alignSelf: "flex-end", marginRight: 16, marginBottom: 12 },
  locateAlone: { marginBottom: 40 },
});
