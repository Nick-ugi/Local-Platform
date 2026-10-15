import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

/** The Map tab. The map itself arrives with Task 5 of the week 9 plan. */
export default function MapTab() {
  const t = useTranslations("Pages");

  return (
    <View style={styles.container}>
      <Text>{t("map")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
});
