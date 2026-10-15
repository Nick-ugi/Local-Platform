import type { PlaceDetail } from "@queenstown/shared";
import { expect, test } from "vitest";
import { placeMetadata } from "./placeMetadata";

const place: PlaceDetail = {
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  address: "12 Beach Street, Queenstown",
  imageUrl: null,
  latitude: -45.0322,
  longitude: 168.661,
  description: "Lakefront restaurant.",
  openingHours: null,
  phone: null,
  website: null,
  source: "Business website",
  sourceUrl: "https://lakesidekitchen.example/about",
  updatedAt: "2026-10-02T01:30:00Z",
};

const labels = { category: "Food", siteName: "Queenstown Local" };

test("describes the place", () => {
  const metadata = placeMetadata(place, labels);

  expect(metadata.title).toBe("Lakeside Kitchen");
  expect(metadata.description).toBe("Lakefront restaurant.");
  expect(metadata.alternates?.canonical).toBe("/places/lakeside-kitchen");
  expect(metadata.openGraph).toMatchObject({
    title: "Lakeside Kitchen",
    description: "Lakefront restaurant.",
    url: "/places/lakeside-kitchen",
    siteName: "Queenstown Local",
    type: "website",
  });
});

test("falls back to category and address", () => {
  const metadata = placeMetadata({ ...place, description: null }, labels);

  expect(metadata.description).toBe("Food · 12 Beach Street, Queenstown");
  expect(metadata.openGraph?.description).toBe("Food · 12 Beach Street, Queenstown");
});

test("cuts a long description at a word", () => {
  const words = "Lakefront   restaurant\nwith views ".repeat(20);
  const description = placeMetadata({ ...place, description: words }, labels).description ?? "";

  expect(words.length).toBeGreaterThan(400);
  expect(description.length).toBeLessThanOrEqual(160);
  expect(description.endsWith("…")).toBe(true);
  expect(description).not.toMatch(/\s{2}|\n/);
  // What comes before the ellipsis is whole words of the original, single-spaced.
  const kept = description.slice(0, -1);
  expect(words.replace(/\s+/g, " ").startsWith(`${kept} `)).toBe(true);
});

test("keeps a short description as it is, single-spaced", () => {
  const metadata = placeMetadata({ ...place, description: "  Lakefront\n\nrestaurant.  " }, labels);

  expect(metadata.description).toBe("Lakefront restaurant.");
});

test("adds the image when there is a safe one", () => {
  const metadata = placeMetadata({ ...place, imageUrl: "https://lakesidekitchen.example/front.jpg" }, labels);

  expect(metadata.openGraph?.images).toEqual([
    { url: "https://lakesidekitchen.example/front.jpg", alt: "Lakeside Kitchen" },
  ]);
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
});

test("leaves the image out when there is no safe one", () => {
  for (const imageUrl of [null, "javascript:alert(1)"]) {
    const metadata = placeMetadata({ ...place, imageUrl }, labels);

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toMatchObject({ card: "summary" });
  }
});

test("encodes the slug", () => {
  const metadata = placeMetadata({ ...place, slug: "a b" }, labels);

  expect(metadata.alternates?.canonical).toBe("/places/a%20b");
  expect(metadata.openGraph?.url).toBe("/places/a%20b");
});
