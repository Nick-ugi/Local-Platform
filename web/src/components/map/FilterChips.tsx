"use client";

import { CATEGORIES, type Category } from "@queenstown/shared";
import { useTranslations } from "next-intl";

type Props = {
  selected: readonly Category[];
  onToggle: (key: Category) => void;
};

/**
 * Filter chips above the map (wireframes m-map and d-map). Any number can be on; none means
 * everything is shown. The row stays on one line and scrolls sideways where it does not fit.
 */
export function FilterChips({ selected, onToggle }: Props) {
  const t = useTranslations("Map");
  const tCategory = useTranslations("Category");

  return (
    <div role="group" aria-label={t("filters")} className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2 md:px-8">
      {CATEGORIES.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected.includes(key)}
          onClick={() => onToggle(key)}
          className="h-11 shrink-0 whitespace-nowrap rounded-full border border-neutral-400 px-4 text-sm font-medium aria-pressed:border-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white"
        >
          {tCategory(key)}
        </button>
      ))}
    </div>
  );
}
