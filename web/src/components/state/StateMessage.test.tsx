import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { StateMessage } from "./StateMessage";

test("shows the title as the page heading, the body, and the actions", () => {
  render(
    <StateMessage title="Page not found" body="Gone.">
      <a href="/">Go to Map</a>
    </StateMessage>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  expect(screen.getByText("Gone.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to Map" })).toHaveAttribute("href", "/");
});

test("renders without a body or actions", () => {
  const { container } = render(<StateMessage title="Loading…" />);

  expect(screen.getByRole("heading", { level: 1, name: "Loading…" })).toBeInTheDocument();
  expect(container.querySelector("p")).toBeNull();
  expect(screen.queryByRole("link")).toBeNull();
});
