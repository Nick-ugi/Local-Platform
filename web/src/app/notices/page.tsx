import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Pages");
  return { title: t("local") };
}

// Placeholder: the screen itself arrives with its feature week.
export default function NoticesPage() {
  const t = useTranslations("Pages");
  return <h1 className="px-4 py-6 text-xl font-bold md:p-8">{t("local")}</h1>;
}
