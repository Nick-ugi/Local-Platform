// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GET } from "./route";

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://api.test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function backendAnswers(status: number, body: string, contentType: string) {
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response(body, { status, headers: { "Content-Type": contentType } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

test("forwards the path and query to the backend", async () => {
  const fetchMock = backendAnswers(200, '{"markers":[],"truncated":false}', "application/json");

  await GET(new Request("http://web.test/api/v1/map/markers?west=1&filter=food,cafe"));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/v1/map/markers?west=1&filter=food,cafe");
});

test("falls back to localhost when no base URL is set", async () => {
  vi.stubEnv("API_BASE_URL", "");
  const fetchMock = backendAnswers(200, "{}", "application/json");

  await GET(new Request("http://web.test/api/v1/places/x"));

  expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/api/v1/places/x");
});

test("passes the status, body and content type through", async () => {
  const problem = '{"title":"Not Found","status":404,"detail":"Place not found.","code":"NOT_FOUND"}';
  backendAnswers(404, problem, "application/problem+json");

  const response = await GET(new Request("http://web.test/api/v1/places/nope"));

  expect(response.status).toBe(404);
  expect(response.headers.get("Content-Type")).toBe("application/problem+json");
  expect(await response.text()).toBe(problem);
});

test("keeps an encoded path segment as one segment", async () => {
  const fetchMock = backendAnswers(200, "{}", "application/json");

  await GET(new Request("http://web.test/api/v1/places/a%2Fb%20c"));

  expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/v1/places/a%2Fb%20c");
});

test("does not forward a path that climbs out of /api/v1", async () => {
  const fetchMock = backendAnswers(200, '{"status":"UP"}', "application/json");

  const response = await GET(new Request("http://web.test/api/v1/%2e%2e/%2e%2e/actuator/health"));

  expect(response.status).toBe(404);
  expect(response.headers.get("Content-Type")).toBe("application/problem+json");
  expect(await response.json()).toMatchObject({ status: 404, code: "NOT_FOUND" });
  expect(fetchMock).not.toHaveBeenCalled();
});

test("answers 502 when the backend cannot be reached", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed", { cause: new Error("connect ECONNREFUSED api.test:80") });
    }),
  );
  const logged = vi.spyOn(console, "error").mockImplementation(() => {});

  const response = await GET(new Request("http://web.test/api/v1/map/markers?west=1"));
  const text = await response.text();

  expect(response.status).toBe(502);
  expect(response.headers.get("Content-Type")).toBe("application/problem+json");
  expect(JSON.parse(text)).toMatchObject({ status: 502, code: "INTERNAL_ERROR" });
  expect(text).not.toContain("api.test");
  expect(logged).toHaveBeenCalledTimes(1);
});

test("does not forward the visitor's cookies or authorization", async () => {
  const fetchMock = backendAnswers(200, "{}", "application/json");

  await GET(
    new Request("http://web.test/api/v1/map/markers", {
      headers: { Cookie: "session=secret", Authorization: "Bearer secret" },
    }),
  );

  const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
  expect(headers.has("cookie")).toBe(false);
  expect(headers.has("authorization")).toBe(false);
});
