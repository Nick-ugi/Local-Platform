import { noticePeriod } from "@queenstown/shared";
import { useTranslations } from "next-intl";

/** How long a notice applies, in New Zealand time: "6 Oct - 20 Oct 2026" or "From 12 Oct 2026". */
export function NoticePeriodText({ startsAt, endsAt }: { startsAt: string; endsAt: string | null }) {
  const t = useTranslations("Local");
  const period = noticePeriod(startsAt, endsAt);

  return <>{period.kind === "from" ? t("from", { date: period.date }) : period.text}</>;
}
