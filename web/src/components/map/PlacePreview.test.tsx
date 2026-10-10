import type { PlaceMarker } from "@queenstown/shared";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { PlacePreview } from "./PlacePreview";

const marker: PlaceMarker = {
  kind: "place",
  slug: "lakeside-kitchen",
  latitude: -45.0322,
  longitude: 168.661,
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
};

test("shows the name, category label and distance", () => {
  renderWithMessages(<PlacePreview marker={marker} distanceText="350 m" onClose={() => {}} />);

  expect(screen.getByRole("heading", { name: "Lakeside Kitchen" })).toBeInTheDocument();
  expect(screen.getByText("Food")).toBeInTheDocument();
  expect(screen.getByText("350 m")).toBeInTheDocument();
});

test("links to the place", () => {
  renderWithMessages(<PlacePreview marker={marker} distanceText={null} onClose={() => {}} />);

  expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", "/places/lakeside-kitchen");
});

test("leaves the distance out when it is unknown", () => {
  renderWithMessages(<PlacePreview marker={marker} distanceText={null} onClose={() => {}} />);

  // The line under the name holds the category and nothing after it.
  expect(screen.getByText("Food").parentElement).toHaveTextContent(/^Food$/);
});

test("Close reports back", async () => {
  const onClose = vi.fn();
  renderWithMessages(<PlacePreview marker={marker} distanceText="350 m" onClose={onClose} />);

  await userEvent.click(screen.getByRole("button", { name: "Close" }));

  expect(onClose).toHaveBeenCalledTimes(1);
});
