import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithMessages } from "@/test/render";
import NotFound from "./not-found";

// docs/03-user-flow.md: a missing page offers the Map and Explore.
test("explains that the page is missing and links to the Map and Explore", () => {
  renderWithMessages(<NotFound />);

  expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to Map" })).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: "Go to Explore" })).toHaveAttribute("href", "/explore");
});
