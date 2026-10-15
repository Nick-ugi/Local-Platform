export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/**
 * Shares a page with the browser's share sheet, or copies its address where there is none or it
 * fails. Never rejects: the caller tells the visitor what happened from the outcome.
 *
 * A visitor closing the share sheet is "cancelled", not a failure, and nothing is copied. Both
 * APIs are missing on a page opened over plain http (a development address on a phone), which
 * gives "failed".
 */
export async function sharePage(data: { title: string; url: string }): Promise<ShareOutcome> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if ((error as { name?: unknown } | null)?.name === "AbortError") {
        return "cancelled";
      }
    }
  }

  try {
    if (typeof navigator.clipboard?.writeText !== "function") {
      return "failed";
    }
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}
