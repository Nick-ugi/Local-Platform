import { formatDistance, type PlaceSummary } from "@queenstown/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { PlaceImage } from "@/ui/PlaceImage";
import { colors } from "@/ui/theme";

/**
 * A place in a list (wireframe a-explore): picture, name, category with the distance, address. The
 * whole row opens the detail screen. The distance is there only when the list was ordered from the
 * visitor's position.
 */
export function PlaceRow({ place, onPress }: { place: PlaceSummary; onPress: () => void }) {
  const tCategory = useTranslations("Category");
  const kind =
    place.distanceM !== null
      ? `${tCategory(place.category)} · ${formatDistance(place.distanceM)}`
      : tCategory(place.category);

  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.row}>
      {/* The name is right beside the picture, so the picture itself says nothing more. */}
      <PlaceImage url={place.imageUrl} label="" style={styles.image} placeholderStyle={styles.image} />
      <View style={styles.text}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.line}>{kind}</Text>
        <Text style={styles.line}>{place.address}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  image: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.placeholder },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  line: { fontSize: 14, color: colors.muted },
});
