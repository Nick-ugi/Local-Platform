import type { EventDetail, NoticeDetail } from "@queenstown/shared";
import type { Metadata } from "next";
import { httpUrl } from "@/lib/format";
import { shorten } from "./text";

/**
 * The parts every detail page shares: title, description, canonical address, Open Graph and the
 * Twitter card. An ended event or notice keeps its page for links that point at it, but asks
 * search engines to drop it (docs/02-information-architecture.md, "URL 규칙").
 */
function detailMetadata(page: {
  title: string;
  description: string;
  path: string;
  siteName: string;
  image: string | null;
  ended: boolean;
}): Metadata {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.path,
      siteName: page.siteName,
      type: "website",
      ...(page.image ? { images: [{ url: page.image, alt: page.title }] } : {}),
    },
    twitter: { card: page.image ? "summary_large_image" : "summary" },
    ...(page.ended ? { robots: { index: false, follow: true } } : {}),
  };
}

/** An event's page (SEO-01). Without a description it is described by when and where it is on. */
export function eventMetadata(event: EventDetail, labels: { when: string; siteName: string }): Metadata {
  return detailMetadata({
    title: event.title,
    description: event.description ? shorten(event.description) : `${labels.when} · ${event.venueName}`,
    path: `/events/${encodeURIComponent(event.slug)}`,
    siteName: labels.siteName,
    image: event.imageUrl ? httpUrl(event.imageUrl) : null,
    ended: event.ended,
  });
}

/** A notice's page (SEO-01), described by its summary. */
export function noticeMetadata(notice: NoticeDetail, labels: { siteName: string }): Metadata {
  return detailMetadata({
    title: notice.title,
    description: shorten(notice.summary),
    path: `/notices/${encodeURIComponent(notice.slug)}`,
    siteName: labels.siteName,
    image: null,
    ended: notice.ended,
  });
}
