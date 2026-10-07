import { useTranslations } from "next-intl";

// Placeholder: the map arrives in week 6 and takes the area below the heading.
export default function MapPage() {
  const t = useTranslations("Pages");

  return (
    <>
      <h1 className="px-4 py-3 text-xl font-bold md:px-8">{t("map")}</h1>
      <div data-testid="map-area" className="flex-1 bg-neutral-200" />
    </>
  );
}
