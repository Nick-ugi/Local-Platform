import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { BackLink } from "./BackLink";

const router = vi.hoisted(() => ({ back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function setHistoryIndex(index: number) {
  Object.defineProperty(window, "navigation", {
    value: { currentEntry: { index } },
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  router.back.mockReset();
});

afterEach(() => {
  Reflect.deleteProperty(window, "navigation");
});

/**
 * Renders the link inside a wrapper that records whether the link itself cancelled the click,
 * then cancels it so jsdom does not attempt a real page load.
 */
function renderBackLink() {
  const click = { cancelledByLink: null as boolean | null };
  renderWithMessages(
    <div
      onClick={(event) => {
        click.cancelledByLink = event.defaultPrevented;
        event.preventDefault();
      }}
    >
      <BackLink fallbackHref="/explore" />
    </div>,
  );
  return click;
}

function clickBack() {
  fireEvent.click(screen.getByRole("link", { name: "Back" }));
}

test("is a link to the fallback page named Back", () => {
  renderBackLink();

  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/explore");
});

test("goes back in history when this site has an earlier entry", () => {
  setHistoryIndex(1);
  const click = renderBackLink();

  clickBack();

  expect(router.back).toHaveBeenCalledOnce();
  expect(click.cancelledByLink).toBe(true);
});

// Someone who arrived from a search result has no earlier page of this site: Back must not
// send them out of the site, it follows the link to the fallback page instead.
test("follows the link when there is nowhere to go back to", () => {
  setHistoryIndex(0);
  const click = renderBackLink();

  clickBack();

  expect(router.back).not.toHaveBeenCalled();
  expect(click.cancelledByLink).toBe(false);
});

test("follows the link when the browser has no Navigation API", () => {
  const click = renderBackLink();

  clickBack();

  expect(router.back).not.toHaveBeenCalled();
  expect(click.cancelledByLink).toBe(false);
});
