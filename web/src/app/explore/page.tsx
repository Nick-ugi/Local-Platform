import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages");
  return { title: t("explore") };
}

// Placeholder: the screen itself arrives with its feature week.
export default function ExplorePage() {
  const t = useTranslations("Pages");
  return <h1 className="p-8 text-xl font-bold">{t("explore")}</h1>;
}
