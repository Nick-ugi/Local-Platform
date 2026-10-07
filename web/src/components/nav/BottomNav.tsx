"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MENU, activeMenu } from "./menu";

/**
 * Mobile bottom tabs (wireframe m-map). Shown below 768px; TopNav takes over from there. It stays
 * at the bottom of the screen and keeps clear of the home indicator on phones without a button.
 */
export function BottomNav() {
  const t = useTranslations("Nav");
  const active = activeMenu(usePathname() ?? "");

  return (
    <nav
      aria-label={t("label")}
      className="sticky bottom-0 flex shrink-0 border-t border-neutral-400 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MENU.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className="flex h-14 flex-1 items-center justify-center whitespace-nowrap border-t-[3px] border-transparent text-sm font-semibold text-neutral-500 aria-[current=page]:border-neutral-950 aria-[current=page]:text-neutral-950"
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
