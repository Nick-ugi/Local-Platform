import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import ErrorPage from "./error";

function renderErrorPage() {
  const reset = vi.fn();
  const retry = vi.fn();
  const error = new Error("connect ECONNREFUSED 127.0.0.1:8080");
  renderWithMessages(<ErrorPage error={error} reset={reset} retry={retry} />);
  return { reset, retry };
}

test("explains the failure and keeps the error itself off the screen", () => {
  renderErrorPage();

  expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("ECONNREFUSED");
});

// reset() only redraws the error boundary; the page data comes from the server, so it has to be
// fetched again, which is what retry() does.
test("Try again fetches the page again instead of only redrawing it", async () => {
  const { reset, retry } = renderErrorPage();

  await userEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(retry).toHaveBeenCalledOnce();
  expect(reset).not.toHaveBeenCalled();
});
