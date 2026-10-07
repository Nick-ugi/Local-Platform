import { screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { BottomNav } from "./BottomNav";

const location = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => location.pathname }));

function tabs() {
  return within(screen.getByRole("navigation", { name: "Main" })).getAllByRole("link");
}

test("shows the four tabs in order with their links", () => {
  location.pathname = "/";
  renderWithMessages(<BottomNav />);

  expect(tabs().map((tab) => [tab.textContent, tab.getAttribute("href")])).toEqual([
    ["Map", "/"],
    ["Explore", "/explore"],
    ["Local", "/notices"],
    ["More", "/more"],
  ]);
});

test("marks only the active tab as the current page", () => {
  location.pathname = "/places/lakeside-kitchen";
  renderWithMessages(<BottomNav />);

  expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("aria-current", "page");
  for (const name of ["Map", "Local", "More"]) {
    expect(screen.getByRole("link", { name })).not.toHaveAttribute("aria-current");
  }
});

test("marks nothing on a path outside every tab", () => {
  location.pathname = "/nope";
  renderWithMessages(<BottomNav />);

  for (const tab of tabs()) {
    expect(tab).not.toHaveAttribute("aria-current");
  }
});
