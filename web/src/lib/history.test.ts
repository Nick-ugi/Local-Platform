import { afterEach, expect, test } from "vitest";
import { canGoBackInApp } from "./history";

function setNavigation(value: unknown) {
  Object.defineProperty(window, "navigation", { value, configurable: true, writable: true });
}

afterEach(() => {
  Reflect.deleteProperty(window, "navigation");
});

test("can go back when an earlier entry of this site exists", () => {
  setNavigation({ currentEntry: { index: 2 } });

  expect(canGoBackInApp()).toBe(true);
});

test("cannot go back on the first entry of this site", () => {
  setNavigation({ currentEntry: { index: 0 } });

  expect(canGoBackInApp()).toBe(false);
});

test("cannot go back when the browser has no Navigation API", () => {
  expect(canGoBackInApp()).toBe(false);

  setNavigation({ currentEntry: null });
  expect(canGoBackInApp()).toBe(false);
});
