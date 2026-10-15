import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

/** The Explore tab. Its list of places arrives in week 10 (App Core). */
export default function ExploreTab() {
  const t = useTranslations("Explore");

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t("comingSoon")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  text: { fontSize: 16, color: "#525252", textAlign: "center" },
});
