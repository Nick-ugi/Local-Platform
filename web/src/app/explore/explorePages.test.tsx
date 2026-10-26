import type { Page, PlaceSummary } from "@queenstown/shared";
import { isValidElement, type ReactElement, Suspense } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import { getPlaces } from "@/lib/api/places";
import { LoadingState } from "@/components/state/LoadingState";
import ExploreCategoryPage from "./[category]/page";
import ExplorePage from "./page";

vi.mock("@/lib/api/places", () => ({ getPlaces: vi.fn() }));

const NOT_FOUND = { digest: expect.stringContaining("404") };

function page(items: PlaceSummary[]): Page<PlaceSummary> {
  return { items, page: 2, size: 20, total: 20 + items.length };
}

function props(category: string | null, pageParam?: string) {
  return {
    params: Promise.resolve({ category: category ?? "" }),
    searchParams: Promise.resolve(pageParam === undefined ? {} : { page: pageParam }),
  };
}

beforeEach(() => {
  vi.mocked(getPlaces).mockReset();
});

test("an unknown category or a page that is not a number is a real 404, before anything is sent", async () => {
  await expect(ExploreCategoryPage(props("spaceships"))).rejects.toMatchObject(NOT_FOUND);
  await expect(ExploreCategoryPage(props("cafe", "two"))).rejects.toMatchObject(NOT_FOUND);
  await expect(ExplorePage(props(null, "0"))).rejects.toMatchObject(NOT_FOUND);
  expect(getPlaces).not.toHaveBeenCalled();
});

test("the first page streams a loading screen while the list loads, since a sleeping backend takes its time", async () => {
  for (const element of [await ExplorePage(props(null)), await ExploreCategoryPage(props("cafe", "1"))]) {
    expect(isValidElement(element) && element.type).toBe(Suspense);
    const fallback = (element as ReactElement<{ fallback: ReactElement }>).props.fallback;
    expect(fallback.type).toBe(LoadingState);
  }
});

/** Draws a server component the way the server does, without a Suspense boundary to stream from. */
async function draw(element: ReactElement): Promise<unknown> {
  const type = element.type as (props: unknown) => unknown;
  return type(element.props);
}

test("a later page waits for its list without streaming, so a page past the end stays a real 404", async () => {
  vi.mocked(getPlaces).mockResolvedValue(page([]));

  for (const element of [await ExplorePage(props(null, "9")), await ExploreCategoryPage(props("cafe", "9"))]) {
    expect(element.type).not.toBe(Suspense);
    await expect(draw(element)).rejects.toMatchObject(NOT_FOUND);
  }
});
