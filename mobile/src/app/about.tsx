import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

/** About (MORE-01): the same words as the web app's About page. */
export default function AboutScreen() {
  const t = useTranslations("About");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {t("title")}
      </Text>
      <Text style={styles.body}>{t("intro")}</Text>
      <Text style={styles.body}>{t("audience")}</Text>
      <Text accessibilityRole="header" style={styles.heading}>
        {t("sourcesTitle")}
      </Text>
      {(["places", "events", "notices"] as const).map((key) => (
        <View key={key} style={styles.item}>
          <Text style={styles.body}>•</Text>
          <Text style={[styles.body, styles.itemText]}>{t(key)}</Text>
        </View>
      ))}
      <Text style={[styles.body, styles.note]}>{t("original")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700" },
  heading: { fontSize: 18, fontWeight: "700", paddingTop: 8 },
  body: { fontSize: 16, lineHeight: 24 },
  item: { flexDirection: "row", gap: 8 },
  itemText: { flex: 1 },
  note: { backgroundColor: "#f5f5f5", borderRadius: 8, padding: 12 },
});
