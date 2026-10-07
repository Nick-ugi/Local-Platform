"use client";

import { useTranslations } from "next-intl";
import { StateMessage } from "@/components/state/StateMessage";

/** Shown when a page fails to render, for example when the API is down. The error is never displayed. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("State");

  return (
    <StateMessage title={t("errorTitle")} body={t("errorBody")}>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg border border-neutral-950 bg-neutral-950 px-4 py-2 font-semibold text-white"
      >
        {t("retry")}
      </button>
    </StateMessage>
  );
}
