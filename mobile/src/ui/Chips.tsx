import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { KindDot } from "./KindArt";
import { colors, TOUCH } from "./theme";

export type ChipItem<K extends string> = {
  key: K;
  label: string;
  selected: boolean;
  /** The colour of the kind the chip stands for, shown as a dot before its name. */
  color?: string;
};

type Props<K extends string> = {
  /** What the row of chips is for, for screen readers. */
  label: string;
  items: readonly ChipItem<K>[];
  onPress: (key: K) => void;
};

/**
 * A row of chips (wireframes a-map and a-explore) that stays on one line and scrolls sideways
 * where it does not fit. A selected chip is filled. A chip for a kind of place has a dot of its
 * colour, the colour of its markers on the map.
 */
export function Chips<K extends string>({ label, items, onPress }: Props<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={label}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {items.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityState={{ selected: item.selected }}
          onPress={() => onPress(item.key)}
          style={[styles.chip, item.selected && styles.selected]}
        >
          {item.color ? <KindDot color={item.color} /> : null}
          <Text style={[styles.text, item.selected && styles.selectedText]}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // A ScrollView grows to fill the screen's free space by default, which stretched the chips tall
  // above a short list. The row is only as tall as its chips.
  scroll: { flexGrow: 0 },
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: {
    minHeight: TOUCH,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: TOUCH / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { fontSize: 14, fontWeight: "500", color: colors.text },
  selectedText: { color: colors.paper },
});
