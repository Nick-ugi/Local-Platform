import type { PlaceSummary } from "@queenstown/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { AccountMenu } from "./AccountMenu";
import { AuthForm } from "./AuthForm";
import { FavoriteButton } from "./FavoriteButton";
import { FavoritesView } from "./FavoritesView";

const router = { replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), back: vi.fn() };
const navigation = { pathname: "/places/harbour-coffee", search: "" };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

type Call = { method: string; url: string; body: unknown };

/** This site's /api: each call goes to `answer`; the calls are kept. */
function site(answer: (call: Call) => { status: number; body?: unknown }) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const call = { method: init.method ?? "GET", url, body: typeof init.body === "string" ? JSON.parse(init.body) : undefined };
      calls.push(call);
      const { status, body } = answer(call);
      return new Response(body === undefined ? null : JSON.stringify(body), { status });
    }),
  );
  return calls;
}

const coffee: PlaceSummary = {
  slug: "harbour-coffee",
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
  address: "5 Marine Parade",
  imageUrl: null,
  latitude: -45.0335,
  longitude: 168.659,
  distanceM: null,
};

const signedOut = { status: 401, body: { code: "UNAUTHORIZED", status: 401, detail: "Sign in to continue." } };

/** The plain cookie the server sets beside the tokens (lib/auth/server.ts). */
function signedInCookie(on: boolean) {
  document.cookie = on ? "ql_signed_in=1; path=/" : "ql_signed_in=; path=/; max-age=0";
}

beforeEach(() => {
  signedInCookie(true);
  Object.values(router).forEach((fn) => fn.mockReset());
  navigation.pathname = "/places/harbour-coffee";
  navigation.search = "";
});
afterEach(() => vi.unstubAllGlobals());

test("logging in goes back to the screen named by ?next=", async () => {
  navigation.search = "next=%2Fplaces%2Fharbour-coffee%3Ffavorite%3D1";
  const calls = site(() => ({ status: 200, body: { user: { email: "kiri@example.com", role: "user" } } }));
  renderWithMessages(<AuthForm mode="login" />);

  await userEvent.type(screen.getByLabelText("Email"), " kiri@example.com ");
  await userEvent.type(screen.getByLabelText("Password"), "correct horse");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(calls[0]).toEqual({
    method: "POST",
    url: "/api/auth/login",
    body: { email: "kiri@example.com", password: "correct horse" },
  });
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/places/harbour-coffee?favorite=1"));
  expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute(
    "href",
    "/signup?next=%2Fplaces%2Fharbour-coffee%3Ffavorite%3D1",
  );
});

test("a wrong password says so and stays", async () => {
  site(() => ({ status: 401, body: { code: "INVALID_CREDENTIALS", status: 401, detail: "x" } }));
  renderWithMessages(<AuthForm mode="login" />);

  await userEvent.type(screen.getByLabelText("Email"), "kiri@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("The email or password is wrong.");
  expect(router.replace).not.toHaveBeenCalled();
});

test("too many tries says to wait", async () => {
  site(() => ({ status: 429, body: { code: "TOO_MANY_REQUESTS", status: 429, detail: "x" } }));
  renderWithMessages(<AuthForm mode="login" />);

  await userEvent.type(screen.getByLabelText("Email"), "kiri@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: "Log in" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Too many tries. Wait a few minutes and try again.");
});

test("sign up explains a used email and a short password", async () => {
  let answer: { status: number; body?: unknown } = {
    status: 409,
    body: { code: "EMAIL_ALREADY_USED", status: 409, detail: "x" },
  };
  site(() => answer);
  renderWithMessages(<AuthForm mode="signup" />);

  await userEvent.type(screen.getByLabelText("Email"), "kiri@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "short");
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("This email already has an account.");
  expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");

  answer = { status: 400, body: { code: "VALIDATION_FAILED", status: 400, detail: "x", errors: [{ field: "password", message: "size" }] } };
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Use at least 8 characters."));
});

test("a visitor who never signed in is not asked about", async () => {
  signedInCookie(false);
  const calls = site(() => signedOut);
  renderWithMessages(<FavoriteButton slug="harbour-coffee" />);

  await waitFor(() => expect(screen.getByRole("button", { name: "Save to favorites" })).toBeEnabled());
  expect(calls).toHaveLength(0);
});

test("More offers Log in to a visitor, and the account and Log out once signed in", async () => {
  site(() => signedOut);
  const { unmount } = renderWithMessages(<ul><AccountMenu /></ul>);
  expect(await screen.findByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Fmore");
  expect(screen.getByRole("link", { name: "Favorites" })).toHaveAttribute("href", "/favorites");
  unmount();

  const calls = site(({ url }) => (url === "/api/v1/me" ? { status: 200, body: { email: "kiri@example.com", role: "user" } } : { status: 204 }));
  renderWithMessages(<ul><AccountMenu /></ul>);
  expect(await screen.findByText("Signed in as kiri@example.com")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Log out" }));
  expect(calls.at(-1)).toMatchObject({ method: "POST", url: "/api/auth/logout" });
  expect(await screen.findByRole("link", { name: "Log in" })).toBeInTheDocument();
});

test("the heart sends a visitor to Log in and back to save", async () => {
  site(() => signedOut);
  renderWithMessages(<FavoriteButton slug="harbour-coffee" />);

  const heart = await screen.findByRole("button", { name: "Save to favorites" });
  await waitFor(() => expect(heart).toBeEnabled());
  await userEvent.click(heart);

  expect(router.push).toHaveBeenCalledWith("/login?next=%2Fplaces%2Fharbour-coffee%3Ffavorite%3D1");
});

test("back from Log in, the place is saved and the address tidied", async () => {
  navigation.search = "favorite=1";
  const calls = site(({ method }) => (method === "PUT" ? { status: 204 } : { status: 200, body: { items: [] } }));
  renderWithMessages(<FavoriteButton slug="harbour-coffee" />);

  expect(await screen.findByRole("button", { name: "Saved to favorites" })).toHaveAttribute("aria-pressed", "true");
  expect(calls.at(-1)).toEqual({ method: "PUT", url: "/api/v1/me/favorites/harbour-coffee", body: undefined });
  expect(router.replace).toHaveBeenCalledWith("/places/harbour-coffee", { scroll: false });
});

test("a signed-in visitor saves and removes with the heart", async () => {
  const calls = site(({ method }) => (method === "GET" ? { status: 200, body: { items: [coffee] } } : { status: 204 }));
  renderWithMessages(<FavoriteButton slug="harbour-coffee" />);

  await userEvent.click(await screen.findByRole("button", { name: "Saved to favorites" }));

  expect(calls.at(-1)).toMatchObject({ method: "DELETE", url: "/api/v1/me/favorites/harbour-coffee" });
  expect(screen.getByRole("button", { name: "Save to favorites" })).toHaveAttribute("aria-pressed", "false");
});

test("Favorites lists the saved places and the heart removes one", async () => {
  const calls = site(({ method }) => (method === "GET" ? { status: 200, body: { items: [coffee] } } : { status: 204 }));
  renderWithMessages(<FavoritesView />);

  expect(await screen.findByRole("link", { name: /Harbour Coffee/ })).toHaveAttribute("href", "/places/harbour-coffee");
  await userEvent.click(screen.getByRole("button", { name: "Remove Harbour Coffee from favorites" }));

  expect(calls.at(-1)).toMatchObject({ method: "DELETE" });
  expect(await screen.findByRole("link", { name: "Go to Explore" })).toHaveAttribute("href", "/explore");
});

test("Favorites asks a visitor to log in", async () => {
  site(() => signedOut);
  renderWithMessages(<FavoritesView />);

  expect(await screen.findByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=%2Ffavorites");
});
