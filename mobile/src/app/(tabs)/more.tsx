import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { useAuth } from "@/auth/AuthProvider";
import { colors } from "@/ui/theme";

function Chevron() {
  return (
    <Text style={styles.chevron} accessibilityElementsHidden importantForAccessibility="no">
      ›
    </Text>
  );
}

/**
 * More (wireframe m-more): About, then Log in or the account with Log out (USER-02), and
 * Favorites (FAV-02).
 */
export default function MoreTab() {
  const t = useTranslations("Pages");
  const tAccount = useTranslations("Account");
  const auth = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Link href="/about" asChild>
        <Pressable accessibilityRole="link" style={styles.row}>
          <Text style={styles.label}>{t("about")}</Text>
          <Chevron />
        </Pressable>
      </Link>
      {auth.status === "signedIn" ? (
        <View style={styles.row}>
          <Text style={styles.account} numberOfLines={1}>
            {tAccount("signedInAs", { email: auth.user?.email ?? "" })}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => void auth.logout()} style={styles.action}>
            <Text style={styles.actionText}>{tAccount("logout")}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="link"
          disabled={auth.status === "checking"}
          onPress={() => router.push("/login")}
          style={styles.row}
        >
          <Text style={styles.label}>{tAccount("login")}</Text>
          <Chevron />
        </Pressable>
      )}
      <Link href="/favorites" asChild>
        <Pressable accessibilityRole="link" style={styles.row}>
          <Text style={styles.label}>{t("favorites")}</Text>
          <Chevron />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  label: { fontSize: 16, fontWeight: "600", color: colors.text },
  account: { flex: 1, fontSize: 16, color: colors.muted },
  action: { minHeight: 44, justifyContent: "center" },
  actionText: { fontSize: 16, fontWeight: "600", textDecorationLine: "underline", color: colors.text },
  chevron: { fontSize: 22, color: colors.faint },
});
