import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AccountMenu } from "@/components/account/AccountMenu";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages");
  // More is a menu, not a page for search engines (docs/02-information-architecture.md, section 3).
  return { title: t("more"), robots: { index: false, follow: true } };
}

/** More (wireframe m-more): About, then the account (Log in or Log out) and Favorites. */
export default function MorePage() {
  const t = useTranslations("Pages");

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col md:py-6">
      <h1 className="px-4 py-4 text-lg font-bold">{t("more")}</h1>
      <nav aria-label={t("more")}>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          <li>
            <Link href="/about" className="flex min-h-14 items-center justify-between px-4 font-semibold">
              {t("about")}
              <span aria-hidden="true" className="text-xl text-neutral-500">
                ›
              </span>
            </Link>
          </li>
          <AccountMenu />
        </ul>
      </nav>
    </div>
  );
}
