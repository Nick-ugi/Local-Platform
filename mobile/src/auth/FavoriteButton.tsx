import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { colors, TOUCH } from "@/ui/theme";
import { useAuth } from "./AuthProvider";
import { getFavorites, removeFavorite, saveFavorite } from "./session";

type State = "loading" | "signedOut" | "saved" | "notSaved";

/**
 * The heart of a place (wireframe m-place, FAV-01). A visitor who is not signed in goes to Log in;
 * once they are back, signed in, the place is saved (m-login, 1).
 */
export function FavoriteButton({ slug, onNeedLogin }: { slug: string; onNeedLogin: () => void }) {
  const t = useTranslations("Favorites");
  const auth = useAuth();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const signedIn = auth.status === "signedIn";
  const pending = auth.pendingFavorite === slug;
  const { setPendingFavorite } = auth;

  // Read when the visitor arrives signed in; clearing it must not ask for the favorites again.
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  });

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    let gone = false;
    const pending = pendingRef.current;
    getFavorites().then(
      async (favorites) => {
        const isSaved = favorites.items.some((place) => place.slug === slug);
        // Back from Log in to save this place: finish what the visitor started.
        if (pending && !isSaved) {
          setPendingFavorite(null);
          try {
            await saveFavorite(slug);
            if (!gone) setSaved(true);
          } catch {
            if (!gone) {
              setSaved(false);
              setFailed(true);
            }
          }
          return;
        }
        if (pending) setPendingFavorite(null);
        if (!gone) setSaved(isSaved);
      },
      () => !gone && setSaved(false),
    );
    return () => {
      gone = true;
    };
  }, [signedIn, slug, setPendingFavorite]);

  const state: State =
    auth.status === "checking" ? "loading" : !signedIn ? "signedOut" : saved === null ? "loading" : saved ? "saved" : "notSaved";

  async function press() {
    if (state === "signedOut") {
      setPendingFavorite(slug);
      onNeedLogin();
      return;
    }
    const saving = state === "notSaved";
    setFailed(false);
    setSaved(saving);
    try {
      await (saving ? saveFavorite(slug) : removeFavorite(slug));
    } catch {
      setSaved(!saving);
      setFailed(true);
    }
  }

  return (
    <View style={styles.box}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={state === "saved" ? t("saved") : t("save")}
        accessibilityState={{ selected: state === "saved", disabled: state === "loading" }}
        disabled={state === "loading"}
        onPress={() => void press()}
        style={[styles.button, state === "loading" && styles.dim]}
      >
        <Text style={styles.heart}>{state === "saved" ? "♥" : "♡"}</Text>
      </Pressable>
      {failed ? <Text style={styles.error}>{t("saveFailed")}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "flex-end" },
  button: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  dim: { opacity: 0.4 },
  heart: { fontSize: 26, color: colors.ink },
  error: { fontSize: 12, color: "#b91c1c", maxWidth: 200, textAlign: "right" },
});
