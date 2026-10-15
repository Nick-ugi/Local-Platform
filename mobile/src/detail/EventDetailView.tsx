import { type EventDetail, formatDate, formatEventWhen, httpUrl } from "@queenstown/shared";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { useTranslations } from "use-intl";
import { openWebsite, shareLink } from "@/links/actions";
import { PlaceImage } from "@/ui/PlaceImage";
import {
  ActionProblem,
  DetailRow,
  DetailText,
  detailStyles,
  EndedNotice,
  SideButton,
  UpdatedLine,
  WideButton,
} from "./DetailParts";

/**
 * Event detail (wireframe m-event, EVENT-03 ~ EVENT-05): picture, title, when in New Zealand time,
 * where with "View on map", description, the source with the official event page, the date it was
 * updated, and Share. An ended event says so under its title and is not on the map, so it has no
 * "View on map".
 */
export function EventDetailView({ event, onViewOnMap }: { event: EventDetail; onViewOnMap: () => void }) {
  const t = useTranslations("Detail");
  const tPlace = useTranslations("Place");
  const [problem, setProblem] = useState<string | null>(null);
  const source = httpUrl(event.sourceUrl);

  async function run(action: () => Promise<boolean>) {
    setProblem(null);
    if (!(await action())) {
      setProblem(tPlace("openFailed"));
    }
  }

  return (
    <ScrollView style={detailStyles.scroll} contentContainerStyle={detailStyles.content}>
      <PlaceImage url={event.imageUrl} label={event.title} style={detailStyles.image} />
      <Text accessibilityRole="header" style={detailStyles.title}>
        {event.title}
      </Text>
      {event.ended ? <EndedNotice text={t("eventEnded")} /> : null}
      <DetailRow title={t("when")}>
        <DetailText>{formatEventWhen(event.startsAt, event.endsAt, { year: true })}</DetailText>
      </DetailRow>
      <DetailRow
        title={t("where")}
        action={
          event.ended ? undefined : <SideButton role="link" label={tPlace("viewOnMap")} onPress={onViewOnMap} />
        }
      >
        <DetailText>{event.venueName}</DetailText>
        {event.address ? <DetailText muted>{event.address}</DetailText> : null}
      </DetailRow>
      {event.description ? <DetailText>{event.description}</DetailText> : null}
      <DetailRow
        title={t("source")}
        action={
          source ? (
            <SideButton role="link" label={t("eventPage")} onPress={() => void run(() => openWebsite(source))} />
          ) : undefined
        }
      >
        <DetailText>{event.source}</DetailText>
      </DetailRow>
      <UpdatedLine text={t("updated", { date: formatDate(event.updatedAt) })} />
      <WideButton
        label={tPlace("share")}
        onPress={() => void run(() => shareLink(event.title, `/events/${encodeURIComponent(event.slug)}`))}
      />
      <ActionProblem text={problem} />
    </ScrollView>
  );
}
