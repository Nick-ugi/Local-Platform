import { useTranslations } from "next-intl";

// Placeholder: the screen itself arrives with its feature week.
export default function MapPage() {
  const t = useTranslations("Pages");
  return <h1 className="p-8 text-xl font-bold">{t("map")}</h1>;
}
