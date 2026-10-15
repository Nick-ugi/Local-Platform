import { expect, test } from "vitest";
import { sitemapEntries } from "./sitemapEntries";

const site = new URL("https://queenstownlocal.example");

test("lists the fixed pages as full addresses", () => {
  expect(sitemapEntries(null, site).map((entry) => entry.url)).toEqual([
    "https://queenstownlocal.example/",
    "https://queenstownlocal.example/explore",
    "https://queenstownlocal.example/explore/food",
    "https://queenstownlocal.example/explore/cafe",
    "https://queenstownlocal.example/explore/bar",
    "https://queenstownlocal.example/explore/activity",
    "https://queenstownlocal.example/explore/shopping",
    "https://queenstownlocal.example/explore/facility",
    "https://queenstownlocal.example/notices",
    "https://queenstownlocal.example/events",
    "https://queenstownlocal.example/about",
  ]);
});

test("adds every detail page with the time it changed", () => {
  const entries = sitemapEntries(
    {
      places: [{ slug: "lakeside-kitchen", updatedAt: "2026-10-02T01:30:00Z" }],
      events: [{ slug: "night market", updatedAt: "2026-10-01T22:00:00Z" }],
      notices: [{ slug: "works", updatedAt: "2026-10-04T20:15:00Z" }],
    },
    site,
  );

  expect(entries.slice(-3)).toEqual([
    { url: "https://queenstownlocal.example/places/lakeside-kitchen", lastModified: "2026-10-02T01:30:00Z" },
    { url: "https://queenstownlocal.example/events/night%20market", lastModified: "2026-10-01T22:00:00Z" },
    { url: "https://queenstownlocal.example/notices/works", lastModified: "2026-10-04T20:15:00Z" },
  ]);
});
