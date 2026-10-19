import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { resetForTests } from "@/auth/session";
import { fakeApi, tokens } from "@/test/fakeApi";
import { renderAdmin } from "@/test/renderAdmin";

const kitchen = {
  id: 7,
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  description: null,
  address: "12 Beach Street",
  latitude: -45.0322,
  longitude: 168.661,
  openingHours: null,
  phone: null,
  website: null,
  imageUrl: null,
  source: "Business website",
  sourceUrl: "https://lakesidekitchen.example",
  status: "public",
  createdAt: "2026-10-01T12:30:00Z",
  updatedAt: "2026-10-01T12:30:00Z",
};

const page = (items: unknown[]) => ({ items, page: 1, size: 20, total: items.length });

type Call = { method: string; path: string; body: unknown };

/** A signed-in admin (a stored refresh token) and an admin API answered by `answer`. */
function signedIn(answer: (call: Call) => { status: number; body?: unknown }) {
  sessionStorage.setItem("admin.refreshToken", "refresh-0");
  return fakeApi((call) => (call.path === "/api/v1/auth/refresh" ? { status: 200, body: tokens("admin") } : answer(call)));
}

beforeEach(() => resetForTests());
afterEach(() => vi.unstubAllGlobals());

test("without a session the admin goes to Log in, and an ordinary account is refused", async () => {
  fakeApi(({ path }) => (path === "/api/v1/auth/login" ? { status: 200, body: tokens("user") } : { status: 204 }));
  const router = renderAdmin("/places");

  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  await userEvent.type(screen.getByLabelText("Email"), "user@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "secret password");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("This account cannot use the admin.");
  expect(router.state.location.pathname).toBe("/login");
});

test("too many tries at Log in says to wait", async () => {
  fakeApi(({ path }) =>
    path === "/api/v1/auth/login"
      ? { status: 429, body: { code: "TOO_MANY_REQUESTS", status: 429, detail: "x" } }
      : { status: 204 },
  );
  renderAdmin("/login");

  await userEvent.type(await screen.findByLabelText("Email"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "secret password");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Too many tries. Wait a few minutes and try again.");
});

test("an admin who logs in comes back to the screen that asked", async () => {
  fakeApi(({ path }) =>
    path === "/api/v1/auth/login" ? { status: 200, body: tokens("admin") } : { status: 200, body: page([]) },
  );
  const router = renderAdmin("/events?status=private");

  await userEvent.type(await screen.findByLabelText("Email"), "admin@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "secret password");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));

  await waitFor(() => expect(router.state.location.pathname).toBe("/events"));
  expect(router.state.location.search).toBe("?status=private");
});

test("the list shows every place with its status and filters through the API", async () => {
  const calls = signedIn(({ path }) =>
    path.startsWith("/api/v1/admin/places")
      ? { status: 200, body: page([kitchen, { ...kitchen, id: 8, name: "Old Cafe", category: "cafe", status: "private" }]) }
      : { status: 404 },
  );
  renderAdmin("/places");

  const table = await screen.findByRole("table");
  expect(within(table).getByText("Lakeside Kitchen")).toBeInTheDocument();
  expect(within(table).getByText("Private")).toBeInTheDocument();
  expect(within(table).getAllByText("2 Oct 2026")).toHaveLength(2);

  await userEvent.selectOptions(screen.getByLabelText("All status"), "private");
  await userEvent.type(screen.getByLabelText("Search by name"), "cafe{Enter}");

  await waitFor(() =>
    expect(calls.at(-1)?.path).toBe("/api/v1/admin/places?status=private&q=cafe&size=20"),
  );
});

test("a new place checks the required fields before sending anything", async () => {
  const calls = signedIn(() => ({ status: 500 }));
  renderAdmin("/places/new");

  await userEvent.click(await screen.findByRole("button", { name: "Save" }));

  expect(screen.getByRole("alert")).toHaveTextContent("Some fields need fixing.");
  expect(screen.getByLabelText(/^Name/)).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByLabelText(/^Latitude/)).toHaveAttribute("aria-invalid", "true");
  expect(calls.filter((call) => call.path.startsWith("/api/v1/admin"))).toHaveLength(0);
});

test("the subtype is chosen only for a facility", async () => {
  signedIn(() => ({ status: 500 }));
  renderAdmin("/places/new");

  const subtype = await screen.findByLabelText(/^Subtype/);
  expect(subtype).toBeDisabled();

  await userEvent.selectOptions(screen.getByLabelText(/^Category/), "facility");
  expect(subtype).toBeEnabled();
});

test("a new place is sent whole and the list comes back", async () => {
  const calls = signedIn(({ method }) => (method === "POST" ? { status: 201, body: kitchen } : { status: 200, body: page([]) }));
  const router = renderAdmin("/places/new");

  await userEvent.type(await screen.findByLabelText(/^Name/), "Lakeside Kitchen");
  await userEvent.selectOptions(screen.getByLabelText(/^Category/), "food");
  await userEvent.type(screen.getByLabelText(/^Address/), "12 Beach Street");
  await userEvent.type(screen.getByLabelText(/^Latitude/), "-45.0322");
  await userEvent.type(screen.getByLabelText(/^Longitude/), "168.661");
  await userEvent.type(screen.getByLabelText(/^Source \*/), "Business website");
  await userEvent.type(screen.getByLabelText(/^Source URL/), "https://lakesidekitchen.example");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(router.state.location.pathname).toBe("/places"));
  const post = calls.find((call) => call.method === "POST" && call.path === "/api/v1/admin/places");
  expect(post?.body).toEqual({
    name: "Lakeside Kitchen",
    category: "food",
    subtype: null,
    description: null,
    address: "12 Beach Street",
    latitude: -45.0322,
    longitude: 168.661,
    openingHours: null,
    phone: null,
    website: null,
    imageUrl: null,
    source: "Business website",
    sourceUrl: "https://lakesidekitchen.example",
    status: "public",
  });
});

test("an existing place is loaded, and the server's field errors show under their fields", async () => {
  const calls = signedIn(({ method }) =>
    method === "PUT"
      ? {
          status: 400,
          body: { code: "VALIDATION_FAILED", detail: "Validation failed.", status: 400, errors: [{ field: "website", message: "must be an http or https address" }] },
        }
      : { status: 200, body: kitchen },
  );
  renderAdmin("/places/7");

  expect(await screen.findByDisplayValue("Lakeside Kitchen")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Edit place" })).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText(/^Website/), "ftp://x");
  await userEvent.click(screen.getByRole("radio", { name: "Private" }));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByText("must be an http or https address")).toBeInTheDocument();
  const put = calls.find((call) => call.method === "PUT");
  expect(put?.path).toBe("/api/v1/admin/places/7");
  expect(put?.body).toMatchObject({ website: "ftp://x", status: "private" });
});

test("an event's times are typed and sent in New Zealand time", async () => {
  const calls = signedIn(({ method }) =>
    method === "PUT"
      ? { status: 200, body: {} }
      : {
          status: 200,
          body: {
            id: 3,
            slug: "night-market",
            title: "Night Market",
            description: null,
            startsAt: "2026-10-16T04:00:00Z",
            endsAt: null,
            venueName: "Earnslaw Park",
            address: null,
            latitude: -45.0331,
            longitude: 168.6597,
            imageUrl: null,
            source: "Organiser",
            sourceUrl: "https://events.example",
            status: "public",
            createdAt: "2026-10-01T00:00:00Z",
            updatedAt: "2026-10-01T00:00:00Z",
          },
        },
  );
  renderAdmin("/events/3");

  const starts = await screen.findByLabelText(/^Starts/);
  expect(starts).toHaveValue("2026-10-16T17:00");
  await userEvent.type(screen.getByLabelText(/^Ends/), "2026-10-16T21:00");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
  expect(calls.find((call) => call.method === "PUT")?.body).toMatchObject({
    startsAt: "2026-10-16T17:00:00+13:00",
    endsAt: "2026-10-16T21:00:00+13:00",
  });
});

test("a notice may be saved without a location", async () => {
  const calls = signedIn(({ method }) => (method === "POST" ? { status: 201, body: {} } : { status: 200, body: page([]) }));
  renderAdmin("/notices/new");

  await userEvent.type(await screen.findByLabelText(/^Title/), "Water outage");
  await userEvent.selectOptions(screen.getByLabelText(/^Type/), "public-notice");
  await userEvent.type(screen.getByLabelText(/^From/), "2026-10-20T08:00");
  await userEvent.type(screen.getByLabelText(/^Summary/), "No water in Frankton.");
  await userEvent.type(screen.getByLabelText(/^Source organisation/), "QLDC");
  await userEvent.type(screen.getByLabelText(/^Original URL/), "https://qldc.example");
  await userEvent.click(screen.getByRole("checkbox", { name: /Official/ }));
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  const created = () => calls.find((call) => call.method === "POST" && call.path === "/api/v1/admin/notices");
  await waitFor(() => expect(created()).toBeDefined());
  expect(created()?.body).toMatchObject({
    type: "public-notice",
    startsAt: "2026-10-20T08:00:00+13:00",
    endsAt: null,
    latitude: null,
    longitude: null,
    isOfficial: true,
  });
});
