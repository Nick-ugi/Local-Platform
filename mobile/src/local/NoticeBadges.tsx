import type { NoticeType } from "@queenstown/shared";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { colors } from "@/ui/theme";

/** The type of a notice and, for one from an official source, "Official" (NOTICE-02). */
export function NoticeBadges({ type, isOfficial }: { type: NoticeType; isOfficial: boolean }) {
  const t = useTranslations("Local");
  const tType = useTranslations("NoticeType");

  return (
    <View style={styles.row}>
      <Text style={styles.type}>{tType(type)}</Text>
      {isOfficial ? <Text style={styles.official}>{t("official")}</Text> : null}
    </View>
  );
}

const badge = { fontSize: 12, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 } as const;

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  type: { ...badge, borderWidth: 1, borderColor: colors.faint, color: colors.text },
  official: { ...badge, backgroundColor: colors.text, color: colors.paper, overflow: "hidden" },
});
