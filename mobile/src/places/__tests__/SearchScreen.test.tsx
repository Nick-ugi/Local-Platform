import type { PlaceSummary } from "@queenstown/shared";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { getPlaces } from "@/api/places";
import { locate } from "@/geo/location";
import { renderScreen } from "@/test/render";
import { SearchScreen } from "../SearchScreen";

jest.mock("@/api/places", () => ({ getPlaces: jest.fn() }));
jest.mock("@/geo/location", () => ({ locate: jest.fn() }));

const coffee: PlaceSummary = {
  slug: "harbour-coffee",
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
  address: "5 Marine Parade",
  imageUrl: null,
  latitude: -45.0335,
  longitude: 168.659,
  distanceM: null,
};

const handlers = { onSubmit: jest.fn(), onOpen: jest.fn(), onExplore: jest.fn() };

async function openSearch(q: string) {
  renderScreen(<SearchScreen q={q} {...handlers} />);
  await act(async () => {});
}

beforeEach(() => {
  jest.mocked(locate).mockResolvedValue({ status: "denied" });
  jest.mocked(getPlaces).mockReset();
  jest.mocked(getPlaces).mockResolvedValue({ items: [coffee], page: 1, size: 20, total: 1 });
  Object.values(handlers).forEach((handler) => handler.mockReset());
});

test("before a search there is a hint and nothing is asked for", async () => {
  await openSearch("");

  expect(screen.getByText("Search for a place by name or keyword.")).toBeOnTheScreen();
  expect(getPlaces).not.toHaveBeenCalled();
});

test("submitting sends the tidied words; blank words stay on the screen", async () => {
  await openSearch("");
  const box = screen.getByLabelText("Search places");

  fireEvent.changeText(box, "   ");
  fireEvent(box, "submitEditing");
  expect(handlers.onSubmit).not.toHaveBeenCalled();

  fireEvent.changeText(box, "  wood   fired ");
  fireEvent(box, "submitEditing");
  expect(handlers.onSubmit).toHaveBeenCalledWith("wood fired");
});

test("the results say how many there are and open the place", async () => {
  await openSearch("coffee");

  expect(getPlaces).toHaveBeenCalledWith(
    { category: null, q: "coffee", position: null },
    { signal: expect.any(AbortSignal) },
  );
  expect(screen.getByLabelText("Search places")).toHaveDisplayValue("coffee");
  expect(screen.getByText("1 result")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("link", { name: /Harbour Coffee/ }));
  expect(handlers.onOpen).toHaveBeenCalledWith(coffee);
});

test("no match says so and leads to Explore", async () => {
  jest.mocked(getPlaces).mockResolvedValue({ items: [], page: 1, size: 20, total: 0 });
  await openSearch("sushi");

  expect(screen.getByText("No places match “sushi”.")).toBeOnTheScreen();
  fireEvent.press(screen.getByRole("button", { name: "Go to Explore" }));
  expect(handlers.onExplore).toHaveBeenCalledTimes(1);
});

test("the clear button empties the box", async () => {
  await openSearch("coffee");

  fireEvent.press(screen.getByRole("button", { name: "Clear search" }));

  expect(screen.getByLabelText("Search places")).toHaveDisplayValue("");
});
