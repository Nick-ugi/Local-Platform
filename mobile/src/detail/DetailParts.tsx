import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, TOUCH } from "@/ui/theme";

/** A labelled part of a detail screen (m-place, m-event, m-notice): a small heading over its content. */
export function DetailRow({ title, action, children }: { title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text accessibilityRole="header" style={styles.rowTitle}>
          {title}
        </Text>
        {children}
      </View>
      {action}
    </View>
  );
}

/** Body text of a detail screen. */
export function DetailText({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.text, muted && styles.muted]}>{children}</Text>;
}

/** A bordered button beside a row's content, such as "View on map". */
export function SideButton({ label, onPress, role = "button" }: { label: string; onPress: () => void; role?: "button" | "link" }) {
  return (
    <Pressable accessibilityRole={role} onPress={onPress} style={styles.side}>
      <Text style={styles.sideText}>{label}</Text>
    </Pressable>
  );
}

/** A full-width bordered button, such as Share at the end of an event or notice. */
export function WideButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.wide}>
      <Text style={styles.sideText}>{label}</Text>
    </Pressable>
  );
}

/** Says that the event or notice is over; its screen stays for the links that lead here. */
export function EndedNotice({ text }: { text: string }) {
  return <Text style={styles.ended}>{text}</Text>;
}

/** The line under the content: when it was last updated. */
export function UpdatedLine({ text }: { text: string }) {
  return <Text style={styles.updated}>{text}</Text>;
}

/** A short message after an action the phone could not do, such as opening a website. */
export function ActionProblem({ text }: { text: string | null }) {
  return (
    <View accessibilityLiveRegion="polite">{text ? <Text style={styles.problem}>{text}</Text> : null}</View>
  );
}

export const detailStyles = StyleSheet.create({
  scroll: { backgroundColor: colors.paper },
  content: { padding: 16, gap: 16 },
  image: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: colors.placeholder },
  title: { fontSize: 24, fontWeight: "700", color: colors.text },
  kind: { fontSize: 16, color: colors.muted },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingTop: 16,
  },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: colors.muted },
  text: { fontSize: 16, lineHeight: 24, color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  side: {
    minHeight: TOUCH,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  sideText: { fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: "center" },
  wide: {
    minHeight: TOUCH,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  ended: { backgroundColor: colors.fill, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontWeight: "600" },
  updated: {
    fontSize: 14,
    color: colors.faint,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    paddingTop: 16,
  },
  problem: { fontSize: 14, color: colors.text },
});
