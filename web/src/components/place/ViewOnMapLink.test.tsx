import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { renderWithMessages } from "@/test/render";
import { ViewOnMapLink } from "./ViewOnMapLink";

const kitchen = { slug: "lakeside-kitchen", latitude: -45.0322, longitude: 168.661 };

/** Renders the link inside a wrapper that cancels the click, so jsdom does not try to load a page. */
function renderLink(place = kitchen) {
  renderWithMessages(
    <div onClick={(event) => event.preventDefault()}>
      <ViewOnMapLink place={place} />
    </div>,
  );
  return screen.getByRole("link", { name: "View on map" });
}

beforeEach(() => {
  window.sessionStorage.clear();
});

test("links to the map with the place selected", () => {
  expect(renderLink()).toHaveAttribute("href", "/?place=lakeside-kitchen");
});

test("encodes the slug", () => {
  expect(renderLink({ ...kitchen, slug: "a b&c" })).toHaveAttribute("href", "/?place=a%20b%26c");
});

test("leaves the map's position alone until it is pressed", () => {
  renderLink();

  expect(window.sessionStorage.getItem("map.camera")).toBeNull();
});

test("opens the map on the place", () => {
  window.sessionStorage.setItem("map.camera", JSON.stringify({ latitude: -45.0195, longitude: 168.732, zoom: 12 }));

  fireEvent.click(renderLink());

  // The map starts from the saved position, so the place is on screen when it opens.
  expect(JSON.parse(window.sessionStorage.getItem("map.camera") ?? "null")).toEqual({
    latitude: -45.0322,
    longitude: 168.661,
    zoom: 16,
  });
});

test("selects an event or a notice by its own parameter", () => {
  renderWithMessages(
    <div onClick={(event) => event.preventDefault()}>
      <ViewOnMapLink place={kitchen} kind="event" />
      <ViewOnMapLink place={kitchen} kind="notice" />
    </div>,
  );

  expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
    "/?event=lakeside-kitchen",
    "/?notice=lakeside-kitchen",
  ]);
});
