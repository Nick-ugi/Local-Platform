import type { NoticeDetail, NoticeSummary, NoticeType, Page } from "@queenstown/shared";
import { apiGet } from "./client";
import { getDetail, withQuery } from "./detail";

/** A public notice, ended or not, or null when there is none for the slug. */
export function getNotice(slug: string): Promise<NoticeDetail | null> {
  return getDetail<NoticeDetail>("notices", slug);
}

/** One page of the notices that have not ended, latest first, of one type if one is given. */
export function getNotices(query: { type?: NoticeType | null; page?: number }): Promise<Page<NoticeSummary>> {
  return apiGet<Page<NoticeSummary>>(withQuery("/notices", { type: query.type, page: query.page }));
}
