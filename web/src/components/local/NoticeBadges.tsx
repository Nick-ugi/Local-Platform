import type { NoticeType } from "@queenstown/shared";
import { useTranslations } from "next-intl";

/** The type of a notice and, for one from an official source, "Official" (NOTICE-02). */
export function NoticeBadges({ type, isOfficial }: { type: NoticeType; isOfficial: boolean }) {
  const t = useTranslations("Local");
  const tType = useTranslations("NoticeType");

  return (
    <p className="flex flex-wrap gap-2 text-xs font-semibold">
      <span className="rounded border border-neutral-500 px-2 py-0.5">{tType(type)}</span>
      {isOfficial ? <span className="rounded bg-neutral-900 px-2 py-0.5 text-white">{t("official")}</span> : null}
    </p>
  );
}
