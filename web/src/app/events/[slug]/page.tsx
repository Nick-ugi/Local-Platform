import { formatEventWhen } from "@queenstown/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";
import { EventDetailView } from "@/components/local/EventDetailView";
import { getEvent } from "@/lib/api/events";
import { eventMetadata } from "@/lib/seo/localMetadata";

type Props = { params: Promise<{ slug: string }> };

// generateMetadata and the page both need the event; cache() makes that one API call per request.
const loadEvent = cache(getEvent);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) {
    return {};
  }
  const tNav = await getTranslations("Nav");
  return eventMetadata(event, {
    when: formatEventWhen(event.startsAt, event.endsAt, { year: true }),
    siteName: tNav("brand"),
  });
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) {
    notFound();
  }
  return <EventDetailView event={event} />;
}
