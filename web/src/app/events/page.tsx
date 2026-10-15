import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EventsScreen } from "@/components/local/LocalLists";
import { loadEvents } from "@/lib/local/loadLists";
import { eventsPath } from "@/lib/local/listUrl";
import { parsePage, withPage } from "@/lib/places/listUrl";

type Props = { searchParams: Promise<{ when?: string | string[]; page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ page }, tPages, tLocal] = await Promise.all([
    searchParams,
    getTranslations("Pages"),
    getTranslations("Local"),
  ]);
  return {
    title: tPages("events"),
    description: tLocal("eventsDescription"),
    alternates: { canonical: withPage(eventsPath(null), parsePage(page) ?? 1) },
  };
}

export default async function EventsPage({ searchParams }: Props) {
  const { when, page } = await searchParams;
  const list = await loadEvents(when, page);
  if (!list) {
    notFound();
  }
  return <EventsScreen when={list.when} result={list.result} />;
}
