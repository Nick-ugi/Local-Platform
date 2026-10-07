import { expect, test } from "vitest";
import { MENU, activeMenu } from "./menu";

// The table in docs/02-information-architecture.md, section 4.
test.each([
  ["/", "map"],
  ["/explore", "explore"],
  ["/explore/food", "explore"],
  ["/search", "explore"],
  ["/places/lakeside-kitchen", "explore"],
  ["/notices", "local"],
  ["/notices/shotover-street-road-works", "local"],
  ["/events", "local"],
  ["/events/lakefront-night-market", "local"],
  ["/more", "more"],
  ["/about", "more"],
  ["/privacy", "more"],
  ["/terms", "more"],
  ["/login", "more"],
  ["/signup", "more"],
  ["/favorites", "more"],
])("%s activates %s", (pathname, key) => {
  expect(activeMenu(pathname)).toBe(key);
});

// The last three are property names every JavaScript object already has.
test.each([
  "/nope",
  "/explorer",
  "/placesx/a",
  "/eventsful",
  "/moreover",
  "/constructor",
  "/toString",
  "/__proto__",
])(
  "%s activates nothing",
  (pathname) => {
    expect(activeMenu(pathname)).toBeNull();
  },
);

test("a trailing slash does not change the result", () => {
  expect(activeMenu("/explore/")).toBe("explore");
  expect(activeMenu("/notices/a/")).toBe("local");
});

test("the Local menu links to the notices list", () => {
  expect(MENU.find((item) => item.key === "local")?.href).toBe("/notices");
});
