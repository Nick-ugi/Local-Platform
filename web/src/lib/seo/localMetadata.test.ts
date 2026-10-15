import type { EventDetail, NoticeDetail } from "@queenstown/shared";
import { expect, test } from "vitest";
import { eventMetadata, noticeMetadata } from "./localMetadata";

const event: EventDetail = {
  slug: "lakefront-night-market",
  title: "Lakefront Night Market",
  startsAt: "2026-10-09T04:00:00Z",
  endsAt: "2026-10-09T08:00:00Z",
  venueName: "Earnslaw Park",
  imageUrl: null,
  latitude: -45.0331,
  longitude: 168.6597,
  description: "Food stalls and live music on the lakefront.",
  address: null,
  source: "Organiser",
  sourceUrl: "https://nightmarket.example",
  updatedAt: "2026-10-01T22:00:00Z",
  ended: false,
};

const notice: NoticeDetail = {
  slug: "shotover-street-road-works",
  title: "Shotover Street road works",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-05T18:00:00Z",
  endsAt: null,
  summary: "Road works on Shotover Street.\n\nExpect delays.",
  locationName: null,
  latitude: null,
  longitude: null,
  sourceOrg: "Queenstown Lakes District Council",
  sourceUrl: "https://council.example/notices/shotover-street",
  updatedAt: "2026-10-04T20:15:00Z",
  ended: false,
};

const labels = { when: "Fri 9 Oct 2026 · 5:00 pm - 9:00 pm", siteName: "Queenstown Local" };

test("describes an event", () => {
  const metadata = eventMetadata(event, labels);

  expect(metadata.title).toBe("Lakefront Night Market");
  expect(metadata.description).toBe("Food stalls and live music on the lakefront.");
  expect(metadata.alternates?.canonical).toBe("/events/lakefront-night-market");
  expect(metadata.openGraph).toMatchObject({ url: "/events/lakefront-night-market", siteName: "Queenstown Local" });
  expect(metadata.robots).toBeUndefined();
});

test("an event without a description is described by when and where", () => {
  expect(eventMetadata({ ...event, description: null }, labels).description).toBe(
    "Fri 9 Oct 2026 · 5:00 pm - 9:00 pm · Earnslaw Park",
  );
});

test("an event's safe picture is shared with the link", () => {
  const metadata = eventMetadata({ ...event, imageUrl: "https://nightmarket.example/stalls.jpg" }, labels);

  expect(metadata.openGraph?.images).toEqual([
    { url: "https://nightmarket.example/stalls.jpg", alt: "Lakefront Night Market" },
  ]);
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  expect(eventMetadata({ ...event, imageUrl: "javascript:alert(1)" }, labels).openGraph?.images).toBeUndefined();
});

test("describes a notice by its summary on one line", () => {
  const metadata = noticeMetadata(notice, labels);

  expect(metadata.description).toBe("Road works on Shotover Street. Expect delays.");
  expect(metadata.alternates?.canonical).toBe("/notices/shotover-street-road-works");
  expect(metadata.twitter).toMatchObject({ card: "summary" });
});

test("an ended event or notice asks not to be indexed", () => {
  expect(eventMetadata({ ...event, ended: true }, labels).robots).toEqual({ index: false, follow: true });
  expect(noticeMetadata({ ...notice, ended: true }, labels).robots).toEqual({ index: false, follow: true });
});
