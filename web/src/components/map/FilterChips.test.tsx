import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { FilterChips } from "./FilterChips";

function chips() {
  return within(screen.getByRole("group", { name: "Filters" })).getAllByRole("button");
}

test("shows the six category chips in order", () => {
  renderWithMessages(<FilterChips selected={[]} onToggle={() => {}} />);

  expect(chips().map((chip) => chip.textContent)).toEqual([
    "Food",
    "Cafes",
    "Bars",
    "Activities",
    "Shopping",
    "Facilities",
  ]);
});

test("marks the selected chips as pressed", () => {
  renderWithMessages(<FilterChips selected={["food", "bar"]} onToggle={() => {}} />);

  expect(chips().map((chip) => [chip.textContent, chip.getAttribute("aria-pressed")])).toEqual([
    ["Food", "true"],
    ["Cafes", "false"],
    ["Bars", "true"],
    ["Activities", "false"],
    ["Shopping", "false"],
    ["Facilities", "false"],
  ]);
});

test("reports the chip that was pressed", async () => {
  const onToggle = vi.fn();
  renderWithMessages(<FilterChips selected={[]} onToggle={onToggle} />);

  await userEvent.click(screen.getByRole("button", { name: "Cafes" }));

  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(onToggle).toHaveBeenCalledWith("cafe");
});
