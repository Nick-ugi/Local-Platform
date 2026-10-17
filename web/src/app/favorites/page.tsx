import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FavoritesView } from "@/components/account/FavoritesView";
import { BackLink } from "@/components/nav/BackLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages");
  // Each visitor's own list: not a page for search engines.
  return { title: t("favorites"), robots: { index: false, follow: false } };
}

/** Favorites (wireframe m-favorites, FAV-02). */
export default function FavoritesPage() {
  const t = useTranslations("Pages");

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col md:py-6">
      <div className="flex items-center gap-2 px-4 pt-2 md:hidden">
        <BackLink fallbackHref="/more" />
      </div>
      <h1 className="px-4 py-4 text-lg font-bold md:text-2xl">{t("favorites")}</h1>
      <FavoritesView />
    </div>
  );
}
