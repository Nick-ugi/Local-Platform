"use client";

import { MAX_QUERY_LENGTH, normalizeQuery } from "@queenstown/shared";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type FormEvent, Suspense, useRef, useState } from "react";
import { searchPath } from "@/lib/places/listUrl";

/**
 * The form itself. It is an ordinary GET form to /search, so it works before the scripts have
 * loaded; with them, submitting goes to the results without loading the page again.
 */
function SearchForm({ initial }: { initial: string }) {
  const t = useTranslations("Search");
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const input = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = normalizeQuery(value);
    // Nothing to look for: stay on the screen.
    if (q !== "") {
      router.push(searchPath(q));
    }
  }

  function clear() {
    setValue("");
    input.current?.focus();
  }

  return (
    <form
      role="search"
      action="/search"
      method="get"
      onSubmit={submit}
      className="flex h-11 items-center rounded-full border border-neutral-400 bg-white pl-4 focus-within:border-neutral-950"
    >
      <input
        ref={input}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        placeholder={t("label")}
        aria-label={t("label")}
        enterKeyHint="search"
        // The form has its own clear button, the same in every browser.
        className="h-full min-w-0 flex-1 bg-transparent outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value !== "" ? (
        <button
          type="button"
          aria-label={t("clear")}
          onClick={clear}
          className="flex size-11 shrink-0 items-center justify-center text-xl leading-none text-neutral-600"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}
    </form>
  );
}

/** Starts from the keyword in the address on the Search screen, and empty everywhere else. */
function SearchBoxForAddress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = pathname === "/search" ? normalizeQuery(searchParams.get("q") ?? undefined) : "";

  // A new keyword in the address is a new search: the box starts over from it.
  return <SearchForm key={q} initial={q} />;
}

/**
 * The search box (wireframes m-map, m-explore, m-search and d-map). Typing a keyword and
 * submitting leads to the Search screen, where the box shows that keyword.
 *
 * The keyword comes from the query of the address, which a prerendered page cannot know, so the
 * part that reads it waits inside Suspense with an empty box in its place.
 */
export function SearchBox() {
  return (
    <Suspense fallback={<SearchForm initial="" />}>
      <SearchBoxForAddress />
    </Suspense>
  );
}
