import Link from "next/link";
import { useTranslations } from "next-intl";
import { StateMessage } from "@/components/state/StateMessage";

const linkClass = "rounded-lg border border-neutral-950 px-4 py-2 font-semibold";

export default function NotFound() {
  const t = useTranslations("State");

  return (
    <StateMessage title={t("notFoundTitle")} body={t("notFoundBody")}>
      <Link href="/" className={linkClass}>
        {t("goToMap")}
      </Link>
      <Link href="/explore" className={linkClass}>
        {t("goToExplore")}
      </Link>
    </StateMessage>
  );
}
