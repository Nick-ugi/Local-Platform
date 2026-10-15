import type { EventDetail, NoticeDetail, PlaceDetail } from "@queenstown/shared";
import { getEvent } from "@/api/events";
import { getNotice } from "@/api/notices";
import { getPlace } from "@/api/places";
import { lookUp } from "../lookUp";

jest.mock("@/api/places", () => ({ getPlace: jest.fn() }));
jest.mock("@/api/events", () => ({ getEvent: jest.fn() }));
jest.mock("@/api/notices", () => ({ getNotice: jest.fn() }));

const place = {
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  latitude: -45.0322,
  longitude: 168.661,
} as PlaceDetail;

const event = {
  slug: "night-market",
  title: "Night Market",
  startsAt: "2026-10-09T04:00:00Z",
  endsAt: null,
  venueName: "Earnslaw Park",
  latitude: -45.0318,
  longitude: 168.6602,
  ended: false,
} as EventDetail;

const notice = {
  slug: "works",
  title: "Works",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-05T18:00:00Z",
  endsAt: null,
  latitude: -45.03,
  longitude: 168.66,
  ended: false,
} as NoticeDetail;

test("a place becomes its marker", async () => {
  jest.mocked(getPlace).mockResolvedValue(place);

  await expect(lookUp({ kind: "place", slug: "lakeside-kitchen" })).resolves.toEqual({
    kind: "place",
    slug: "lakeside-kitchen",
    latitude: -45.0322,
    longitude: 168.661,
    name: "Lakeside Kitchen",
    category: "food",
    subtype: null,
  });
});

test("a place that is gone is nothing", async () => {
  jest.mocked(getPlace).mockResolvedValue(null);

  await expect(lookUp({ kind: "place", slug: "gone" })).resolves.toBeNull();
});

test("a current event becomes its marker, an ended one is nothing", async () => {
  jest.mocked(getEvent).mockResolvedValue(event);
  await expect(lookUp({ kind: "event", slug: "night-market" })).resolves.toMatchObject({
    kind: "event",
    title: "Night Market",
    venueName: "Earnslaw Park",
  });

  jest.mocked(getEvent).mockResolvedValue({ ...event, ended: true });
  await expect(lookUp({ kind: "event", slug: "night-market" })).resolves.toBeNull();
});

test("a notice needs to be current and to have a location", async () => {
  jest.mocked(getNotice).mockResolvedValue(notice);
  await expect(lookUp({ kind: "notice", slug: "works" })).resolves.toMatchObject({ kind: "notice", isOfficial: true });

  jest.mocked(getNotice).mockResolvedValue({ ...notice, latitude: null, longitude: null });
  await expect(lookUp({ kind: "notice", slug: "works" })).resolves.toBeNull();

  jest.mocked(getNotice).mockResolvedValue({ ...notice, ended: true });
  await expect(lookUp({ kind: "notice", slug: "works" })).resolves.toBeNull();
});
