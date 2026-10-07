import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import ErrorPage from "./error";

test("offers a retry and keeps the error itself off the screen", async () => {
  const reset = vi.fn();
  const error = new Error("connect ECONNREFUSED 127.0.0.1:8080");

  renderWithMessages(<ErrorPage error={error} reset={reset} />);

  expect(screen.getByRole("heading", { level: 1, name: "Something went wrong" })).toBeInTheDocument();
  expect(document.body.textContent).not.toContain("ECONNREFUSED");

  await userEvent.click(screen.getByRole("button", { name: "Try again" }));

  expect(reset).toHaveBeenCalledOnce();
});
