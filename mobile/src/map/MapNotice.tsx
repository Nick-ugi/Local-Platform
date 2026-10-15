import { Pressable, StyleSheet, Text, View } from "react-native";

type Action = { label: string; onPress: () => void };

/** A short message laid over the map, with at most one thing to do about it. */
export function MapNotice({ text, action }: { text: string; action?: Action }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.text}>{text}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.action} hitSlop={8}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "100%",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: { flexShrink: 1, paddingVertical: 8, fontSize: 14 },
  action: { minHeight: 44, justifyContent: "center" },
  actionText: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
