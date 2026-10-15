import { ApiError } from "@queenstown/shared";
import { apiBaseUrl, apiGet } from "./client";
import { getMarkers } from "./map";

const fetchMock = jest.fn();

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});

test("calls the backend the emulator sees by default", async () => {
  answer(200, { ok: true });

  await expect(apiGet("/places")).resolves.toEqual({ ok: true });

  expect(apiBaseUrl()).toBe("http://10.0.2.2:8080");
  expect(fetchMock).toHaveBeenCalledWith("http://10.0.2.2:8080/api/v1/places", { signal: undefined });
});

test("calls the configured backend", async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = "http://192.168.0.10:8080";
  answer(200, {});

  await apiGet("/places");

  expect(fetchMock.mock.calls[0][0]).toBe("http://192.168.0.10:8080/api/v1/places");
});

test("a Problem Details answer is an ApiError", async () => {
  answer(400, { code: "VALIDATION_FAILED", detail: "Validation failed.", errors: [{ field: "west", message: "x" }] });

  const error = await apiGet("/map/markers").catch((e: unknown) => e);

  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ status: 400, code: "VALIDATION_FAILED", errors: [{ field: "west", message: "x" }] });
});

test("a backend that cannot be reached is a NETWORK_ERROR", async () => {
  fetchMock.mockRejectedValue(new TypeError("Network request failed"));

  await expect(apiGet("/places")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
});

test("asks for the markers of a box and a filter", async () => {
  answer(200, { markers: [], truncated: false });
  const signal = new AbortController().signal;

  await getMarkers({ west: 168.65, south: -45.04, east: 168.67, north: -45.02 }, ["food", "cafe"], { signal });

  expect(fetchMock).toHaveBeenCalledWith(
    "http://10.0.2.2:8080/api/v1/map/markers?west=168.65&south=-45.04&east=168.67&north=-45.02&filter=food%2Ccafe",
    { signal },
  );
});
