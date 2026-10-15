import { noticePeriod } from "@queenstown/shared";
import { useTranslations } from "use-intl";

/** How long a notice applies, in New Zealand time: "6 Oct - 20 Oct 2026" or "From 12 Oct 2026". */
export function useNoticePeriodText(): (startsAt: string, endsAt: string | null) => string {
  const t = useTranslations("Local");
  return (startsAt, endsAt) => {
    const period = noticePeriod(startsAt, endsAt);
    return period.kind === "from" ? t("from", { date: period.date }) : period.text;
  };
}
