import { ApiError } from "@queenstown/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import { colors, TOUCH } from "@/ui/theme";
import { useAuth } from "./AuthProvider";

const DANGER = "#b91c1c";

type Props = {
  /** Leaves the screen once the account is gone. */
  onDone: () => void;
  /** Opens Log in, for a visitor who is not signed in. */
  onLogin: () => void;
};

/**
 * Deleting one's own account in the app (Google Play asks apps with sign up for this): what goes,
 * the password again, and a confirmation. The web has the same at /account/delete.
 */
export function DeleteAccountScreen({ onDone, onLogin }: Props) {
  const t = useTranslations("Account");
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  async function submit() {
    if (password === "" || busy) {
      return;
    }
    setBusy(true);
    setProblem(null);
    try {
      await auth.deleteAccount(password);
      setDeleted(true);
    } catch (cause) {
      const code = cause instanceof ApiError ? cause.code : null;
      setProblem(
        code === "WRONG_PASSWORD" ? t("wrongPassword") : code === "TOO_MANY_REQUESTS" ? t("tooMany") : t("deleteFailed"),
      );
    } finally {
      setBusy(false);
    }
  }

  if (deleted) {
    return (
      <View style={styles.container}>
        <Text accessibilityRole="header" style={styles.title}>
          {t("deleted")}
        </Text>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.primary}>
          <Text style={styles.primaryText}>{t("done")}</Text>
        </Pressable>
      </View>
    );
  }
  if (auth.status !== "signedIn" || auth.user === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>{t("deleteLogin")}</Text>
        <Pressable
          accessibilityRole="button"
          disabled={auth.status === "checking"}
          onPress={onLogin}
          style={styles.primary}
        >
          <Text style={styles.primaryText}>{t("login")}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.body}>{t("deleteBody", { email: auth.user.email })}</Text>
      <View style={styles.field}>
        <Text style={styles.label}>{t("password")}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          accessibilityLabel={t("password")}
          secureTextEntry
          autoComplete="current-password"
          onSubmitEditing={() => void submit()}
          style={[styles.input, problem !== null && styles.invalid]}
        />
      </View>
      <View accessibilityLiveRegion="polite">{problem ? <Text style={styles.error}>{problem}</Text> : null}</View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy || password === "" }}
        disabled={busy || password === ""}
        onPress={() => void submit()}
        style={[styles.danger, (busy || password === "") && styles.dim]}
      >
        <Text style={styles.primaryText}>{t("deleteConfirm")}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: colors.paper, flexGrow: 1 },
  title: { fontSize: 18, fontWeight: "700", color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 22 },
  field: { gap: 6 },
  label: { fontSize: 16, fontWeight: "600", color: colors.text },
  input: {
    minHeight: TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  invalid: { borderColor: DANGER },
  error: { fontSize: 14, color: DANGER },
  primary: { minHeight: 48, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  danger: { minHeight: 48, borderRadius: 8, backgroundColor: DANGER, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.6 },
  primaryText: { color: colors.paper, fontSize: 16, fontWeight: "600" },
});
