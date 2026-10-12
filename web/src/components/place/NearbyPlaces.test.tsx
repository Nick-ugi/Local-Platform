import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { getPlaces } from "@/lib/api/places";
import { locate, wasLocationGranted } from "@/lib/geo/location";
import type { ListQuery } from "@/lib/places/listUrl";
import { pageOf, placeSummary } from "@/test/places";
import { renderWithMessages } from "@/test/render";
import { NearbyPlaces } from "./NearbyPlaces";

vi.mock("@/lib/api/places", () => ({ getPlaces: vi.fn() }));
vi.mock("@/lib/geo/location", () => ({ locate: vi.fn(), wasLocationGranted: vi.fn() }));

const getPlacesMock = vi.mocked(getPlaces);
const locateMock = vi.mocked(locate);

const query: ListQuery = { category: null, q: null, page: 1 };
const lakefront = { latitude: -45.0331, longitude: 168.6597 };
const seoul = { latitude: 37.5665, longitude: 126.978 };

const fromServer = pageOf([
  placeSummary({ slug: "lakeside-kitchen", name: "Lakeside Kitchen" }),
  placeSummary({ slug: "harbour-coffee", name: "Harbour Coffee", category: "cafe" }),
]);
const fromLakefront = pageOf([
  placeSummary({ slug: "harbour-coffee", name: "Harbour Coffee", category: "cafe", distanceM: 120 }),
  placeSummary({ slug: "lakeside-kitchen", name: "Lakeside Kitchen", distanceM: 350 }),
]);

function placeNames() {
  return screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
}

function renderList(initial = fromServer) {
  return renderWithMessages(<NearbyPlaces query={query} initial={initial} emptyText="No places yet." />);
}

beforeEach(() => {
  getPlacesMock.mockReset();
  // A first visit: the browser has not been asked for the position yet.
  vi.mocked(wasLocationGranted).mockReset().mockResolvedValue(false);
  locateMock.mockReset().mockResolvedValue({ status: "unavailable" });
});

test("starts with the server's list and an offer", () => {
  renderList();

  expect(placeNames()).toEqual(["Lakeside Kitchen", "Harbour Coffee"]);
  expect(screen.getByText("Nearest first")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Use my location" })).toBeInTheDocument();
  expect(screen.queryByText(/\d m$/)).toBeNull();
  expect(getPlacesMock).not.toHaveBeenCalled();
});

test("sorts by the visitor's position on request", async () => {
  locateMock.mockResolvedValue({ status: "inside", position: lakefront });
  getPlacesMock.mockResolvedValue(fromLakefront);
  renderList();

  await userEvent.click(screen.getByRole("button", { name: "Use my location" }));

  expect(await screen.findByText("350 m")).toBeInTheDocument();
  expect(placeNames()).toEqual(["Harbour Coffee", "Lakeside Kitchen"]);
  expect(getPlacesMock.mock.calls[0][0]).toEqual({ ...query, position: lakefront });
  expect(screen.getByText("From your location")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Use my location" })).toBeNull();
});

test("a visitor who allowed it earlier gets distances without asking", async () => {
  vi.mocked(wasLocationGranted).mockResolvedValue(true);
  locateMock.mockResolvedValue({ status: "inside", position: lakefront });
  getPlacesMock.mockResolvedValue(fromLakefront);

  renderList();

  expect(await screen.findByText("350 m")).toBeInTheDocument();
});

test("marks the list busy while it is being sorted", async () => {
  locateMock.mockResolvedValue({ status: "inside", position: lakefront });
  getPlacesMock.mockReturnValue(new Promise(() => {}));
  renderList();

  await userEvent.click(screen.getByRole("button", { name: "Use my location" }));

  await waitFor(() => expect(screen.getByRole("list")).toHaveAttribute("aria-busy", "true"));
  // The server's list stays readable meanwhile.
  expect(placeNames()).toEqual(["Lakeside Kitchen", "Harbour Coffee"]);
});

test("says that location is turned off", async () => {
  locateMock.mockResolvedValue({ status: "denied" });
  renderList();

  await userEvent.click(screen.getByRole("button", { name: "Use my location" }));

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Location is turned off for this site. Turn it on in your browser settings to see distances.",
  );
  expect(placeNames()).toEqual(["Lakeside Kitchen", "Harbour Coffee"]);
  expect(getPlacesMock).not.toHaveBeenCalled();
  // The offer stays: the visitor may turn location on and press again.
  expect(screen.getByRole("button", { name: "Use my location" })).toBeInTheDocument();
});

test("says that the visitor is outside the area", async () => {
  locateMock.mockResolvedValue({ status: "outside", position: seoul });
  renderList();

  await userEvent.click(screen.getByRole("button", { name: "Use my location" }));

  expect(await screen.findByRole("status")).toHaveTextContent(
    "You're outside the Queenstown area, so places are ordered from the centre of Queenstown.",
  );
  // A position outside the area is never sent.
  expect(getPlacesMock).not.toHaveBeenCalled();
});

test("says when the position cannot be found", async () => {
  renderList();

  await userEvent.click(screen.getByRole("button", { name: "Use my location" }));

  expect(await screen.findByRole("status")).toHaveTextContent("We couldn't find your location.");
});

test("offers to try again when sorting fails", async () => {
  locateMock.mockResolvedValue({ status: "inside", position: lakefront });
  getPlacesMock.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(fromLakefront);
  renderList();

  await userEvent.click(screen.getByRole("button", { name: "Use my location" }));

  expect(await screen.findByRole("status")).toHaveTextContent("We couldn't sort by your location.");
  expect(placeNames()).toEqual(["Lakeside Kitchen", "Harbour Coffee"]);

  await userEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByText("350 m")).toBeInTheDocument();
  expect(screen.queryByText("We couldn't sort by your location.")).toBeNull();
});

test("an empty list shows only the message", () => {
  renderList(pageOf([]));

  expect(screen.getByText("No places yet.")).toBeInTheDocument();
  expect(screen.queryByText("Nearest first")).toBeNull();
  expect(screen.queryByRole("button", { name: "Use my location" })).toBeNull();
});
