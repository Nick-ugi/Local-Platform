import { useLocalSearchParams } from "expo-router";
import { getNotice } from "@/api/notices";
import { DetailRoute } from "@/detail/DetailRoute";
import { NoticeDetailView } from "@/detail/NoticeDetailView";

/** Notice Detail, on top of the Map it was opened from. */
export default function NoticeRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <DetailRoute kind="notice" slug={slug} load={getNotice} titleOf={(notice) => notice.title}>
      {(notice, onViewOnMap) => <NoticeDetailView notice={notice} onViewOnMap={onViewOnMap} />}
    </DetailRoute>
  );
}
