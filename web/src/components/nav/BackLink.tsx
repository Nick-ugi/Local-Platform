"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { canGoBackInApp } from "@/lib/history";

/**
 * "Back" on a detail screen. It returns to the previous screen of this site when there is one.
 * A visitor who landed here from a search result has none, so for them it is a plain link to
 * the fallback page and never leads out of the site.
 */
export function BackLink({ fallbackHref }: { fallbackHref: string }) {
  const t = useTranslations("Nav");
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      onClick={(event) => {
        if (canGoBackInApp()) {
          event.preventDefault();
          router.back();
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 pr-3 font-semibold"
    >
      <span aria-hidden="true">←</span>
      {t("back")}
    </Link>
  );
}
