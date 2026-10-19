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

/**
 * More (wireframe m-more): About, then the account (Log in or Log out) and Favorites, then Privacy
 * Policy and Terms (docs/02-information-architecture.md, More).
 */
export default function MorePage() {
  const t = useTranslations("Pages");

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col md:py-6">
      <h1 className="px-4 py-4 text-lg font-bold">{t("more")}</h1>
      <nav aria-label={t("more")}>
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          <MenuLink href="/about" label={t("about")} />
          <AccountMenu />
          <MenuLink href="/privacy" label={t("privacy")} />
          <MenuLink href="/terms" label={t("terms")} />
        </ul>
      </nav>
    </div>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-14 items-center justify-between px-4 font-semibold">
        {label}
        <span aria-hidden="true" className="text-xl text-neutral-500">
          ›
        </span>
      </Link>
    </li>
  );
}
