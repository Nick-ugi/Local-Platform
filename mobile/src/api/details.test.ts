import { ApiError } from "@queenstown/shared";
import { getEvent } from "./events";
import { getNotice } from "./notices";
import { getPlace, getPlaces } from "./places";

const fetchMock = jest.fn();

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function calledUrl() {
  return fetchMock.mock.calls[0][0] as string;
}

const emptyPage = { items: [], page: 1, size: 20, total: 0 };

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});

test("a list without conditions runs from the centre of Queenstown", async () => {
  answer(200, emptyPage);

  await getPlaces({});

  expect(calledUrl()).toBe("http://10.0.2.2:8080/api/v1/places");
});

test("a list names its category, words, position and page", async () => {
  answer(200, emptyPage);

  await getPlaces({
    category: "cafe",
    q: "  flat white ",
    position: { latitude: -45.031234, longitude: 168.662567 },
    page: 2,
  });

  expect(calledUrl()).toBe(
    "http://10.0.2.2:8080/api/v1/places?category=cafe&q=flat%20white&lat=-45.0312&lng=168.6626&page=2",
  );
});

test("the first page is not named", async () => {
  answer(200, emptyPage);

  await getPlaces({ page: 1, q: "  " });

  expect(calledUrl()).toBe("http://10.0.2.2:8080/api/v1/places");
});

test("a detail escapes its slug", async () => {
  answer(200, { slug: "a b" });

  await expect(getPlace("a b")).resolves.toEqual({ slug: "a b" });

  expect(calledUrl()).toBe("http://10.0.2.2:8080/api/v1/places/a%20b");
});

test.each([404, 400])("a detail the server does not have (%i) is null", async (status) => {
  answer(status, { code: "NOT_FOUND", detail: "Not found." });

  await expect(getEvent("gone")).resolves.toBeNull();
});

test("any other failure is still an error", async () => {
  answer(500, { code: "INTERNAL_ERROR", detail: "Something went wrong." });

  await expect(getNotice("x")).rejects.toBeInstanceOf(ApiError);
  expect(calledUrl()).toBe("http://10.0.2.2:8080/api/v1/notices/x");
});
