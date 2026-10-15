import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

/** More (wireframe m-more). About is the one item of the MVP. */
export default function MoreTab() {
  const t = useTranslations("Pages");

  return (
    <View style={styles.container}>
      <Link href="/about" asChild>
        <Pressable accessibilityRole="link" style={styles.row}>
          <Text style={styles.label}>{t("about")}</Text>
          <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no">
            ›
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#d4d4d4",
  },
  label: { fontSize: 16, fontWeight: "600" },
  chevron: { fontSize: 22, color: "#737373" },
});
