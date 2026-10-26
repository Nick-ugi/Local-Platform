import { CATEGORIES, type Category, categoryStyle, type PlaceSummary } from "@queenstown/shared";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { Chips } from "@/ui/Chips";
import { SearchBar } from "@/ui/SearchBar";
import { StateMessage } from "@/ui/StateMessage";
import { colors } from "@/ui/theme";
import { PlaceList } from "./PlaceList";

type ChipKey = Category | "all";

/**
 * The Explore tab (wireframe a-explore, PLACE-01 ~ PLACE-03): the search box, a chip for every
 * category and All, and the places nearest first. One category at a time, as on the web.
 */
export function ExploreScreen({ onOpen, onSearch }: { onOpen: (place: PlaceSummary) => void; onSearch: () => void }) {
  const t = useTranslations("Explore");
  const tCategory = useTranslations("Category");
  const [category, setCategory] = useState<Category | null>(null);

  const items = [
    { key: "all" as ChipKey, label: t("all"), selected: category === null },
    ...CATEGORIES.map((key) => ({
      key: key as ChipKey,
      label: tCategory(key),
      selected: category === key,
      color: categoryStyle({ category: key, subtype: null }).color,
    })),
  ];

  return (
    <View style={styles.container}>
      <SearchBar onPress={onSearch} />
      <Chips label={t("categories")} items={items} onPress={(key) => setCategory(key === "all" ? null : key)} />
      <PlaceList
        query={{ category, q: null }}
        empty={<StateMessage text={category === null ? t("emptyAll") : t("emptyCategory")} />}
        onOpen={onOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
});
