import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { FilterChips } from "./FilterChips";

function chips() {
  return within(screen.getByRole("group", { name: "Filters" })).getAllByRole("button");
}

test("shows the six category chips, then Events and Notices", () => {
  renderWithMessages(<FilterChips selected={[]} onToggle={() => {}} />);

  expect(chips().map((chip) => chip.textContent)).toEqual([
    "Food",
    "Cafes",
    "Bars",
    "Activities",
    "Shopping",
    "Facilities",
    "Events",
    "Notices",
  ]);
});

test("marks the selected chips as pressed", () => {
  renderWithMessages(<FilterChips selected={["food", "bar", "notice"]} onToggle={() => {}} />);

  expect(chips().map((chip) => [chip.textContent, chip.getAttribute("aria-pressed")])).toEqual([
    ["Food", "true"],
    ["Cafes", "false"],
    ["Bars", "true"],
    ["Activities", "false"],
    ["Shopping", "false"],
    ["Facilities", "false"],
    ["Events", "false"],
    ["Notices", "true"],
  ]);
});

test("reports the chip that was pressed", async () => {
  const onToggle = vi.fn();
  renderWithMessages(<FilterChips selected={[]} onToggle={onToggle} />);

  await userEvent.click(screen.getByRole("button", { name: "Cafes" }));

  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(onToggle).toHaveBeenCalledWith("cafe");
});

test("reports the Events and Notices chips by kind", async () => {
  const onToggle = vi.fn();
  renderWithMessages(<FilterChips selected={[]} onToggle={onToggle} />);

  await userEvent.click(screen.getByRole("button", { name: "Events" }));
  await userEvent.click(screen.getByRole("button", { name: "Notices" }));

  expect(onToggle.mock.calls).toEqual([["event"], ["notice"]]);
});

test("each chip carries the colour of its markers as a dot", () => {
  renderWithMessages(<FilterChips selected={[]} onToggle={() => {}} />);

  const dot = (name: string) => screen.getByRole("button", { name }).querySelector('[data-slot="kind-dot"]');
  expect(dot("Cafes")).toHaveStyle({ backgroundColor: "#92400e" });
  expect(dot("Facilities")).toHaveStyle({ backgroundColor: "#1d4ed8" });
  expect(dot("Events")).toHaveStyle({ backgroundColor: "#0e7490" });
  expect(dot("Notices")).toHaveStyle({ backgroundColor: "#b91c1c" });
  expect(dot("Cafes")).toHaveAttribute("aria-hidden", "true");
});
