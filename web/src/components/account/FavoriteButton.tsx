"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getFavorites, removeFavorite, saveFavorite } from "@/lib/auth/account";
import { loginPath } from "@/lib/auth/next";

type State = "loading" | "signedOut" | "saved" | "notSaved";

/**
 * The heart of a place (wireframe m-place, FAV-01). A visitor who is not signed in goes to Log in
 * and comes back with ?favorite=1, and the place is saved then (m-login, 1).
 */
export function FavoriteButton({ slug }: { slug: string }) {
  const t = useTranslations("Favorites");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const wantsSave = params.get("favorite") === "1";
  const [state, setState] = useState<State>("loading");
  const [failed, setFailed] = useState(false);
  const handledReturn = useRef(false);

  useEffect(() => {
    let gone = false;
    getFavorites().then(
      async (favorites) => {
        if (gone) return;
        if (favorites === null) {
          setState("signedOut");
          return;
        }
        const saved = favorites.items.some((place) => place.slug === slug);
        // Back from Log in to save this place: finish what the visitor started.
        if (wantsSave && !saved && !handledReturn.current) {
          handledReturn.current = true;
          await saveFavorite(slug).then(
            () => !gone && setState("saved"),
            () => !gone && (setState("notSaved"), setFailed(true)),
          );
        } else {
          setState(saved ? "saved" : "notSaved");
        }
        if (wantsSave) {
          router.replace(pathname, { scroll: false });
        }
      },
      () => !gone && setState("notSaved"),
    );
    return () => {
      gone = true;
    };
  }, [slug, wantsSave, pathname, router]);

  async function toggle() {
    if (state === "signedOut") {
      router.push(loginPath(`${pathname}?favorite=1`));
      return;
    }
    const saving = state === "notSaved";
    setFailed(false);
    setState(saving ? "saved" : "notSaved");
    try {
      await (saving ? saveFavorite(slug) : removeFavorite(slug));
    } catch {
      setState(saving ? "notSaved" : "saved");
      setFailed(true);
    }
  }

  const saved = state === "saved";
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={state === "loading"}
        aria-pressed={state === "signedOut" || state === "loading" ? undefined : saved}
        aria-label={saved ? t("saved") : t("save")}
        className="flex size-11 items-center justify-center rounded-full text-2xl leading-none disabled:opacity-40"
      >
        <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      </button>
      <p role="status" className="absolute right-0 top-full z-10 w-max max-w-64 text-sm text-red-700 empty:hidden">
        {failed ? t("saveFailed") : null}
      </p>
    </div>
  );
}
