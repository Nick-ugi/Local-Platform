"use client";

import type { Page, PlaceSummary } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { useVisitorPosition } from "@/lib/geo/useVisitorPosition";
import type { ListQuery } from "@/lib/places/listUrl";
import { usePlaceList } from "@/lib/places/usePlaceList";
import { PlaceGrid } from "./PlaceGrid";

type Props = {
  query: ListQuery;
  /** The page as the server drew it, ordered from the centre of Queenstown. */
  initial: Page<PlaceSummary>;
  /** What to say when the list has no places. */
  emptyText: string;
};

/** The message for each way of not getting a usable position (docs/03-user-flow.md, UF-01). */
const LOCATION_PROBLEMS = {
  outside: "outsideArea",
  denied: "locationDenied",
  unavailable: "locationUnavailable",
} as const;

const actionClass = "min-h-11 shrink-0 font-semibold underline underline-offset-2";

/**
 * A list of places with its "Nearest first" line (wireframe m-explore). The server's list runs
 * from the centre of Queenstown and has no distances. Once the visitor's position is known, on
 * their request or because they allowed it on an earlier visit, the same page is fetched again
 * from that position and shows distances. A visitor outside the area keeps the server's list.
 */
export function NearbyPlaces({ query, initial, emptyText }: Props) {
  const t = useTranslations("Nearby");
  const { position, problem, locating, request } = useVisitorPosition();
  const { result, status, retry } = usePlaceList(query, initial, position);

  if (initial.items.length === 0) {
    return <p className="px-4 py-10 text-center text-neutral-600 md:px-8">{emptyText}</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex min-h-11 items-center justify-between gap-3 px-4 text-sm text-neutral-600 md:px-8">
        <span>{t("nearestFirst")}</span>
        {position ? (
          <span>{t("fromYourLocation")}</span>
        ) : (
          <button type="button" onClick={() => void request()} disabled={locating} className={actionClass}>
            {locating ? t("locating") : t("useMyLocation")}
          </button>
        )}
      </div>
      <div role="status" className="px-4 text-sm md:px-8">
        {problem ? <p className="pb-2">{t(LOCATION_PROBLEMS[problem])}</p> : null}
        {status === "error" ? (
          <p className="flex items-center gap-3 pb-2">
            <span>{t("sortFailed")}</span>
            <button type="button" onClick={retry} className={actionClass}>
              {t("retry")}
            </button>
          </p>
        ) : null}
      </div>
      <PlaceGrid places={result.items} busy={status === "loading"} />
    </div>
  );
}
