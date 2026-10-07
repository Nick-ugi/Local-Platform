import { screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { TopNav } from "./TopNav";

const location = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.pathname }));

function menuLinks() {
  return within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link");
}

test("shows the brand and the four menus in order with their links", () => {
  location.pathname = "/";
  renderWithMessages(<TopNav />);

  expect(screen.getByText("Queenstown Local")).toBeInTheDocument();
  expect(menuLinks().map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
    ["Map", "/"],
    ["Explore", "/explore"],
    ["Local", "/notices"],
    ["More", "/more"],
  ]);
});

test("marks only the active menu as the current page", () => {
  location.pathname = "/places/lakeside-kitchen";
  renderWithMessages(<TopNav />);

  expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("aria-current", "page");
  for (const name of ["Map", "Local", "More"]) {
    expect(screen.getByRole("link", { name })).not.toHaveAttribute("aria-current");
  }
});

test("marks nothing on a path outside every menu", () => {
  location.pathname = "/nope";
  renderWithMessages(<TopNav />);

  for (const link of menuLinks()) {
    expect(link).not.toHaveAttribute("aria-current");
  }
});
