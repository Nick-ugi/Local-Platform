import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalScreen } from "@/local/LocalScreen";

/** The Local tab (APP-01). Like the Map and Explore, it starts below the status bar. */
export default function LocalTab() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#fff" }}>
      <LocalScreen onOpen={(path) => router.push(path)} />
    </SafeAreaView>
  );
}
