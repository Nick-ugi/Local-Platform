"use client";

import { useTranslations } from "next-intl";
import { useSlow } from "@/lib/useSlow";

/**
 * What a page shows while the server gets its data: "Loading…", and after five seconds that the
 * server is waking up, since a sleeping free-tier backend takes up to a minute to answer.
 */
export function LoadingState() {
  const t = useTranslations("State");
  const slow = useSlow(true);

  return (
    <p role="status" className="flex flex-1 items-center justify-center p-8 text-center text-neutral-600">
      {slow ? t("waking") : t("loading")}
    </p>
  );
}
