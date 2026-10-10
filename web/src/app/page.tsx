import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { MapScreen } from "@/components/map/MapScreen";

export default function MapPage() {
  const t = useTranslations("Pages");

  return (
    <>
      {/* The map needs no visible title, but a screen reader still gets one. */}
      <h1 className="sr-only">{t("map")}</h1>
      {/* MapScreen reads the query of the URL, which the prerendered page cannot know. */}
      <Suspense>
        <MapScreen />
      </Suspense>
    </>
  );
}
