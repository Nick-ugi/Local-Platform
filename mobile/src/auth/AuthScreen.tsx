import { ApiError } from "@queenstown/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import { colors, TOUCH } from "@/ui/theme";
import { useAuth } from "./AuthProvider";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
  /** Called once the visitor is signed in: back to where they came from. */
  onDone: () => void;
  /** Opens the other screen: Sign up from Log in and back. */
  onSwitch: () => void;
};

/**
 * Log in and Sign up (wireframe m-login, USER-01, USER-02): the same form, only the button and the
 * line under it change.
 */
export function AuthScreen({ mode, onDone, onSwitch }: Props) {
  const t = useTranslations("Account");
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ field: "email" | "password" | null; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await (mode === "login" ? auth.login : auth.signup)(email.trim(), password);
      onDone();
    } catch (cause) {
      setError(errorFor(cause));
      setBusy(false);
    }
  }

  function errorFor(cause: unknown): { field: "email" | "password" | null; text: string } {
    if (cause instanceof ApiError) {
      if (cause.code === "INVALID_CREDENTIALS") return { field: null, text: t("wrongCredentials") };
      if (cause.code === "EMAIL_ALREADY_USED") return { field: "email", text: t("emailUsed") };
      if (cause.code === "VALIDATION_FAILED") {
        return cause.errors[0]?.field === "password"
          ? { field: "password", text: t("shortPassword") }
          : { field: "email", text: t("invalidEmail") };
      }
    }
    return { field: null, text: t("failed") };
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.field}>
        <Text style={styles.label}>{t("email")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          accessibilityLabel={t("email")}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          style={[styles.input, error?.field === "email" && styles.invalid]}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t("password")}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          accessibilityLabel={t("password")}
          secureTextEntry
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onSubmitEditing={() => void submit()}
          style={[styles.input, error?.field === "password" && styles.invalid]}
        />
        {mode === "signup" ? <Text style={styles.hint}>{t("passwordHint")}</Text> : null}
      </View>
      <View accessibilityLiveRegion="polite">{error ? <Text style={styles.error}>{error.text}</Text> : null}</View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => void submit()}
        style={[styles.submit, busy && styles.busy]}
      >
        <Text style={styles.submitText}>{mode === "login" ? t("login") : t("signup")}</Text>
      </Pressable>
      <View style={styles.switchRow}>
        <Text style={styles.hint}>{mode === "login" ? t("newHere") : t("haveAccount")}</Text>
        <Pressable accessibilityRole="link" onPress={onSwitch} style={styles.switch}>
          <Text style={styles.switchText}>{mode === "login" ? t("createAccount") : t("login")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: colors.paper, flexGrow: 1 },
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
  invalid: { borderColor: "#b91c1c" },
  hint: { fontSize: 14, color: colors.muted },
  error: { fontSize: 14, color: "#b91c1c" },
  submit: { minHeight: 48, borderRadius: 8, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  busy: { opacity: 0.6 },
  submitText: { color: colors.paper, fontSize: 16, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  switch: { minHeight: TOUCH, justifyContent: "center" },
  switchText: { fontSize: 14, fontWeight: "600", color: colors.link },
});
