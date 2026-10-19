import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import AboutPage from "../about/page";
import MorePage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

test("More leads to About", () => {
  renderWithMessages(<MorePage />);

  expect(screen.getByRole("heading", { level: 1, name: "More" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
});

test("More ends with Privacy Policy and Terms, after the account rows", () => {
  renderWithMessages(<MorePage />);

  // docs/02-information-architecture.md: About → Log in or the account → Favorites → Privacy Policy, Terms.
  const names = screen.getAllByRole("link").map((link) => link.textContent?.replace("›", "").trim());
  expect(names[0]).toBe("About");
  expect(names.slice(-2)).toEqual(["Privacy Policy", "Terms of Use"]);
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  expect(screen.getByRole("link", { name: "Terms of Use" })).toHaveAttribute("href", "/terms");
});

test("About says what the service is and where its information comes from", () => {
  renderWithMessages(<AboutPage />);

  expect(screen.getByRole("heading", { level: 1, name: "About Queenstown Local" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Where the information comes from" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByText(/the original is right/)).toBeInTheDocument();
});

test("About credits OpenStreetMap and its licence for the place data", () => {
  renderWithMessages(<AboutPage />);

  expect(screen.getByRole("link", { name: "OpenStreetMap contributors" })).toHaveAttribute(
    "href",
    "https://www.openstreetmap.org/copyright",
  );
  expect(screen.getByRole("link", { name: "Open Database License" })).toHaveAttribute(
    "href",
    "https://opendatacommons.org/licenses/odbl/",
  );
});
