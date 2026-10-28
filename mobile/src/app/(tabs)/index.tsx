import { detailPath, MARKER_KINDS, normalizeQuery, type Selection } from "@queenstown/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapScreen } from "@/map/MapScreen";

type Params = { place?: string; event?: string; notice?: string; q?: string };

/** The place, event or notice the route names, as ?place=, ?event= or ?notice= ("View on map"). */
function targetOf(params: Params): Selection | null {
  for (const kind of MARKER_KINDS) {
    const slug = params[kind];
    if (typeof slug === "string" && slug !== "") {
      return { kind, slug };
    }
  }
  return null;
}

/**
 * The Map tab. The map runs under the status bar's area, so it starts below it. Search words in the
 * route (?q=, from "Show on map" on Search) show their results on the map.
 */
export default function MapTab() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const search = normalizeQuery(params.q) || null;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <MapScreen
        target={targetOf(params)}
        onTargetDone={() => router.setParams({ place: undefined, event: undefined, notice: undefined })}
        onOpenDetail={(marker) => router.push(detailPath(marker))}
        onSearch={() => router.push("/search")}
        search={search}
        onSearchClear={() => router.setParams({ q: undefined })}
      />
    </SafeAreaView>
  );
}
