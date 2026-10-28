import { categoryStyle, type EventSummary, formatEventWhen } from "@queenstown/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KindPlaceholder } from "@/ui/KindArt";
import { PlaceImage } from "@/ui/PlaceImage";
import { colors } from "@/ui/theme";

/** An event in Local's list (wireframe m-events): picture, title, when it is on, where. */
export function EventRow({ event, onPress }: { event: EventSummary; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.row}>
      {/* The title is right beside the picture, so the picture itself says nothing more. */}
      <PlaceImage
        url={event.imageUrl}
        label=""
        style={styles.image}
        fallback={<KindPlaceholder look={categoryStyle("event")} style={styles.image} />}
      />
      <View style={styles.text}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.line}>{formatEventWhen(event.startsAt, event.endsAt)}</Text>
        <Text style={styles.line}>{event.venueName}</Text>
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
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  line: { fontSize: 14, color: colors.muted },
});
