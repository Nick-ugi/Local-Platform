import { categoryStyle } from "@queenstown/shared";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { KindDot } from "@/ui/KindArt";
import { colors, TOUCH } from "@/ui/theme";
import { clearRecentPlaces, loadRecentPlaces, type RecentPlace } from "./recentPlaces";

/**
 * "Recently viewed" on Search before a search: the places the visitor opened lately, latest first,
 * to open again, and Clear to forget them. Nothing when there are none.
 */
export function RecentlyViewed({ onOpen }: { onOpen: (place: RecentPlace) => void }) {
  const t = useTranslations("Search");
  const tCategory = useTranslations("Category");
  const [places, setPlaces] = useState<RecentPlace[]>([]);

  useEffect(() => {
    let live = true;
    void loadRecentPlaces().then((list) => {
      if (live && list.length > 0) {
        setPlaces(list);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  if (places.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title}>
          {t("recent")}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setPlaces([]);
            void clearRecentPlaces();
          }}
          style={styles.clear}
        >
          <Text style={styles.clearText}>{t("clearRecent")}</Text>
        </Pressable>
      </View>
      {places.map((place) => (
        <Pressable key={place.slug} accessibilityRole="link" onPress={() => onOpen(place)} style={styles.row}>
          <KindDot color={categoryStyle(place).color} />
          <View style={styles.text}>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.kind}>{tCategory(place.category)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted },
  clear: { minHeight: TOUCH, justifyContent: "center", paddingHorizontal: 8 },
  clearText: { fontSize: 14, fontWeight: "600", color: colors.text, textDecorationLine: "underline" },
  row: {
    minHeight: TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: colors.text },
  kind: { fontSize: 14, color: colors.muted },
});
