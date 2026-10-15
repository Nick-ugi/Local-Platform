import { Pressable, StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

type Props = {
  onPress: () => void;
  /** True while the phone is finding the position. */
  busy: boolean;
};

/** The current location button (wireframe a-map): a ring with a dot. The screen decides where it sits. */
export function LocateButton({ onPress, busy }: Props) {
  const t = useTranslations("Map");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("locate")}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (busy || pressed) && styles.dimmed]}
    >
      <View style={styles.ring}>
        <View style={styles.dot} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#a3a3a3",
    elevation: 3,
  },
  dimmed: { opacity: 0.6 },
  ring: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0a0a0a" },
});
