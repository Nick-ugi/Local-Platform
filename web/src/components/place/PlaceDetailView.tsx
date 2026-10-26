import {
  displayUrl,
  formatDate,
  formatWeeklyHours,
  httpUrl,
  type PlaceDetail,
  parseOpeningHours,
  telHref,
} from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense } from "react";
import { FavoriteButton } from "@/components/account/FavoriteButton";
import { BackLink } from "@/components/nav/BackLink";
import { OpenBadge } from "./OpenBadge";
import { PlaceActions } from "./PlaceActions";
import { PlaceImage } from "./PlaceImage";
import { ViewOnMapLink } from "./ViewOnMapLink";

const externalLinkClass = "text-blue-700 underline underline-offset-2";

/**
 * Place detail (wireframes m-place and d-place). Rows the place has no value for are left out;
 * the source and the date it was updated are always there.
 *
 * There is one DOM for both widths. From 768px it is two columns: the picture, name and
 * description on the left, everything the visitor acts on in a 360px column on the right. On a
 * phone the two column wrappers are `display: contents`, so their children join one column and
 * `order` puts the quick actions right under the name.
 *
 * "Suggest an edit" (MORE-02) is a mailto: link to the operator, given by the page when the site has
 * a contact address.
 */
export function PlaceDetailView({
  place,
  suggestEditHref = null,
}: {
  place: PlaceDetail;
  suggestEditHref?: string | null;
}) {
  const t = useTranslations("Place");
  const tNav = useTranslations("Nav");
  const tCategory = useTranslations("Category");
  const tSubtype = useTranslations("Subtype");

  const website = place.website ? httpUrl(place.website) : null;
  const tel = place.phone ? telHref(place.phone) : null;
  const sourceUrl = httpUrl(place.sourceUrl);
  const weekly = parseOpeningHours(place.openingHours);
  const hasContact = Boolean(place.phone || website);
  const kind =
    place.subtype && place.subtype !== "other"
      ? `${tCategory(place.category)} · ${tSubtype(place.subtype)}`
      : tCategory(place.category);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 [overflow-wrap:anywhere] md:grid md:max-w-5xl md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-x-8 md:gap-y-5 md:px-8 md:py-6">
      {/* Phones get a Back link (wireframe m-place), wider screens the breadcrumb (d-place). */}
      <div className="order-1 -mb-3 md:hidden">
        <BackLink fallbackHref="/explore" />
      </div>
      <nav aria-label={t("breadcrumb")} className="hidden gap-2 text-sm text-neutral-500 md:col-span-2 md:flex">
        <Link href="/explore">{tNav("explore")}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/explore/${place.category}`}>{tCategory(place.category)}</Link>
      </nav>

      <div className="contents md:flex md:flex-col md:gap-5">
        {/* An image that is missing or does not load leaves no gap. */}
        <PlaceImage
          src={place.imageUrl}
          alt={place.name}
          className="order-2 aspect-[16/9] w-full rounded-xl bg-neutral-200 object-cover md:order-none"
        />

        <header className="order-3 flex items-start gap-2 md:order-none">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{place.name}</h1>
            <p className="text-neutral-600">{kind}</p>
          </div>
          {/* The heart reads ?favorite= after a visit to Log in, which a server render cannot wait for. */}
          <Suspense fallback={<span className="size-11 shrink-0" />}>
            <FavoriteButton slug={place.slug} />
          </Suspense>
        </header>

        {place.description ? <p className="order-5 md:order-none">{place.description}</p> : null}
      </div>

      <div className="contents md:flex md:flex-col md:gap-5">
        <div className="order-4 md:order-none">
          <PlaceActions place={place} />
        </div>

        <Row title={t("address")} className="order-6">
          <p>{place.address}</p>
          <ViewOnMapLink
            place={place}
            className="flex min-h-11 items-center self-start font-semibold text-blue-700 underline underline-offset-2"
          />
        </Row>

        {place.openingHours ? (
          <Row title={t("openingHours")} className="order-7">
            <OpenBadge openingHours={place.openingHours} className="self-start" />
            {/* OpenStreetMap's hours one line per run of days; anything else as written. */}
            {(weekly ? formatWeeklyHours(weekly) : [place.openingHours]).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </Row>
        ) : null}

        {hasContact ? (
          <Row title={t("contact")} className="order-8">
            {place.phone ? (
              <p>
                {tel ? (
                  <a href={tel} className={externalLinkClass}>
                    {place.phone}
                  </a>
                ) : (
                  place.phone
                )}
              </p>
            ) : null}
            {website ? (
              <p>
                <ExternalLink href={website}>{displayUrl(website)}</ExternalLink>
              </p>
            ) : null}
          </Row>
        ) : null}

        <footer className="order-9 flex flex-col gap-1 border-t border-neutral-200 pt-4 text-sm text-neutral-500 md:order-none">
          <p>
            {t.rich("source", {
              source: place.source,
              link: (chunks) => (sourceUrl ? <ExternalLink href={sourceUrl}>{chunks}</ExternalLink> : chunks),
            })}
          </p>
          <p>{t("updated", { date: formatDate(place.updatedAt) })}</p>
          {suggestEditHref ? (
            <p>
              <a href={suggestEditHref} className={externalLinkClass}>
                {t("suggestEdit")}
              </a>
            </p>
          ) : null}
        </footer>
      </div>
    </article>
  );
}

function Row({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`${className} flex flex-col gap-1 border-t border-neutral-200 pt-4 md:order-none`}>
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
