import type { PlaceSummary } from "@queenstown/shared";
import type { ReactNode } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { useVisitorPosition } from "@/geo/VisitorPosition";
import { StateMessage } from "@/ui/StateMessage";
import { colors, TOUCH } from "@/ui/theme";
import { PlaceRow } from "./PlaceRow";
import { type ListQuery, usePlaceList } from "./usePlaceList";

/** The message for each way of not getting a usable position (docs/03-user-flow.md, UF-01). */
const LOCATION_PROBLEMS = {
  outside: "outsideArea",
  denied: "locationDenied",
  unavailable: "locationUnavailable",
} as const;

type Props = {
  query: ListQuery;
  /** Above the list and scrolling with it, such as the chips. */
  header?: ReactNode;
  /** "12 results", for a list that says how long it is. */
  countText?: (total: number) => string;
  /** Instead of the list when it has no places. */
  empty: ReactNode;
  onOpen: (place: PlaceSummary) => void;
};

/**
 * A list of places with its "Nearest first" line (wireframe a-explore), for Explore and Search.
 * With the visitor's position inside the area it runs from there and shows distances; otherwise
 * from the centre of Queenstown, and a line says why (COMMON-01). Scrolling to the end loads the
 * next page.
 */
export function PlaceList({ query, header, countText, empty, onOpen }: Props) {
  const t = useTranslations("Nearby");
  const { position, problem } = useVisitorPosition();
  const list = usePlaceList(query, position);

  const top = (
    <View>
      {header}
      <View style={styles.order}>
        <Text style={styles.orderText}>{t("nearestFirst")}</Text>
        <Text style={styles.orderText}>{position ? t("fromYourLocation") : t("fromCentre")}</Text>
      </View>
      {problem ? <Text style={styles.problem}>{t(LOCATION_PROBLEMS[problem])}</Text> : null}
      {countText && list.status === "ready" && list.total > 0 ? (
        <Text style={styles.count}>{countText(list.total)}</Text>
      ) : null}
    </View>
  );

  let content: ReactNode = null;
  if (list.status === "loading") {
    content = <StateMessage loading />;
  } else if (list.status === "error") {
    content = <StateMessage text={t("loadFailed")} actions={[{ label: t("retry"), onPress: list.retry }]} />;
  } else if (list.items.length === 0) {
    content = empty;
  }

  return (
    <FlatList
      data={list.items}
      keyExtractor={(place) => place.slug}
      renderItem={({ item }) => <PlaceRow place={item} onPress={() => onOpen(item)} />}
      ListHeaderComponent={top}
      ListEmptyComponent={<>{content}</>}
      ListFooterComponent={<Footer more={list.more} retry={list.retry} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.5}
      keyboardShouldPersistTaps="handled"
      style={styles.list}
    />
  );
}

function Footer({ more, retry }: { more: "idle" | "loading" | "error"; retry: () => void }) {
  const t = useTranslations("Nearby");

  if (more === "loading") {
    return <ActivityIndicator style={styles.footer} color={colors.muted} />;
  }
  if (more === "error") {
    return (
      <View accessibilityLiveRegion="polite" style={[styles.footer, styles.footerRow]}>
        <Text style={styles.problemText}>{t("loadMoreFailed")}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.action}>
          <Text style={styles.actionText}>{t("retry")}</Text>
        </Pressable>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.paper },
  order: {
    minHeight: TOUCH,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  orderText: { fontSize: 14, color: colors.muted },
  problem: { fontSize: 14, color: colors.text, paddingHorizontal: 16, paddingVertical: 8 },
  count: { fontSize: 14, color: colors.muted, paddingHorizontal: 16, paddingTop: 8 },
  footer: { paddingVertical: 16 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  problemText: { fontSize: 14, color: colors.text },
  action: { minHeight: TOUCH, justifyContent: "center" },
  actionText: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },
});
