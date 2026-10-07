import type { PlaceDetail } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BackLink } from "@/components/nav/BackLink";
import { displayUrl, formatDate, httpUrl, telHref } from "@/lib/format";

const externalLinkClass = "text-blue-700 underline underline-offset-2";

/**
 * Place detail (wireframe d-place). The image, quick actions, "View on map" and Favorite arrive
 * with the Place and Map weeks. Rows the place has no value for are left out.
 */
export function PlaceDetailView({ place }: { place: PlaceDetail }) {
  const t = useTranslations("Place");
  const tNav = useTranslations("Nav");
  const tCategory = useTranslations("Category");

  const website = place.website ? httpUrl(place.website) : null;
  const sourceUrl = httpUrl(place.sourceUrl);
  const hasContact = Boolean(place.phone || website);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 [overflow-wrap:anywhere] md:px-8 md:py-6">
      {/* Phones get a Back link (wireframe m-place), wider screens the breadcrumb (d-place). */}
      <div className="-mb-3 md:hidden">
        <BackLink fallbackHref="/explore" />
      </div>
      <nav aria-label={t("breadcrumb")} className="hidden gap-2 text-sm text-neutral-500 md:flex">
        <Link href="/explore">{tNav("explore")}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/explore/${place.category}`}>{tCategory(place.category)}</Link>
      </nav>

      <h1 className="text-2xl font-bold">{place.name}</h1>

      {place.description ? <p>{place.description}</p> : null}

      <Row title={t("address")}>
        <p>{place.address}</p>
      </Row>

      {place.openingHours ? (
        <Row title={t("openingHours")}>
          <p>{place.openingHours}</p>
        </Row>
      ) : null}

      {hasContact ? (
        <Row title={t("contact")}>
          {place.phone ? (
            <p>
              <a href={telHref(place.phone)} className={externalLinkClass}>
                {place.phone}
              </a>
            </p>
          ) : null}
          {website ? (
            <p>
              <ExternalLink href={website}>{displayUrl(website)}</ExternalLink>
            </p>
          ) : null}
        </Row>
      ) : null}

      <footer className="flex flex-col gap-1 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        <p>
          {t.rich("source", {
            source: place.source,
            link: (chunks) => (sourceUrl ? <ExternalLink href={sourceUrl}>{chunks}</ExternalLink> : chunks),
          })}
        </p>
        <p>{t("updated", { date: formatDate(place.updatedAt) })}</p>
      </footer>
    </article>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1 border-t border-neutral-200 pt-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={externalLinkClass}>
      {children}
    </a>
  );
}
