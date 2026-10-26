import type { Category } from "@queenstown/shared";
import { notFound } from "next/navigation";
import { loadPlaceList } from "@/lib/places/loadPlaceList";
import { ExploreScreen } from "./ExploreScreen";

/** A page of Explore's list, drawn once the server has it from the backend. Past the end it is a 404. */
export async function ExploreList({
  category,
  page,
}: {
  category: Category | null;
  page: string | string[] | undefined;
}) {
  const list = await loadPlaceList({ category, q: null }, page);
  if (!list) {
    notFound();
  }
  return <ExploreScreen query={list.query} result={list.result} />;
}
