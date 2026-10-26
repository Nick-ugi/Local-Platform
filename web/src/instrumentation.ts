import { backendBaseUrl } from "@/lib/api/client";
import { wakeBackend } from "@/lib/api/wake";

/**
 * Runs once as a Next.js server starts. On a free host the web app and the backend both sleep when
 * idle; when a visitor wakes the web app, this wakes the backend at the same time instead of after
 * the first page asks for data. It does not wait for the answer, so the site is ready as before.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    void wakeBackend(fetch, backendBaseUrl());
  }
}
