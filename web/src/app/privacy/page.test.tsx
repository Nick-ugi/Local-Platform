import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import TermsPage from "../terms/page";
import PrivacyPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

afterEach(() => {
  vi.unstubAllEnvs();
});

test("Privacy Policy says what is collected and how to reach the operator", () => {
  vi.stubEnv("CONTACT_EMAIL", "hello@queenstownlocal.example");
  renderWithMessages(<PrivacyPage />);

  expect(screen.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeInTheDocument();
  expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "What we collect" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Your location" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "hello@queenstownlocal.example" })).toHaveAttribute(
    "href",
    "mailto:hello@queenstownlocal.example",
  );
});

test("Privacy Policy describes the cookies as they are: the sign-in ones are hidden from scripts, the marker is not", () => {
  renderWithMessages(<PrivacyPage />);

  expect(screen.getByRole("heading", { name: "Cookies and storage" }).nextElementSibling).toHaveTextContent(
    "Cookies keep you signed in. The ones that hold your sign-in cannot be read by the page's scripts; " +
      "one more, which holds nothing but the fact that you are signed in, can be. Your browser also keeps the map " +
      "position for the current tab. There are no advertising or tracking cookies.",
  );
});

test("without a contact address the pages point to the project's issues", () => {
  renderWithMessages(<PrivacyPage />);
  expect(screen.getByRole("link", { name: "GitHub Issues" })).toHaveAttribute(
    "href",
    "https://github.com/Nick-ugi/Local-Platform/issues",
  );
  expect(screen.queryByRole("link", { name: /@/ })).not.toBeInTheDocument();
});

test("Terms say the original source is right and give a contact", () => {
  vi.stubEnv("CONTACT_EMAIL", "hello@queenstownlocal.example");
  renderWithMessages(<TermsPage />);

  expect(screen.getByRole("heading", { level: 1, name: "Terms of Use" })).toBeInTheDocument();
  expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  expect(screen.getByText(/the original is right/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "hello@queenstownlocal.example" })).toBeInTheDocument();
});
