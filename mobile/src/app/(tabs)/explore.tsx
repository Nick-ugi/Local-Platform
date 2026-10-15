import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExploreScreen } from "@/places/ExploreScreen";

/** The Explore tab. Like the Map, it starts below the status bar and has no header of its own. */
export default function ExploreTab() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      <ExploreScreen
        onOpen={(place) => router.push(`/places/${encodeURIComponent(place.slug)}`)}
        onSearch={() => router.push("/search")}
      />
    </SafeAreaView>
  );
}
