import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { sharePage } from "@/lib/share";
import { renderWithMessages } from "@/test/render";
import { ShareButton } from "./ShareButton";

vi.mock("@/lib/share", () => ({ sharePage: vi.fn() }));

const share = vi.mocked(sharePage);

beforeEach(() => {
  window.history.replaceState(null, "", "/places/lakeside-kitchen");
});

afterEach(() => {
  vi.useRealTimers();
  share.mockReset();
});

async function press() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
  });
}

test("shares this page without its query", async () => {
  window.history.replaceState(null, "", "/places/x?utm=1#top");
  share.mockResolvedValue("shared");
  renderWithMessages(<ShareButton title="Lakeside Kitchen" />);

  await press();

  expect(share).toHaveBeenCalledWith({ title: "Lakeside Kitchen", url: `${window.location.origin}/places/x` });
});

test("says the link was copied, for a moment", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  share.mockResolvedValue("copied");
  renderWithMessages(<ShareButton title="Lakeside Kitchen" />);

  await press();
  expect(screen.getByRole("status")).toHaveTextContent("Link copied");

  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
});

test("says what to do when it cannot share", async () => {
  share.mockResolvedValue("failed");
  renderWithMessages(<ShareButton title="Lakeside Kitchen" />);

  await press();

  expect(screen.getByRole("status")).toHaveTextContent(
    "Couldn't share this page. Copy the address from your browser instead.",
  );
});

test("stays quiet after a share or a cancel", async () => {
  renderWithMessages(<ShareButton title="Lakeside Kitchen" />);

  for (const outcome of ["shared", "cancelled"] as const) {
    share.mockResolvedValue(outcome);
    await press();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  }
});
