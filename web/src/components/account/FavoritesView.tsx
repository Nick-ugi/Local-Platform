"use client";

import type { PlaceSummary } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { PlaceCard } from "@/components/place/PlaceCard";
import { getFavorites, removeFavorite } from "@/lib/auth/account";
import { loginPath } from "@/lib/auth/next";

type State = { status: "loading" } | { status: "signedOut" } | { status: "failed" } | { status: "ready"; items: PlaceSummary[] };

/**
 * Favorites (wireframe m-favorites, FAV-02): the saved places as Explore's cards, most recently
 * saved first. The heart removes a place. With none saved it points to Explore.
 */
export function FavoritesView() {
  const t = useTranslations("Favorites");
  const tAccount = useTranslations("Account");
  const tState = useTranslations("State");
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let gone = false;
    getFavorites().then(
      (favorites) => !gone && setState(favorites === null ? { status: "signedOut" } : { status: "ready", items: favorites.items }),
      () => !gone && setState({ status: "failed" }),
    );
    return () => {
      gone = true;
    };
  }, [attempt]);

  async function remove(place: PlaceSummary) {
    if (state.status !== "ready") return;
    const before = state.items;
    setState({ status: "ready", items: before.filter((item) => item.slug !== place.slug) });
    try {
      await removeFavorite(place.slug);
    } catch {
      setState({ status: "ready", items: before });
    }
  }

  const message = "px-4 py-10 text-center text-neutral-600";
  if (state.status === "loading") {
    return <p className={message}>{tState("loading")}</p>;
  }
  if (state.status === "signedOut") {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="text-neutral-600">{t("loginToSee")}</p>
        <Link href={loginPath("/favorites")} className="rounded-lg bg-neutral-950 px-4 py-2 font-semibold text-white">
          {tAccount("login")}
        </Link>
      </div>
    );
  }
  if (state.status === "failed") {
    return (
      <p role="alert" className={`${message} flex items-center justify-center gap-3`}>
        {t("loadFailed")}
        <button type="button" onClick={() => setAttempt((n) => n + 1)} className="min-h-11 font-semibold underline">
          {t("retry")}
        </button>
      </p>
    );
  }
  if (state.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="text-neutral-600">{t("empty")}</p>
        <Link href="/explore" className="rounded-lg border border-neutral-950 px-4 py-2 font-semibold">
          {tState("goToExplore")}
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-neutral-200 border-b border-neutral-200">
      {state.items.map((place) => (
        <li key={place.slug} className="flex items-center pr-2">
          <div className="min-w-0 flex-1">
            <PlaceCard place={place} />
          </div>
          <button
            type="button"
            onClick={() => void remove(place)}
            aria-label={t("remove", { name: place.name })}
            className="flex size-11 shrink-0 items-center justify-center text-2xl"
          >
            <span aria-hidden="true">♥</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
