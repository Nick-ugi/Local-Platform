import { detailPath, MARKER_KINDS, type Selection } from "@queenstown/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapScreen } from "@/map/MapScreen";

type Params = { place?: string; event?: string; notice?: string };

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

/** The Map tab. The map runs under the status bar's area, so it starts below it. */
export default function MapTab() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <MapScreen
        target={targetOf(params)}
        onTargetDone={() => router.setParams({ place: undefined, event: undefined, notice: undefined })}
        onOpenDetail={(marker) => router.push(detailPath(marker))}
        onSearch={() => router.push("/search")}
      />
    </SafeAreaView>
  );
}
