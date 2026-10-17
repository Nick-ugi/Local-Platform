import type { PlaceSummary } from "@queenstown/shared";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { PlaceRow } from "@/places/PlaceRow";
import { StateMessage } from "@/ui/StateMessage";
import { colors, TOUCH } from "@/ui/theme";
import { useAuth } from "./AuthProvider";
import { getFavorites, removeFavorite } from "./session";

type Props = {
  onOpen: (place: PlaceSummary) => void;
  onLogin: () => void;
  onExplore: () => void;
};

/**
 * Favorites (wireframe m-favorites, FAV-02): the saved places as Explore's rows, most recently
 * saved first. The heart removes a place. With none saved it points to Explore.
 */
export function FavoritesScreen({ onOpen, onLogin, onExplore }: Props) {
  const t = useTranslations("Favorites");
  const tAccount = useTranslations("Account");
  const tState = useTranslations("State");
  const auth = useAuth();
  const [items, setItems] = useState<PlaceSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const signedIn = auth.status === "signedIn";

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    let gone = false;
    getFavorites().then(
      (favorites) => {
        if (!gone) {
          setItems(favorites.items);
          setFailed(false);
        }
      },
      () => !gone && setFailed(true),
    );
    return () => {
      gone = true;
    };
  }, [signedIn, attempt]);

  async function remove(place: PlaceSummary) {
    const before = items ?? [];
    setItems(before.filter((item) => item.slug !== place.slug));
    try {
      await removeFavorite(place.slug);
    } catch {
      setItems(before);
    }
  }

  if (auth.status === "checking") {
    return <StateMessage loading />;
  }
  if (!signedIn) {
    return <StateMessage text={t("loginToSee")} actions={[{ label: tAccount("login"), onPress: onLogin }]} />;
  }
  if (failed) {
    return (
      <StateMessage text={t("loadFailed")} actions={[{ label: t("retry"), onPress: () => setAttempt((n) => n + 1) }]} />
    );
  }
  if (items === null) {
    return <StateMessage loading />;
  }
  if (items.length === 0) {
    return <StateMessage text={t("empty")} actions={[{ label: tState("goToExplore"), onPress: onExplore }]} />;
  }
  return (
    <FlatList
      data={items}
      keyExtractor={(place) => place.slug}
      style={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.place}>
            <PlaceRow place={item} onPress={() => onOpen(item)} />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("remove", { name: item.name })}
            onPress={() => void remove(item)}
            style={styles.heart}
          >
            <Text style={styles.heartText}>♥</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.paper },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.paper },
  place: { flex: 1 },
  heart: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center", marginRight: 8 },
  heartText: { fontSize: 24, color: colors.ink },
});
