"use client";

import { categoryStyle, FILTER_KEYS, type FilterKey } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { KindDot } from "@/components/place/KindArt";

/** The colour of a chip's markers. */
function colorOf(key: FilterKey): string {
  return categoryStyle(key === "event" || key === "notice" ? key : { category: key, subtype: null }).color;
}

type Props = {
  selected: readonly FilterKey[];
  onToggle: (key: FilterKey) => void;
};

/**
 * Filter chips above the map (wireframes m-map, m-map-notice and d-map): the six categories, then
 * Events and Notices. Any number can be on; none means everything is shown. The row stays on one
 * line and scrolls sideways where it does not fit.
 */
export function FilterChips({ selected, onToggle }: Props) {
  const t = useTranslations("Map");
  const tCategory = useTranslations("Category");
  const tPages = useTranslations("Pages");

  function label(key: FilterKey) {
    if (key === "event") {
      return tPages("events");
    }
    if (key === "notice") {
      return tPages("notices");
    }
    return tCategory(key);
  }

  return (
    <div role="group" aria-label={t("filters")} className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2 md:px-8">
      {FILTER_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected.includes(key)}
          onClick={() => onToggle(key)}
          className="flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-400 px-4 text-sm font-medium aria-pressed:border-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white"
        >
          <KindDot color={colorOf(key)} />
          {label(key)}
        </button>
      ))}
    </div>
  );
}
