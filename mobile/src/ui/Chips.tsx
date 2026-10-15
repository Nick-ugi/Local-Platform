import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colors, TOUCH } from "./theme";

export type ChipItem<K extends string> = { key: K; label: string; selected: boolean };

type Props<K extends string> = {
  /** What the row of chips is for, for screen readers. */
  label: string;
  items: readonly ChipItem<K>[];
  onPress: (key: K) => void;
};

/**
 * A row of chips (wireframes a-map and a-explore) that stays on one line and scrolls sideways
 * where it does not fit. A selected chip is filled.
 */
export function Chips<K extends string>({ label, items, onPress }: Props<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={label}
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
          <Text style={[styles.text, item.selected && styles.selectedText]}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  chip: {
    minHeight: TOUCH,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: TOUCH / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  text: { fontSize: 14, fontWeight: "500", color: colors.text },
  selectedText: { color: colors.paper },
});
