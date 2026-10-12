import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { SearchBox } from "./SearchBox";

const nav = vi.hoisted(() => ({ pathname: "/", search: "", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ push: nav.push }),
}));

function at(pathname: string, search = "") {
  nav.pathname = pathname;
  nav.search = search;
}

function input() {
  return screen.getByRole("searchbox", { name: "Search places" });
}

beforeEach(() => {
  at("/");
  nav.push.mockReset();
});

test("is a search form that works without scripts", () => {
  renderWithMessages(<SearchBox />);

  const form = screen.getByRole("search");
  expect(form.tagName).toBe("FORM");
  expect(form).toHaveAttribute("action", "/search");
  expect((form as HTMLFormElement).method).toBe("get");
  expect(input()).toHaveAttribute("name", "q");
  expect(input()).toHaveAttribute("maxLength", "100");
});

test("goes to the results", async () => {
  renderWithMessages(<SearchBox />);

  await userEvent.type(input(), "pizza{Enter}");

  expect(nav.push).toHaveBeenCalledTimes(1);
  expect(nav.push).toHaveBeenCalledWith("/search?q=pizza");
});

test("tidies the keyword on the way", async () => {
  renderWithMessages(<SearchBox />);

  await userEvent.type(input(), "  wood   fired {Enter}");

  expect(nav.push).toHaveBeenCalledWith("/search?q=wood+fired");
});

test("does not search for nothing", async () => {
  renderWithMessages(<SearchBox />);

  await userEvent.type(input(), "   {Enter}");

  expect(nav.push).not.toHaveBeenCalled();
});

test("shows the keyword on the search screen", () => {
  at("/search", "q=pizza");
  renderWithMessages(<SearchBox />);

  expect(input()).toHaveValue("pizza");
});

test("starts empty on every other screen", () => {
  at("/explore", "q=pizza");
  renderWithMessages(<SearchBox />);

  expect(input()).toHaveValue("");
});

test("follows the address to a new keyword", () => {
  at("/search", "q=pizza");
  const { rerender } = renderWithMessages(<SearchBox />);

  at("/search", "q=coffee");
  rerender(<SearchBox />);

  expect(input()).toHaveValue("coffee");
});

test("offers to clear only when there is something to clear", async () => {
  renderWithMessages(<SearchBox />);
  expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();

  await userEvent.type(input(), "p");

  expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
});

test("clears the keyword and hands the cursor back", async () => {
  at("/search", "q=pizza");
  renderWithMessages(<SearchBox />);

  await userEvent.click(screen.getByRole("button", { name: "Clear search" }));

  expect(input()).toHaveValue("");
  expect(input()).toHaveFocus();
  // Clearing is not a search.
  expect(nav.push).not.toHaveBeenCalled();
});
