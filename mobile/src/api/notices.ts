import type { NoticeDetail } from "@queenstown/shared";
import { getDetail } from "./detail";

/** A notice, ended or not, or null when there is none for the slug. */
export function getNotice(slug: string, options?: { signal?: AbortSignal }): Promise<NoticeDetail | null> {
  return getDetail<NoticeDetail>("notices", slug, options);
}
