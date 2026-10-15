import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, TOUCH } from "./theme";

type Action = { label: string; onPress: () => void };

/**
 * What a screen shows instead of its content (COMMON-02): a message with up to two things to do,
 * or a spinner while it loads.
 */
export function StateMessage({
  title,
  text,
  actions = [],
  loading = false,
}: {
  title?: string;
  text?: string;
  actions?: Action[];
  loading?: boolean;
}) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.box}>
      {loading ? <ActivityIndicator color={colors.muted} /> : null}
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable key={action.label} accessibilityRole="button" onPress={action.onPress} style={styles.button}>
              <Text style={styles.buttonText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" },
  text: { fontSize: 16, color: colors.muted, textAlign: "center" },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  button: {
    minHeight: TOUCH,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: colors.ink },
});
