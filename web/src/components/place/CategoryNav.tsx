import { CATEGORIES, type Category, categoryStyle } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { explorePath } from "@/lib/places/listUrl";
import { KindDot } from "./KindArt";

const linkClass =
  "flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-400 px-4 text-sm font-medium aria-[current=page]:border-neutral-950 aria-[current=page]:bg-neutral-950 aria-[current=page]:text-white";

/**
 * The categories of Explore (wireframes m-explore and d-explore). One is chosen at a time and
 * each has its own address, so they are links. The row stays on one line and scrolls sideways
 * where it does not fit.
 */
export function CategoryNav({ active }: { active: Category | null }) {
  const t = useTranslations("Explore");
  const tCategory = useTranslations("Category");

  return (
    <nav aria-label={t("categories")} className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2 md:px-8">
      <Link href={explorePath(null)} aria-current={active === null ? "page" : undefined} className={linkClass}>
        {t("all")}
      </Link>
      {CATEGORIES.map((category) => (
        <Link
          key={category}
          href={explorePath(category)}
          aria-current={category === active ? "page" : undefined}
          className={linkClass}
        >
          <KindDot color={categoryStyle({ category, subtype: null }).color} />
          {tCategory(category)}
        </Link>
      ))}
    </nav>
  );
}
