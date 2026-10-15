import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { pageOf, placeSummary } from "@/test/places";
import { renderWithMessages } from "@/test/render";
import { ExploreScreen } from "./ExploreScreen";

const places = [
  placeSummary({ slug: "lakeside-kitchen", name: "Lakeside Kitchen" }),
  placeSummary({ slug: "harbour-coffee", name: "Harbour Coffee", category: "cafe" }),
];

test("titles the screen Explore", () => {
  renderWithMessages(<ExploreScreen query={{ category: null, q: null, page: 1 }} result={pageOf(places)} />);

  expect(screen.getByRole("heading", { level: 1, name: "Explore" })).toBeInTheDocument();
});

test("titles a category's screen with the category", () => {
  renderWithMessages(<ExploreScreen query={{ category: "cafe", q: null, page: 1 }} result={pageOf(places)} />);

  expect(screen.getByRole("heading", { level: 1, name: "Cafes" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Cafes" })).toHaveAttribute("aria-current", "page");
});

test("lists the places", () => {
  renderWithMessages(<ExploreScreen query={{ category: null, q: null, page: 1 }} result={pageOf(places)} />);

  expect(screen.getByRole("link", { name: /Lakeside Kitchen/ })).toHaveAttribute("href", "/places/lakeside-kitchen");
  expect(screen.getByRole("link", { name: /Harbour Coffee/ })).toHaveAttribute("href", "/places/harbour-coffee");
});

test("says so when there are no places at all", () => {
  renderWithMessages(<ExploreScreen query={{ category: null, q: null, page: 1 }} result={pageOf([])} />);

  expect(screen.getByText("No places yet.")).toBeInTheDocument();
});

test("says so when a category has no places", () => {
  renderWithMessages(<ExploreScreen query={{ category: "bar", q: null, page: 1 }} result={pageOf([])} />);

  expect(screen.getByText("No places in this category yet.")).toBeInTheDocument();
  // The way to the other categories stays.
  expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/explore");
});

test("pages keep the category", () => {
  renderWithMessages(
    <ExploreScreen query={{ category: "food", q: null, page: 1 }} result={pageOf(places, { total: 45 })} />,
  );

  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/explore/food?page=2");
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
});
