import Link from "next/link";
import { useTranslations } from "next-intl";

const tabClass =
  "flex h-11 flex-1 items-center justify-center border-b-[3px] border-transparent font-semibold text-neutral-500 aria-[current=page]:border-neutral-950 aria-[current=page]:text-neutral-950";

/**
 * Notices and Events, the two halves of Local (wireframes m-notices, m-events, d-notices). Each
 * has its own address, so the tabs are links. Local itself opens on Notices.
 */
export function LocalTabs({ active }: { active: "notices" | "events" }) {
  const t = useTranslations("Local");

  return (
    <nav aria-label={t("sections")} className="flex shrink-0 border-b border-neutral-300">
      <Link href="/notices" aria-current={active === "notices" ? "page" : undefined} className={tabClass}>
        {t("notices")}
      </Link>
      <Link href="/events" aria-current={active === "events" ? "page" : undefined} className={tabClass}>
        {t("events")}
      </Link>
    </nav>
  );
}
