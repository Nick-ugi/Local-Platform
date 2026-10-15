import type { PlaceDetail } from "@queenstown/shared";
import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithMessages } from "@/test/render";
import { PlaceActions } from "./PlaceActions";

const full: PlaceDetail = {
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  address: "12 Beach Street, Queenstown",
  imageUrl: null,
  latitude: -45.0322,
  longitude: 168.661,
  description: null,
  openingHours: null,
  phone: "03 000 0000",
  website: "https://lakesidekitchen.example",
  source: "Business website",
  sourceUrl: "https://lakesidekitchen.example/about",
  updatedAt: "2026-10-02T01:30:00Z",
};

function actionNames() {
  const group = within(screen.getByRole("group", { name: "Quick actions" }));
  return [...group.queryAllByRole("link"), ...group.queryAllByRole("button")]
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    .map((element) => element.textContent);
}

test("offers every action the place supports", () => {
  renderWithMessages(<PlaceActions place={full} />);

  expect(actionNames()).toEqual(["Call", "Website", "Directions", "Share"]);
  expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:030000000");

  const website = screen.getByRole("link", { name: "Website" });
  expect(website).toHaveAttribute("href", "https://lakesidekitchen.example");
  expect(website).toHaveAttribute("target", "_blank");
  expect(website).toHaveAttribute("rel", "noopener noreferrer");

  expect(screen.getByRole("link", { name: "Directions" })).toHaveAttribute(
    "href",
    "https://www.google.com/maps/dir/?api=1&destination=-45.0322,168.661",
  );
});

test("leaves out what the place lacks", () => {
  renderWithMessages(<PlaceActions place={{ ...full, phone: null, website: null }} />);

  expect(actionNames()).toEqual(["Directions", "Share"]);
});

test("leaves out what is not safe to link", () => {
  renderWithMessages(<PlaceActions place={{ ...full, phone: "call us", website: "javascript:alert(1)" }} />);

  expect(actionNames()).toEqual(["Directions", "Share"]);
});
