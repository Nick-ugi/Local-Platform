import { expect, test } from "vitest";
import { MAX_QUERY_LENGTH, explorePath, normalizeQuery, pageCount, parsePage, searchPath, withPage } from "./listUrl";

test("a missing page parameter means the first page", () => {
  expect(parsePage(undefined)).toBe(1);
});

test.each([
  ["1", 1],
  ["12", 12],
  ["999999", 999999],
])("page %s is a page", (value, page) => {
  expect(parsePage(value)).toBe(page);
});

test.each([["0"], ["-1"], ["1.5"], ["abc"], [""], ["01"], ["1000000"], [" 2"], ["2 "], ["1e3"]])(
  'page "%s" is not a page',
  (value) => {
    expect(parsePage(value)).toBeNull();
  },
);

test("a repeated page parameter is not a page", () => {
  expect(parsePage(["2", "3"])).toBeNull();
});

test.each([
  [0, 20, 1],
  [20, 20, 1],
  [21, 20, 2],
  [45, 20, 3],
])("%i places at %i a page make %i page(s)", (total, size, pages) => {
  expect(pageCount(total, size)).toBe(pages);
});

test("explorePath names the category in the path", () => {
  expect(explorePath(null)).toBe("/explore");
  expect(explorePath("cafe")).toBe("/explore/cafe");
});

test("withPage leaves the first page out of the URL", () => {
  expect(withPage("/explore", 1)).toBe("/explore");
  expect(withPage("/search?q=pizza", 1)).toBe("/search?q=pizza");
});

test("withPage adds the page to a path with or without a query", () => {
  expect(withPage("/explore/food", 2)).toBe("/explore/food?page=2");
  expect(withPage("/search?q=pizza", 3)).toBe("/search?q=pizza&page=3");
});

test("a missing search parameter is an empty query", () => {
  expect(normalizeQuery(undefined)).toBe("");
  expect(normalizeQuery("   ")).toBe("");
});

test("normalizeQuery trims the words and the gaps between them", () => {
  expect(normalizeQuery("  pizza   bar ")).toBe("pizza bar");
  expect(normalizeQuery("wood\tfired\npizza")).toBe("wood fired pizza");
});

test("normalizeQuery takes the first of a repeated parameter", () => {
  expect(normalizeQuery(["a", "b"])).toBe("a");
});

test("normalizeQuery cuts a query the API would refuse", () => {
  expect(MAX_QUERY_LENGTH).toBe(100);
  expect(normalizeQuery("x".repeat(150))).toBe("x".repeat(100));
  // Cutting must not leave a space at the end, which the API would not count.
  expect(normalizeQuery(`${"x".repeat(99)} yy`)).toBe("x".repeat(99));
});

test("searchPath carries the query as one escaped parameter", () => {
  expect(searchPath("pizza")).toBe("/search?q=pizza");
  expect(searchPath("pizza & co")).toBe("/search?q=pizza+%26+co");
  expect(searchPath("100% pure")).toBe("/search?q=100%25+pure");
});
