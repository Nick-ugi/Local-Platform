import { expect, test } from "vitest";
import { parseFilter, serializeFilter, toggleFilter } from "./filter";

test("reads the filter from the URL value", () => {
  expect(parseFilter("food,cafe")).toEqual(["food", "cafe"]);
});

test("keeps the category order whatever the URL order", () => {
  expect(parseFilter("cafe,food")).toEqual(["food", "cafe"]);
});

test("drops unknown values and repeats", () => {
  expect(parseFilter("food,hotel,food,,event")).toEqual(["food"]);
});

test("reads nothing from a missing or empty value", () => {
  expect(parseFilter(null)).toEqual([]);
  expect(parseFilter("")).toEqual([]);
});

test("writes the filter for the URL", () => {
  expect(serializeFilter(["food", "cafe"])).toBe("food,cafe");
  expect(serializeFilter([])).toBeNull();
});

test("toggling adds and removes", () => {
  expect(toggleFilter(["food"], "cafe")).toEqual(["food", "cafe"]);
  expect(toggleFilter(["food", "cafe"], "food")).toEqual(["cafe"]);
});

test("toggling keeps the category order", () => {
  expect(toggleFilter(["cafe", "shopping"], "food")).toEqual(["food", "cafe", "shopping"]);
});
