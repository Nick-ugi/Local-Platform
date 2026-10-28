import type { NoticeDetail, NoticeSummary, NoticeType, Page } from "@queenstown/shared";
import { apiGet } from "./client";
import { getDetail, queryString } from "./detail";

/** A notice, ended or not, or null when there is none for the slug. */
export function getNotice(slug: string, options?: { signal?: AbortSignal }): Promise<NoticeDetail | null> {
  return getDetail<NoticeDetail>("notices", slug, options);
}

/** One page of the current notices, latest first, of one type if one is named (NOTICE-01, NOTICE-06). */
export function getNotices(
  query: { type?: NoticeType | null; page?: number },
  options?: { signal?: AbortSignal },
): Promise<Page<NoticeSummary>> {
  const search = queryString({
    type: query.type,
    page: query.page !== undefined && query.page > 1 ? query.page : null,
  });
  return apiGet<Page<NoticeSummary>>(`/notices${search}`, options);
}
