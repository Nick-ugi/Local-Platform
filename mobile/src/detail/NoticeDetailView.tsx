import { formatDate, httpUrl, type NoticeDetail } from "@queenstown/shared";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { openWebsite, shareLink } from "@/links/actions";
import { NoticeBadges } from "@/local/NoticeBadges";
import { useNoticePeriodText } from "@/local/useNoticePeriod";
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
 * Notice detail (wireframe m-notice, NOTICE-02 ~ NOTICE-05): type and Official, title, period,
 * summary, location with "View on map", the source organisation with "Open original", the date it
 * was updated, and Share. A notice without a location has no Location row. An ended notice says
 * so and is not on the map, so it has no "View on map".
 */
export function NoticeDetailView({ notice, onViewOnMap }: { notice: NoticeDetail; onViewOnMap: () => void }) {
  const t = useTranslations("Detail");
  const tPlace = useTranslations("Place");
  const periodText = useNoticePeriodText();
  const [problem, setProblem] = useState<string | null>(null);
  const source = httpUrl(notice.sourceUrl);
  const located = notice.latitude !== null && notice.longitude !== null;

  async function run(action: () => Promise<boolean>) {
    setProblem(null);
    if (!(await action())) {
      setProblem(tPlace("openFailed"));
    }
  }

  return (
    <ScrollView style={detailStyles.scroll} contentContainerStyle={detailStyles.content}>
      <View style={{ gap: 8 }}>
        <NoticeBadges type={notice.type} isOfficial={notice.isOfficial} />
        <Text accessibilityRole="header" style={detailStyles.title}>
          {notice.title}
        </Text>
      </View>
      {notice.ended ? <EndedNotice text={t("noticeEnded")} /> : null}
      <DetailRow title={t("period")}>
        <DetailText>{periodText(notice.startsAt, notice.endsAt)}</DetailText>
      </DetailRow>
      <DetailText>{notice.summary}</DetailText>
      {located ? (
        <DetailRow
          title={t("location")}
          action={
            notice.ended ? undefined : <SideButton role="link" label={tPlace("viewOnMap")} onPress={onViewOnMap} />
          }
        >
          {notice.locationName ? <DetailText>{notice.locationName}</DetailText> : null}
        </DetailRow>
      ) : null}
      <DetailRow
        title={t("source")}
        action={
          source ? (
            <SideButton role="link" label={t("openOriginal")} onPress={() => void run(() => openWebsite(source))} />
          ) : undefined
        }
      >
        <DetailText>{notice.sourceOrg}</DetailText>
      </DetailRow>
      <UpdatedLine text={t("updated", { date: formatDate(notice.updatedAt) })} />
      <WideButton
        label={tPlace("share")}
        onPress={() => void run(() => shareLink(notice.title, `/notices/${encodeURIComponent(notice.slug)}`))}
      />
      <ActionProblem text={problem} />
    </ScrollView>
  );
}
