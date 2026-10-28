import type { NoticeSummary } from "@queenstown/shared";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/ui/theme";
import { NoticeBadges } from "./NoticeBadges";
import { useNoticePeriodText } from "./useNoticePeriod";

/** A notice in Local's list (wireframe m-notices): type and Official first, then the title and the period. */
export function NoticeRow({ notice, onPress }: { notice: NoticeSummary; onPress: () => void }) {
  const periodText = useNoticePeriodText();

  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.row}>
      <View style={styles.text}>
        <NoticeBadges type={notice.type} isOfficial={notice.isOfficial} />
        <Text style={styles.title}>{notice.title}</Text>
        <Text style={styles.line}>{periodText(notice.startsAt, notice.endsAt)}</Text>
      </View>
      <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no">
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  text: { flex: 1, gap: 4 },
  title: { fontSize: 17, fontWeight: "700", color: colors.text },
  line: { fontSize: 14, color: colors.muted },
  chevron: { fontSize: 22, color: colors.faint },
});
