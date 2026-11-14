"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MENU, type MenuKey, activeMenu } from "./menu";

// The app's tab icons (mobile/src/app/(tabs)/_layout.tsx).
const ICONS: Record<MenuKey, IconName> = { map: "map", explore: "list", local: "calendar", more: "more" };

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
      className="sticky bottom-0 flex shrink-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {MENU.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === active ? "page" : undefined}
          className="flex h-14 flex-1 flex-col items-center justify-center gap-0.5 whitespace-nowrap text-xs font-semibold text-neutral-500 aria-[current=page]:text-brand"
        >
          <Icon name={ICONS[item.key]} className="size-6" />
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
