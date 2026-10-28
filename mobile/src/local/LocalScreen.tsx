import {
  detailPath,
  EVENT_PERIODS,
  type EventPeriod,
  type EventSummary,
  NOTICE_TYPES,
  type NoticeSummary,
  type NoticeType,
} from "@queenstown/shared";
import { type ReactElement, useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { getEvents } from "@/api/events";
import { getNotices } from "@/api/notices";
import { Chips } from "@/ui/Chips";
import { LoadingMessage } from "@/ui/LoadingMessage";
import { StateMessage } from "@/ui/StateMessage";
import { colors, TOUCH } from "@/ui/theme";
import { type PagedListState, usePagedList } from "@/ui/usePagedList";
import { EventRow } from "./EventRow";
import { NoticeRow } from "./NoticeRow";

type Section = "events" | "notices";

/**
 * The Local tab (APP-01, wireframes m-events and m-notices): Events and Notices, one at a time.
 * Events are those on or to come, earliest first, narrowed to today, this week or this month
 * (EVENT-01, EVENT-02); notices are the current ones, latest first, narrowed to a type (NOTICE-01,
 * NOTICE-06). The web app has the same lists on its Local pages.
 */
export function LocalScreen({ onOpen }: { onOpen: (path: string) => void }) {
  const t = useTranslations("Local");
  const [section, setSection] = useState<Section>("events");

  return (
    <View style={styles.container}>
      <View accessibilityRole="tablist" accessibilityLabel={t("sections")} style={styles.sections}>
        {(["events", "notices"] as const).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: section === key }}
            onPress={() => setSection(key)}
            style={[styles.section, section === key && styles.sectionOn]}
          >
            <Text style={[styles.sectionText, section === key && styles.sectionTextOn]}>{t(key)}</Text>
          </Pressable>
        ))}
      </View>
      {section === "events" ? <EventList onOpen={onOpen} /> : <NoticeList onOpen={onOpen} />}
    </View>
  );
}

function EventList({ onOpen }: { onOpen: (path: string) => void }) {
  const t = useTranslations("Local");
  const [when, setWhen] = useState<EventPeriod | null>(null);
  const load = useCallback((page: number, signal: AbortSignal) => getEvents({ when, page }, { signal }), [when]);
  const list = usePagedList(`events|${when ?? "all"}`, load);

  const chips = [
    { key: "all", label: t("all"), selected: when === null },
    ...EVENT_PERIODS.map((key) => ({ key, label: t(key), selected: when === key })),
  ];

  return (
    <PagedList
      list={list}
      chips={
        <Chips
          label={t("eventPeriods")}
          items={chips}
          onPress={(key) => setWhen(key === "all" ? null : (key as EventPeriod))}
        />
      }
      empty={
        when === null ? (
          <StateMessage text={t("noEvents")} />
        ) : (
          <StateMessage text={t("noEventsInPeriod")} actions={[{ label: t("showAllEvents"), onPress: () => setWhen(null) }]} />
        )
      }
      keyOf={(event: EventSummary) => event.slug}
      renderRow={(event: EventSummary) => (
        <EventRow event={event} onPress={() => onOpen(detailPath({ kind: "event", slug: event.slug }))} />
      )}
    />
  );
}

function NoticeList({ onOpen }: { onOpen: (path: string) => void }) {
  const t = useTranslations("Local");
  const tType = useTranslations("NoticeType");
  const [type, setType] = useState<NoticeType | null>(null);
  const load = useCallback((page: number, signal: AbortSignal) => getNotices({ type, page }, { signal }), [type]);
  const list = usePagedList(`notices|${type ?? "all"}`, load);

  const chips = [
    { key: "all", label: t("allTypes"), selected: type === null },
    ...NOTICE_TYPES.map((key) => ({ key, label: tType(key), selected: type === key })),
  ];

  return (
    <PagedList
      list={list}
      chips={
        <Chips
          label={t("noticeTypes")}
          items={chips}
          onPress={(key) => setType(key === "all" ? null : (key as NoticeType))}
        />
      }
      empty={
        type === null ? (
          <StateMessage text={t("noNotices")} />
        ) : (
          <StateMessage text={t("noNoticesOfType")} actions={[{ label: t("showAllTypes"), onPress: () => setType(null) }]} />
        )
      }
      keyOf={(notice: NoticeSummary) => notice.slug}
      renderRow={(notice: NoticeSummary) => (
        <NoticeRow notice={notice} onPress={() => onOpen(detailPath({ kind: "notice", slug: notice.slug }))} />
      )}
    />
  );
}

/** A list under its chips, with the states before it and the next page at its end. */
function PagedList<T>({
  list,
  chips,
  empty,
  keyOf,
  renderRow,
}: {
  list: PagedListState<T>;
  chips: ReactElement;
  empty: ReactElement;
  keyOf: (item: T) => string;
  renderRow: (item: T) => ReactElement;
}) {
  const t = useTranslations("Local");
  const tState = useTranslations("State");

  let content: ReactElement | null = null;
  if (list.status === "loading") {
    content = <LoadingMessage />;
  } else if (list.status === "error") {
    content = <StateMessage text={t("loadFailed")} actions={[{ label: tState("retry"), onPress: list.retry }]} />;
  } else if (list.items.length === 0) {
    content = empty;
  }

  let footer: ReactElement | null = null;
  if (list.more === "loading") {
    footer = <ActivityIndicator style={styles.footer} color={colors.muted} />;
  } else if (list.more === "error") {
    footer = (
      <View accessibilityLiveRegion="polite" style={[styles.footer, styles.footerRow]}>
        <Text style={styles.footerText}>{t("loadMoreFailed")}</Text>
        <Pressable accessibilityRole="button" onPress={list.retry} style={styles.retry}>
          <Text style={styles.retryText}>{tState("retry")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={list.items}
      keyExtractor={keyOf}
      renderItem={({ item }) => renderRow(item)}
      ListHeaderComponent={chips}
      ListEmptyComponent={content}
      ListFooterComponent={footer}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.5}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  sections: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 8,
    overflow: "hidden",
  },
  section: { flex: 1, minHeight: TOUCH, alignItems: "center", justifyContent: "center" },
  sectionOn: { backgroundColor: colors.ink },
  sectionText: { fontSize: 15, fontWeight: "600", color: colors.text },
  sectionTextOn: { color: colors.paper },
  list: { flex: 1 },
  footer: { padding: 16 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  footerText: { fontSize: 14, color: colors.muted },
  retry: { minHeight: TOUCH, justifyContent: "center" },
  retryText: { fontSize: 14, fontWeight: "600", textDecorationLine: "underline", color: colors.text },
});
