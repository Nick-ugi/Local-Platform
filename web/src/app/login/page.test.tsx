import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import LoginPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

test("Log in offers to email the operator about a forgotten password", () => {
  vi.stubEnv("CONTACT_EMAIL", "hello@queenstownlocal.example");
  renderWithMessages(<LoginPage />);

  expect(screen.getByText(/Forgot your password\?/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Email us" })).toHaveAttribute(
    "href",
    "mailto:hello@queenstownlocal.example?subject=Forgotten%20password&body=The%20email%20address%20of%20my%20account%3A%20",
  );
});

test("without a contact address, Log in points to the project's issues, as the legal pages do", () => {
  renderWithMessages(<LoginPage />);

  expect(screen.getByRole("link", { name: "Ask on GitHub Issues" })).toHaveAttribute(
    "href",
    "https://github.com/Nick-ugi/Local-Platform/issues",
  );
  expect(screen.queryByRole("link", { name: "Email us" })).not.toBeInTheDocument();
});
