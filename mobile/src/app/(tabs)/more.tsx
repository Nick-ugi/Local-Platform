import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { useAuth } from "@/auth/AuthProvider";
import { openWebsite, webUrl } from "@/links/actions";
import { Icon, type IconName } from "@/ui/Icon";
import { colors } from "@/ui/theme";

/** A row's icon and name. */
function Label({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.labelRow}>
      <Icon name={icon} size={22} color={colors.brand} />
      <Text style={styles.label}>{text}</Text>
    </View>
  );
}

function Chevron() {
  return <Icon name="chevron-forward" color={colors.faint} />;
}

/** Marks a row that leaves the app for the browser. */
function Outward() {
  return <Icon name="open-outline" color={colors.faint} />;
}

/**
 * More (wireframe m-more): About, then Log in or the account with Log out (USER-02), Favorites
 * (FAV-02), Delete account once signed in (Google Play), and the web app's Privacy Policy and Terms
 * of Use (MORE-03), which open in the browser.
 */
export default function MoreTab() {
  const t = useTranslations("Pages");
  const tAccount = useTranslations("Account");
  const auth = useAuth();
  const router = useRouter();
  const legal = [
    { label: t("privacy"), path: "/privacy", icon: "shield-checkmark-outline" as const },
    { label: t("terms"), path: "/terms", icon: "document-text-outline" as const },
  ];

  return (
    <View style={styles.container}>
      <Link href="/about" asChild>
        <Pressable accessibilityRole="link" style={styles.row}>
          <Label icon="information-circle-outline" text={t("about")} />
          <Chevron />
        </Pressable>
      </Link>
      {auth.status === "signedIn" ? (
        <View style={styles.row}>
          <Icon name="person-circle-outline" size={22} color={colors.brand} />
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
          <Label icon="log-in-outline" text={tAccount("login")} />
          <Chevron />
        </Pressable>
      )}
      <Link href="/favorites" asChild>
        <Pressable accessibilityRole="link" style={styles.row}>
          <Label icon="heart-outline" text={t("favorites")} />
          <Chevron />
        </Pressable>
      </Link>
      {auth.status === "signedIn" ? (
        <Link href="/delete-account" asChild>
          <Pressable accessibilityRole="link" style={styles.row}>
            <Label icon="trash-outline" text={t("deleteAccount")} />
            <Chevron />
          </Pressable>
        </Link>
      ) : null}
      {legal.map(({ label, path, icon }) => (
        <Pressable
          key={path}
          accessibilityRole="link"
          accessibilityHint={t("opensInBrowser")}
          onPress={() => void openWebsite(webUrl(path))}
          style={styles.row}
        >
          <Label icon={icon} text={label} />
          <Outward />
        </Pressable>
      ))}
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
  labelRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text },
  account: { flex: 1, fontSize: 16, color: colors.muted },
  action: { minHeight: 44, justifyContent: "center" },
  actionText: { fontSize: 16, fontWeight: "600", textDecorationLine: "underline", color: colors.text },
});
