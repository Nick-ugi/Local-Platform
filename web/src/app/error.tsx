"use client";

import { useTranslations } from "next-intl";
import { StateMessage } from "@/components/state/StateMessage";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  retry: () => void;
};

/**
 * Shown when a page fails to render, for example when the API is down. The error is never
 * displayed. "Try again" uses retry(), which asks the server for the page again; reset() would
 * only redraw this boundary with the same failed result.
 */
export default function ErrorPage({ retry }: Props) {
  const t = useTranslations("State");

  return (
    <StateMessage title={t("errorTitle")} body={t("errorBody")}>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-lg border border-neutral-950 bg-neutral-950 px-4 py-2 font-semibold text-white"
      >
        {t("retry")}
      </button>
    </StateMessage>
  );
}
