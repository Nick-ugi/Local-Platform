import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ListQuery } from "@/lib/places/listUrl";
import { pageOf, placeSummary } from "@/test/places";
import { renderWithMessages } from "@/test/render";
import { SearchResults } from "./SearchResults";

const pizza: ListQuery = { category: null, q: "pizza", page: 1 };

const places = [
  placeSummary({ slug: "wakatipu-pizza", name: "Wakatipu Pizza Co." }),
  placeSummary({ slug: "lakeside-kitchen", name: "Lakeside Kitchen" }),
  placeSummary({ slug: "frankton-slice-bar", name: "Frankton Slice Bar" }),
];

test("counts the results", () => {
  renderWithMessages(<SearchResults query={pizza} result={pageOf(places)} />);

  expect(screen.getByText("3 results")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Wakatipu Pizza Co\./ })).toHaveAttribute("href", "/places/wakatipu-pizza");
});

test("counts a single result as one", () => {
  renderWithMessages(<SearchResults query={pizza} result={pageOf(places.slice(0, 1))} />);

  expect(screen.getByText("1 result")).toBeInTheDocument();
});

test("counts the whole list, not the page", () => {
  renderWithMessages(<SearchResults query={pizza} result={pageOf(places, { total: 45 })} />);

  expect(screen.getByText("45 results")).toBeInTheDocument();
});

test("says so when nothing matches", () => {
  renderWithMessages(<SearchResults query={{ ...pizza, q: "pizza" }} result={pageOf([])} />);

  expect(screen.getByText("No places match “pizza”.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to Explore" })).toHaveAttribute("href", "/explore");
  expect(screen.queryByText(/result/)).toBeNull();
});

test("pages keep the keyword", () => {
  renderWithMessages(<SearchResults query={pizza} result={pageOf(places, { total: 45 })} />);

  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/search?q=pizza&page=2");
});

test("pages keep a keyword that needs escaping", () => {
  renderWithMessages(
    <SearchResults
      query={{ category: null, q: "fish & chips", page: 2 }}
      result={pageOf(places, { page: 2, total: 45 })}
    />,
  );

  expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/search?q=fish+%26+chips");
  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/search?q=fish+%26+chips&page=3");
});
