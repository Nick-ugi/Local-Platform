import type { ErrorCode, ProblemDetail } from "@queenstown/shared";
import { backendBaseUrl } from "@/lib/api/client";

const PREFIX = "/api/v1/";

/**
 * Forwards a GET under /api/v1 to the backend, so that a browser only ever talks to this site.
 * Only the path and the query go along. The visitor's headers stay here: every API reached this
 * way is a public read.
 */
export async function GET(request: Request): Promise<Response> {
  // Parsing the URL has already resolved any "..", so a path that still starts with the prefix
  // cannot lead anywhere else on the backend.
  const { pathname, search } = new URL(request.url);
  if (!pathname.startsWith(PREFIX)) {
    return problem(404, "Not Found", "NOT_FOUND", "Not found.", pathname);
  }

  let answer: Response;
  try {
    answer = await fetch(`${backendBaseUrl()}${pathname}${search}`, { cache: "no-store" });
  } catch (cause) {
    console.error("The backend could not be reached.", cause);
    return problem(502, "Bad Gateway", "INTERNAL_ERROR", "The API could not be reached.", pathname);
  }

  const headers = new Headers();
  const contentType = answer.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  return new Response(answer.body, { status: answer.status, headers });
}

/** An error in the API's own format, for the failures that never reached the backend. */
function problem(status: number, title: string, code: ErrorCode, detail: string, instance: string): Response {
  const body: ProblemDetail = { title, status, detail, instance, code };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}
