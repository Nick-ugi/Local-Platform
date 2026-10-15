"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { sharePage } from "@/lib/share";

// How long "Link copied" stays on screen.
const COPIED_MS = 2000;

type Props = {
  title: string;
  className?: string;
};

/**
 * Shares the page it is on (COMMON-05). The address is the page's own without its query or
 * fragment, so tracking values that brought the visitor here are not passed on.
 */
export function ShareButton({ title, className }: Props) {
  const t = useTranslations("Place");
  const [notice, setNotice] = useState<"copied" | "failed" | null>(null);

  useEffect(() => {
    if (notice !== "copied") {
      return;
    }
    const timer = setTimeout(() => setNotice(null), COPIED_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  async function share() {
    setNotice(null);
    const outcome = await sharePage({ title, url: window.location.origin + window.location.pathname });
    setNotice(outcome === "copied" || outcome === "failed" ? outcome : null);
  }

  return (
    <div className="relative flex">
      <button type="button" onClick={share} className={className}>
        {t("share")}
      </button>
      {/* Always in the page so that screen readers announce what is put in it. */}
      <p
        role="status"
        className={
          notice
            ? "absolute right-0 top-full z-10 mt-2 w-max max-w-[calc(100vw-2rem)] rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white md:max-w-80"
            : "sr-only"
        }
      >
        {notice === "copied" ? t("linkCopied") : notice === "failed" ? t("shareFailed") : null}
      </p>
    </div>
  );
}
