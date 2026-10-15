import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderWithMessages } from "@/test/render";
import { Pagination } from "./Pagination";

function pagination() {
  return within(screen.getByRole("navigation", { name: "Pages" }));
}

test("the first page links only forward", () => {
  renderWithMessages(<Pagination path="/explore" page={1} pages={3} />);

  expect(pagination().getByRole("link", { name: "Next" })).toHaveAttribute("href", "/explore?page=2");
  expect(pagination().queryByRole("link", { name: "Previous" })).toBeNull();
  expect(pagination().getByText("Page 1 of 3")).toBeInTheDocument();
});

test("a middle page links both ways", () => {
  renderWithMessages(<Pagination path="/explore/food" page={2} pages={3} />);

  // Page 1 is the path itself, so that the first page has one URL.
  expect(pagination().getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/explore/food");
  expect(pagination().getByRole("link", { name: "Next" })).toHaveAttribute("href", "/explore/food?page=3");
  expect(pagination().getByText("Page 2 of 3")).toBeInTheDocument();
});

test("the last page links only back", () => {
  renderWithMessages(<Pagination path="/search?q=pizza" page={3} pages={3} />);

  expect(pagination().getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/search?q=pizza&page=2");
  expect(pagination().queryByRole("link", { name: "Next" })).toBeNull();
});

test("one page needs no navigation", () => {
  const { container } = renderWithMessages(<Pagination path="/explore" page={1} pages={1} />);

  expect(container).toBeEmptyDOMElement();
});
