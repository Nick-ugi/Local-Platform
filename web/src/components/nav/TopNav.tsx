"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MENU, activeMenu } from "./menu";

/** Desktop top menu (wireframe d-map), shown from 768px up. The search box joins it in week 7. */
export function TopNav() {
  const t = useTranslations("Nav");
  const active = activeMenu(usePathname() ?? "");

  return (
    <header className="hidden h-[60px] shrink-0 items-center gap-7 border-b border-neutral-400 px-6 md:flex">
      <Link href="/" className="text-base font-extrabold">
        {t("brand")}
      </Link>
      <nav aria-label={t("label")} className="flex h-full items-center gap-5">
        {MENU.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === active ? "page" : undefined}
            className="flex h-full items-center border-b-[3px] border-transparent pt-[3px] font-semibold text-neutral-500 aria-[current=page]:border-neutral-950 aria-[current=page]:text-neutral-950"
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
