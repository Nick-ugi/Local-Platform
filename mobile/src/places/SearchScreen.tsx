import { MAX_QUERY_LENGTH, normalizeQuery, type PlaceSummary } from "@queenstown/shared";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslations } from "use-intl";
import { StateMessage } from "@/ui/StateMessage";
import { colors, TOUCH } from "@/ui/theme";
import { PlaceList } from "./PlaceList";

type Props = {
  /** The search words the route names, already normalised, or "" before a search. */
  q: string;
  /** Called with new search words, normalised and not empty. */
  onSubmit: (q: string) => void;
  onOpen: (place: PlaceSummary) => void;
  onExplore: () => void;
  /** Shows the results on the map (SEARCH-03). */
  onShowOnMap: (q: string) => void;
};

/**
 * Search (SEARCH-01 ~ SEARCH-02, wireframe m-search): a box to type in at the top, then how many
 * places match and the places, nearest first. When nothing matches it says so and points to
 * Explore.
 */
export function SearchScreen({ q, onSubmit, onOpen, onExplore, onShowOnMap }: Props) {
  const t = useTranslations("Search");
  const tState = useTranslations("State");
  const [value, setValue] = useState(q);
  const input = useRef<TextInput>(null);

  function submit() {
    const words = normalizeQuery(value);
    // Nothing to look for: stay on the screen.
    if (words !== "") {
      onSubmit(words);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <TextInput
          ref={input}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          placeholder={t("label")}
          accessibilityLabel={t("label")}
          maxLength={MAX_QUERY_LENGTH}
          returnKeyType="search"
          autoFocus={q === ""}
          autoCorrect={false}
          style={styles.input}
        />
        {value !== "" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("clear")}
            onPress={() => {
              setValue("");
              input.current?.focus();
            }}
            style={styles.clear}
          >
            <Text style={styles.clearText}>×</Text>
          </Pressable>
        ) : null}
      </View>
      {q === "" ? (
        <StateMessage text={t("hint")} />
      ) : (
        <PlaceList
          query={{ category: null, q }}
          countText={(count) => t("count", { count })}
          countAction={
            <Pressable accessibilityRole="button" onPress={() => onShowOnMap(q)} style={styles.showOnMap}>
              <Text style={styles.showOnMapText}>{t("showOnMap")}</Text>
            </Pressable>
          }
          empty={
            <StateMessage
              text={t("empty", { q })}
              actions={[{ label: tState("goToExplore"), onPress: onExplore }]}
            />
          }
          onOpen={onOpen}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  box: {
    minHeight: TOUCH,
    margin: 16,
    marginBottom: 8,
    paddingLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: TOUCH / 2,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 8 },
  clear: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: 20, color: colors.muted },
  showOnMap: { minHeight: TOUCH, justifyContent: "center", paddingHorizontal: 8, paddingTop: 8 },
  showOnMapText: { fontSize: 14, fontWeight: "600", color: colors.text, textDecorationLine: "underline" },
});
