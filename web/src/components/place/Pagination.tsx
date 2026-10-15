import Link from "next/link";
import { useTranslations } from "next-intl";
import { withPage } from "@/lib/places/listUrl";

type Props = {
  /** The list's address without a page, such as /explore/food or /search?q=pizza. */
  path: string;
  page: number;
  pages: number;
};

const linkClass = "flex h-11 items-center rounded-lg border border-neutral-950 px-4 font-semibold";

/** The way to the neighbouring pages of a list. A list of one page has none. */
export function Pagination({ path, page, pages }: Props) {
  const t = useTranslations("Paging");

  if (pages <= 1) {
    return null;
  }
  return (
    <nav aria-label={t("label")} className="flex items-center justify-between gap-3 px-4 py-4 md:px-8">
      {/* An empty cell keeps "Page 2 of 3" in the middle on the first and the last page. */}
      <div className="flex flex-1 justify-start">
        {page > 1 ? (
          <Link href={withPage(path, page - 1)} className={linkClass}>
            {t("previous")}
          </Link>
        ) : null}
      </div>
      <p className="text-sm text-neutral-600">{t("position", { page, pages })}</p>
      <div className="flex flex-1 justify-end">
        {page < pages ? (
          <Link href={withPage(path, page + 1)} className={linkClass}>
            {t("next")}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
