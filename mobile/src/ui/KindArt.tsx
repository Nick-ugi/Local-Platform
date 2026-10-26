import { type KindStyle } from "@queenstown/shared";
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";

/**
 * What stands in for a missing photo: the kind's colour, lightly, with its picture in the middle
 * (shared/src/categoryStyle.ts). Decorative: the name next to it says what the place is. The web
 * app's placeholder (web/src/components/place/KindArt.tsx).
 */
export function KindPlaceholder({ look, style }: { look: KindStyle; style: StyleProp<ViewStyle> }) {
  return (
    <View
      testID="image-placeholder"
      aria-hidden
      // A tenth of the colour over white, so the picture stands out and the row stays light.
      style={[style, styles.placeholder, { backgroundColor: `${look.color}1a` }]}
    >
      <Text style={styles.emoji}>{look.emoji}</Text>
    </View>
  );
}

/** The small round mark of a kind's colour in a chip, matching its markers on the map. */
export function KindDot({ color }: { color: string }) {
  return <View testID="kind-dot" aria-hidden style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  placeholder: { alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 30 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
