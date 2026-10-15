import { afterEach, expect, test, vi } from "vitest";
import { sharePage } from "./share";

const page = { title: "Lakeside Kitchen", url: "https://queenstownlocal.example/places/lakeside-kitchen" };

/** Replaces navigator.share and navigator.clipboard for one test. Leaving one out removes it. */
function stubNavigator({ share, writeText }: { share?: unknown; writeText?: unknown }) {
  vi.stubGlobal("navigator", {
    ...window.navigator,
    share,
    clipboard: writeText ? { writeText } : undefined,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("uses the browser's share sheet", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  const writeText = vi.fn();
  stubNavigator({ share, writeText });

  await expect(sharePage(page)).resolves.toBe("shared");
  expect(share).toHaveBeenCalledWith(page);
  expect(writeText).not.toHaveBeenCalled();
});

test("a cancelled share is not an error", async () => {
  const share = vi.fn().mockRejectedValue(new DOMException("Share canceled", "AbortError"));
  const writeText = vi.fn();
  stubNavigator({ share, writeText });

  await expect(sharePage(page)).resolves.toBe("cancelled");
  expect(writeText).not.toHaveBeenCalled();
});

test("copies the link where sharing is missing", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  stubNavigator({ writeText });

  await expect(sharePage(page)).resolves.toBe("copied");
  expect(writeText).toHaveBeenCalledWith(page.url);
});

test("copies the link where sharing fails", async () => {
  const share = vi.fn().mockRejectedValue(new DOMException("Not allowed", "NotAllowedError"));
  const writeText = vi.fn().mockResolvedValue(undefined);
  stubNavigator({ share, writeText });

  await expect(sharePage(page)).resolves.toBe("copied");
  expect(writeText).toHaveBeenCalledWith(page.url);
});

test("reports when neither works", async () => {
  stubNavigator({});
  await expect(sharePage(page)).resolves.toBe("failed");

  stubNavigator({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
  await expect(sharePage(page)).resolves.toBe("failed");
});
