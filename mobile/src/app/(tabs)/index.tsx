import { SafeAreaView } from "react-native-safe-area-context";
import { MapScreen } from "@/map/MapScreen";

/** The Map tab. The map runs under the status bar's area, so it starts below it. */
export default function MapTab() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <MapScreen />
    </SafeAreaView>
  );
}
