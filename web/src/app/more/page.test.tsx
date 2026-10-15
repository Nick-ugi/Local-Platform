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

test("About says what the service is and where its information comes from", () => {
  renderWithMessages(<AboutPage />);

  expect(screen.getByRole("heading", { level: 1, name: "About Queenstown Local" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Where the information comes from" })).toBeInTheDocument();
  expect(screen.getAllByRole("listitem")).toHaveLength(3);
  expect(screen.getByText(/the original is right/)).toBeInTheDocument();
});
