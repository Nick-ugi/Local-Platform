import { useTranslations } from "next-intl";
import { StateMessage } from "@/components/state/StateMessage";

export default function Loading() {
  const t = useTranslations("State");
  return <StateMessage title={t("loading")} />;
}
