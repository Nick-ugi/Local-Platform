import type { NoticeSummary } from "@queenstown/shared";
import Link from "next/link";
import { NoticeBadges } from "./NoticeBadges";
import { NoticePeriodText } from "./NoticePeriodText";

/** A notice in the list (m-notices): type and Official first, then the title and the period. */
export function NoticeCard({ notice }: { notice: NoticeSummary }) {
  return (
    <Link
      href={`/notices/${encodeURIComponent(notice.slug)}`}
      className="flex min-h-11 items-center gap-3 px-4 py-4 [overflow-wrap:anywhere]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <NoticeBadges type={notice.type} isOfficial={notice.isOfficial} />
        <h2 className="text-lg font-bold">{notice.title}</h2>
        <p className="text-sm text-neutral-600">
          <NoticePeriodText startsAt={notice.startsAt} endsAt={notice.endsAt} />
        </p>
      </div>
      <span aria-hidden="true" className="text-xl text-neutral-500">
        ›
      </span>
    </Link>
  );
}
