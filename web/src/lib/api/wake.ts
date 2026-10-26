/** Long enough for a sleeping free-tier backend to start; the request only has to get there. */
const WAKE_TIMEOUT_MS = 90_000;

/**
 * Asks the backend's health once, so a backend that was asleep starts waking (docs/07-deployment.md:
 * free Render services sleep when idle and take up to a minute to start). The answer does not matter
 * and a failure is not one: this only gets the backend going before the first visitor's request.
 */
export async function wakeBackend(fetchFn: typeof fetch, base: string): Promise<void> {
  try {
    await fetchFn(`${base.replace(/\/+$/, "")}/actuator/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
    });
  } catch {
    // Asleep, starting or unreachable: the pages say so themselves when they need the backend.
  }
}
