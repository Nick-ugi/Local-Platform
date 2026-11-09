import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { Icon } from "./Icon";
import { colors, TOUCH } from "./theme";

/**
 * The search box at the top of Map and Explore (wireframes a-map and a-explore). It looks like a
 * box to type in, and pressing it opens the Search screen, where the typing happens.
 */
export function SearchBar({ onPress }: { onPress: () => void }) {
  const t = useTranslations("Search");

  return (
    <Pressable accessibilityRole="search" accessibilityLabel={t("label")} onPress={onPress} style={styles.box}>
      <Icon name="search" size={18} color={colors.faint} />
      <Text style={styles.placeholder}>{t("label")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: TOUCH,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: TOUCH / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  placeholder: { fontSize: 16, color: colors.faint },
});
