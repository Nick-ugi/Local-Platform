import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { MapScreen } from "@/components/map/MapScreen";
import { SearchBox } from "@/components/search/SearchBox";

export default function MapPage() {
  const t = useTranslations("Pages");

  return (
    <>
      {/* The map needs no visible title, but a screen reader still gets one. */}
      <h1 className="sr-only">{t("map")}</h1>
      {/* A phone has the search box above the chips (m-map); wider screens have it in the top menu. */}
      <div className="px-4 pt-2 md:hidden">
        <SearchBox />
      </div>
      {/* MapScreen reads the query of the URL, which the prerendered page cannot know. */}
      <Suspense>
        <MapScreen />
      </Suspense>
    </>
  );
}
