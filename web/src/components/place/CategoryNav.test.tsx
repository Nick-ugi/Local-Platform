import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithMessages } from "@/test/render";
import { CategoryNav } from "./CategoryNav";

function links() {
  return within(screen.getByRole("navigation", { name: "Categories" })).getAllByRole("link");
}

test("links to every category", () => {
  renderWithMessages(<CategoryNav active={null} />);

  expect(links().map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["All", "/explore"],
    ["Food", "/explore/food"],
    ["Cafes", "/explore/cafe"],
    ["Bars", "/explore/bar"],
    ["Activities", "/explore/activity"],
    ["Shopping", "/explore/shopping"],
    ["Facilities", "/explore/facility"],
  ]);
});

test("marks the active category", () => {
  renderWithMessages(<CategoryNav active="cafe" />);

  const current = links().filter((link) => link.getAttribute("aria-current") === "page");
  expect(current.map((link) => link.textContent)).toEqual(["Cafes"]);
});

test("marks All when no category is chosen", () => {
  renderWithMessages(<CategoryNav active={null} />);

  const current = links().filter((link) => link.getAttribute("aria-current") === "page");
  expect(current.map((link) => link.textContent)).toEqual(["All"]);
});
