import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { LocateButton } from "./LocateButton";

test("is a button named for what it does", async () => {
  const onClick = vi.fn();
  renderWithMessages(<LocateButton onClick={onClick} busy={false} />);

  const button = screen.getByRole("button", { name: "Show my location" });
  expect(button).toBeEnabled();
  expect(button).toHaveAttribute("aria-busy", "false");
  await userEvent.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
});

test("cannot be pressed again while the position is being found", async () => {
  const onClick = vi.fn();
  renderWithMessages(<LocateButton onClick={onClick} busy />);

  const button = screen.getByRole("button", { name: "Show my location" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  await userEvent.click(button);

  expect(onClick).not.toHaveBeenCalled();
});
